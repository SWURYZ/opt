/**
 * Gesture Recognition Service
 * Model-driven pipeline:
 * 1) MediaPipe detects 21 landmarks
 * 2) Convert to 72-dim engineered features (same idea as training scripts)
 * 3) ONNX model infers gesture logits/probabilities
 * 4) Debounce + cooldown dispatches stable gesture events
 */
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import * as ort from "onnxruntime-web/wasm";

export type GestureLabel =
  | "one" | "two" | "three" | "four" | "five"
  | "six" | "seven" | "eight"
  | "fist" | "ok" | "thumbs_up" | "thumbs_down" | "none";

export interface GestureEvent {
  gesture: GestureLabel;
  timestamp: number;
}

type GestureCallback = (event: GestureEvent) => void;
type GestureMode = "wake" | "active";

// ── MediaPipe config ────────────────────────────────────────────────────────
// WASM 文件由 public/mediapipe/ 本地提供，避免 CDN 网络依赖
const APP_BASE_URL = import.meta.env.BASE_URL || "/";

function withBase(path: string): string {
  const cleanBase = APP_BASE_URL.endsWith("/") ? APP_BASE_URL : `${APP_BASE_URL}/`;
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${cleanBase}${cleanPath}`;
}

const WASM_BASE = withBase("mediapipe");
const HAND_MODEL_URL = withBase("mediapipe-models/hand_landmarker.task");
const GESTURE_MODEL_URL = withBase("models/gesture_model/gesture_model.onnx");
const GESTURE_LABELS_URL = withBase("models/gesture_model/labels.json");

const NUM_FEATURES = 72;

// ── Debounce config ─────────────────────────────────────────────────────────
/** Ms thumbs_up / thumbs_down must be held (deliberate mode-switch) */
const ACTIVATION_HOLD_MS = 1000;
/** Ms action gestures (fist, ok, numbers) must be held after Yaya is active */
const ACTION_HOLD_MS = 600;
/** Min ms between two emissions of the same gesture */
const SAME_GESTURE_COOLDOWN_MS = 1400;
/** Min ms between any two emissions */
const ANY_COOLDOWN_MS = 300;

// ── Module-level state (singleton) ──────────────────────────────────────────
let handLandmarker: HandLandmarker | null = null;
let gestureSession: ort.InferenceSession | null = null;
let gestureInputName = "";
let gestureLabels: string[] = [];
let rafId: number | null = null;
let videoEl: HTMLVideoElement | null = null;
let cameraStream: MediaStream | null = null;
let currentCallback: GestureCallback | null = null;
let currentMode: GestureMode = "wake";
let pauseCount = 0;

let latestModelGesture: GestureLabel = "none";
let inferenceInFlight = false;
let inferenceSeq = 0;

let pendingGesture: GestureLabel = "none";
let pendingStartTime = 0; // 当前手势首次出现的时间戳
let lastEmittedGesture: GestureLabel = "none";
let lastEmittedTime = 0;
let lastAnyTime = 0;

// ── Initialization ───────────────────────────────────────────────────────────
async function ensureInit(): Promise<void> {
  if (!handLandmarker) {
    const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
    const options = {
      runningMode: "VIDEO" as const,
      numHands: 1,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    };

    try {
      handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: HAND_MODEL_URL,
          delegate: "GPU",
        },
        ...options,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`MediaPipe GPU 初始化失败，当前设备或浏览器不支持 GPU 手势识别：${message}`);
    }
  }

  if (!gestureSession) {
    const labelsRes = await fetch(GESTURE_LABELS_URL);
    if (!labelsRes.ok) {
      throw new Error(`手势标签加载失败: ${labelsRes.status}`);
    }
    const labels = await labelsRes.json();
    if (!Array.isArray(labels) || labels.length === 0) {
      throw new Error("手势标签格式错误");
    }
    gestureLabels = labels.map((x) => String(x));

    const ortBase =
      typeof window !== "undefined"
        ? new URL(withBase("ort/"), window.location.origin).toString()
        : withBase("ort/");
    ort.env.wasm.wasmPaths = {
      mjs: new URL("ort-wasm-simd-threaded.js", ortBase).toString(),
      wasm: new URL("ort-wasm-simd-threaded.wasm", ortBase).toString(),
    };
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.proxy = false;
    gestureSession = await ort.InferenceSession.create(GESTURE_MODEL_URL, {
      executionProviders: ["wasm"],
      graphOptimizationLevel: "all",
    });
    gestureInputName = gestureSession.inputNames[0] ?? "";
    if (!gestureInputName) {
      throw new Error("手势模型输入节点缺失");
    }
    if (!gestureSession.outputNames.length) {
      throw new Error("手势模型输出节点缺失");
    }
  }
}

const VALID_GESTURES = new Set<GestureLabel>([
  "one", "two", "three", "four", "five",
  "six", "seven", "eight",
  "fist", "ok", "thumbs_up", "thumbs_down", "none",
]);

function asGestureLabel(value: string): GestureLabel {
  return VALID_GESTURES.has(value as GestureLabel) ? (value as GestureLabel) : "none";
}

function computeFeaturesFromLandmarks(lm: NormalizedLandmark[]): Float32Array {
  const points: number[][] = lm.map((p) => [p.x, p.y, p.z]);
  const wrist = points[0];

  const rel = points.map((p) => [p[0] - wrist[0], p[1] - wrist[1], p[2] - wrist[2]]);
  const handScale = Math.hypot(rel[9][0], rel[9][1], rel[9][2]) + 1e-6;
  const norm = rel.map((p) => [p[0] / handScale, p[1] / handScale, p[2] / handScale]);

  const out: number[] = [];
  for (let i = 0; i < 21; i += 1) {
    out.push(norm[i][0], norm[i][1], norm[i][2]);
  }

  const fingertips = [4, 8, 12, 16, 20];
  const mcps = [2, 5, 9, 13, 17];
  for (let i = 0; i < fingertips.length; i += 1) {
    const tip = norm[fingertips[i]];
    const mcp = norm[mcps[i]];
    const tipD = Math.hypot(tip[0], tip[1], tip[2]);
    const mcpD = Math.hypot(mcp[0], mcp[1], mcp[2]) + 1e-6;
    out.push(tipD / mcpD);
  }

  const thumbTip = norm[4];
  for (const idx of [8, 12, 16, 20]) {
    const t = norm[idx];
    out.push(Math.hypot(thumbTip[0] - t[0], thumbTip[1] - t[1], thumbTip[2] - t[2]));
  }

  return new Float32Array(out.slice(0, NUM_FEATURES));
}

function normalizeScores(values: number[]): number[] {
  if (values.length === 0) return values;
  const sum = values.reduce((a, b) => a + b, 0);
  if (sum > 0) {
    return values.map((v) => v / sum);
  }
  const max = Math.max(...values);
  const exps = values.map((v) => Math.exp(v - max));
  const expSum = exps.reduce((a, b) => a + b, 0) || 1;
  return exps.map((v) => v / expSum);
}

function extractScores(outputs: Record<string, ort.Tensor>): number[] {
  const tensors = Object.values(outputs);
  if (!tensors.length) {
    throw new Error("手势模型未返回输出张量");
  }

  for (const tensor of tensors) {
    const lastDim = tensor.dims[tensor.dims.length - 1] ?? 0;
    if ((tensor.dims.length === 2 || tensor.dims.length === 1) && lastDim === gestureLabels.length) {
      return Array.from(tensor.data as ArrayLike<number>).slice(0, gestureLabels.length);
    }
  }

  const shapeList = tensors.map((t) => `[${t.dims.join(",")}]`).join(", ");
  throw new Error(`手势模型输出维度与 labels.json 不匹配，输出=${shapeList}，标签数=${gestureLabels.length}`);
}

async function openGestureCamera(): Promise<MediaStream> {
  if (typeof window === "undefined" || typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("手势识别只能在浏览器端运行，服务器无法直接调用客户端摄像头");
  }

  return navigator.mediaDevices.getUserMedia({
    video: { width: 640, height: 480, facingMode: "user" },
    audio: false,
  });
}

async function createGestureVideo(stream: MediaStream): Promise<HTMLVideoElement> {
  const video = document.createElement("video");
  video.srcObject = stream;
  video.playsInline = true;
  video.muted = true;
  video.autoplay = true;
  video.style.cssText =
    "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;";
  document.body.appendChild(video);
  await video.play();
  return video;
}

async function classifyFromModel(lm: NormalizedLandmark[]): Promise<GestureLabel> {
  if (!gestureSession || !gestureInputName || gestureLabels.length === 0) {
    throw new Error("手势模型尚未初始化");
  }

  const features = computeFeaturesFromLandmarks(lm);
  if (features.length !== NUM_FEATURES) {
    throw new Error(`手势模型输入特征长度错误：期望 ${NUM_FEATURES}，实际 ${features.length}`);
  }

  const inputTensor = new ort.Tensor("float32", features, [1, NUM_FEATURES]);
  const outputs = await gestureSession.run({ [gestureInputName]: inputTensor });
  const rawScores = extractScores(outputs);
  if (rawScores.length !== gestureLabels.length) {
    throw new Error(`手势模型输出数量错误：期望 ${gestureLabels.length}，实际 ${rawScores.length}`);
  }

  const probs = normalizeScores(rawScores);
  let bestIdx = 0;
  for (let i = 1; i < probs.length; i += 1) {
    if (probs[i] > probs[bestIdx]) bestIdx = i;
  }
  return asGestureLabel(gestureLabels[bestIdx] ?? "none");
}

function detectWakeGesture(lm: NormalizedLandmark[]): GestureLabel {
  const thumbExtended = lm[4].y < lm[3].y && lm[3].y < lm[2].y;
  const fingersFolded =
    lm[8].y > lm[6].y &&
    lm[12].y > lm[10].y &&
    lm[16].y > lm[14].y &&
    lm[20].y > lm[18].y;

  return thumbExtended && fingersFolded ? "thumbs_up" : "none";
}

function resetGestureState(): void {
  pendingGesture     = "none";
  pendingStartTime   = 0;
  lastEmittedGesture = "none";
  lastEmittedTime    = 0;
  lastAnyTime        = 0;
  latestModelGesture = "none";
  inferenceInFlight  = false;
  inferenceSeq       += 1;
}

function canEmitGesture(gesture: GestureLabel): boolean {
  return currentMode === "active" || gesture === "thumbs_up";
}

// ── Detection loop ───────────────────────────────────────────────────────────
function processFrame(): void {
  if (!handLandmarker || !videoEl || videoEl.readyState < 2) {
    rafId = requestAnimationFrame(processFrame);
    return;
  }

  const now = performance.now();
  const result = handLandmarker.detectForVideo(videoEl, now);

  let detected: GestureLabel = "none";
  if (result.landmarks.length > 0) {
    const lm = result.landmarks[0];
    detected = currentMode === "wake" ? detectWakeGesture(lm) : latestModelGesture;

    if (currentMode === "active" && typeof window !== "undefined") {
      const wrist = lm[0];
      const p9 = lm[9], p4 = lm[4], p8 = lm[8];
      const dist = (a: typeof wrist, b: typeof wrist) =>
        Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
      const tipsToWrist = [
        dist(lm[8],  wrist), dist(lm[12], wrist),
        dist(lm[16], wrist), dist(lm[20], wrist),
      ];
      const mcpsToWrist = [
        dist(lm[5],  wrist), dist(lm[9],  wrist),
        dist(lm[13], wrist), dist(lm[17], wrist),
      ];
      const palmRefLength = dist(wrist, p9);
      const palmWidth = dist(lm[5], lm[17]);
      const pinchPx = Math.hypot(p4.x - p8.x, p4.y - p8.y, p4.z - p8.z);
      const pinchRatio = pinchPx / Math.max(palmWidth, 1e-4);

      window.dispatchEvent(new CustomEvent("yaya:hand", {
        detail: {
          timestamp: now,
          anchor: { x: p9.x, y: p9.y, z: p9.z },
          thumbTip: { x: p4.x, y: p4.y, z: p4.z },
          indexTip: { x: p8.x, y: p8.y, z: p8.z },
          pinchDistance: pinchPx,
          pinchRatio,
          palmWidth,
          tipsToWrist,
          mcpsToWrist,
          palmRefLength,
        },
      }));
    }

    if (currentMode === "active" && !inferenceInFlight) {
      inferenceInFlight = true;
      const seq = ++inferenceSeq;
      void classifyFromModel(lm)
        .then((gesture) => {
          if (seq === inferenceSeq) {
            latestModelGesture = gesture;
          }
        })
        .catch((err) => {
          console.warn("[GestureRec] ONNX inference failed", err);
          if (seq === inferenceSeq) {
            latestModelGesture = "none";
          }
        })
        .finally(() => {
          inferenceInFlight = false;
        });
    }
  } else {
    latestModelGesture = "none";
    inferenceSeq += 1;
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("yaya:hand-lost"));
    }
  }

  // Debounce: gesture must be held continuously for the required duration before emitting
  const isActivation = detected === "thumbs_up" || detected === "thumbs_down";
  const holdRequired = isActivation ? ACTIVATION_HOLD_MS : ACTION_HOLD_MS;

  if (detected !== "none" && detected === pendingGesture) {
    // 时间戳模式：手势须持续保持 holdRequired 才触发
    const heldMs = now - pendingStartTime;
    if (heldMs >= holdRequired) {
      const timeSinceLast = now - lastEmittedTime;
      const timeSinceAny  = now - lastAnyTime;
      const isSameAsLast  = detected === lastEmittedGesture;
      const cooldownOk    = !isSameAsLast
        ? timeSinceAny > ANY_COOLDOWN_MS
        : timeSinceLast > SAME_GESTURE_COOLDOWN_MS;

      if (cooldownOk && canEmitGesture(detected)) {
        lastEmittedGesture = detected;
        lastEmittedTime    = now;
        lastAnyTime        = now;
        pendingStartTime   = now; // 重置，下次需再持续 2 秒
        const evt: GestureEvent = { gesture: detected, timestamp: now };
        currentCallback?.(evt);
        // 全局广播：其它模块（如 3D 数字孪生视角控制）可监听
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent<GestureEvent>("yaya:gesture", { detail: evt }));
        }
      }
    }
  } else {
    pendingGesture   = detected;
    pendingStartTime = detected !== "none" ? now : 0;
    if (detected === "none") {
      lastEmittedGesture = "none";
    }
  }

  rafId = requestAnimationFrame(processFrame);
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Start gesture recognition.
 * Returns a cleanup function — call it to stop recognition and release camera.
 */
export async function startGestureRecognition(
  callback: GestureCallback,
  mode: GestureMode = "wake",
): Promise<() => void> {
  currentMode = mode;

  // 已在运行时只更新 callback / mode，不重启摄像头
  if (rafId !== null && videoEl !== null) {
    currentCallback = callback;
    return stopGestureRecognition;
  }

  currentCallback = callback;

  await ensureInit();

  const stream = await openGestureCamera();
  cameraStream = stream;
  videoEl = await createGestureVideo(stream);

  // Reset debounce state
  resetGestureState();

  rafId = requestAnimationFrame(processFrame);

  return stopGestureRecognition;
}

/** Human-readable error from a getUserMedia / MediaPipe failure. */
export function describeGestureError(err: unknown): string {
  if (err instanceof DOMException) {
    if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
      return "摄像头权限被拒绝，请在浏览器地址栏点击摄像头图标手动允许";
    }
    if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
      return "未检测到摄像头设备，请确认设备已连接";
    }
    if (err.name === "NotReadableError" || err.name === "TrackStartError") {
      return "摄像头被其他应用占用，请关闭后重试";
    }
  }
  const msg = err instanceof Error ? err.message : String(err);
  if (/服务器无法直接调用|浏览器端|mediaDevices|getUserMedia/i.test(msg)) {
    return "摄像头只能由浏览器页面调用，服务器无法直接打开客户端摄像头；请在 HTTPS 或 localhost 页面中使用手势识别";
  }
  if (/MediaPipe GPU|GPU delegate|delegate.*GPU/i.test(msg)) {
    return `MediaPipe GPU 初始化失败：${msg}`;
  }
  if (/onnx|wasm|InferenceSession|label|labels|model|模型|输出|输入节点|fetch/i.test(msg)) {
    return `手势识别模型加载失败：${msg}`;
  }
  return `手势识别启动失败：${msg}`;
}

export function setGestureRecognitionMode(mode: GestureMode): void {
  if (currentMode === mode) return;
  currentMode = mode;
  resetGestureState();
}

/** Stop gesture recognition and release all resources. */
export function stopGestureRecognition(): void {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  if (cameraStream) {
    cameraStream.getTracks().forEach((t) => t.stop());
    cameraStream = null;
  }
  if (videoEl) {
    videoEl.srcObject = null;
    videoEl.remove();
    videoEl = null;
  }
  currentCallback    = null;
  currentMode        = "wake";
  pauseCount         = 0;
  resetGestureState();
}

export function pauseGestureRecognition(): void {
  pauseCount += 1;
  if (pauseCount > 1) return;
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  if (cameraStream) {
    cameraStream.getTracks().forEach((t) => t.stop());
    cameraStream = null;
  }
  if (videoEl) {
    videoEl.srcObject = null;
    videoEl.remove();
    videoEl = null;
  }
  resetGestureState();
}

export async function resumeGestureRecognition(): Promise<void> {
  if (pauseCount === 0) return;
  pauseCount -= 1;
  if (pauseCount > 0) return;
  if (!currentCallback) return;
  if (rafId !== null && cameraStream) return;

  try {
    const stream = await openGestureCamera();
    cameraStream = stream;
    videoEl = await createGestureVideo(stream);

    lastEmittedTime = 0;
    lastAnyTime     = 0;
    rafId = requestAnimationFrame(processFrame);
  } catch (err) {
    console.warn("[GestureRec] resume failed", err);
  }
}

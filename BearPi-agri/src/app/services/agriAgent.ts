import { withApiBase } from "../lib/env";

export interface AgriAgentChatRequest {
  question: string;
  userId?: string;
  conversationId?: string;
}

interface StreamEvent {
  event: string;
  data: string;
}

interface StreamCallbacks {
  onToken: (token: string) => void;
  onThinking?: (token: string) => void;
  onContext?: (conversationId: string) => void;
  onStatus?: (message: string) => void;
  onDone?: (data: string) => void;
  onError?: (message: string) => void;
}

type ParsedChunk =
  | { kind: "answer"; text: string }
  | { kind: "thinking"; text: string }
  | { kind: "context"; conversationId: string }
  | { kind: "status"; text: string }
  | { kind: "done" }
  | { kind: "error"; text: string }
  | { kind: "ignore" };

const INTERNAL_MSG_TYPES = new Set([
  "knowledge_recall",
  "tool_call",
  "tool_response",
  "tool_result",
  "function_call",
  "function_response",
  "verbose",
  "debug",
  "trace",
]);

const THINKING_MSG_TYPES = new Set([
  "thinking",
  "reasoning",
  "reasoning_content",
]);

function parseSseBlock(block: string): StreamEvent | null {
  const lines = block.split("\n");
  let event = "message";
  const dataLines: string[] = [];

  for (const line of lines) {
    if (!line || line.startsWith(":")) {
      continue;
    }
    if (line.startsWith("event:")) {
      event = line.slice(6).trim() || "message";
      continue;
    }
    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  if (dataLines.length === 0 && event === "message") {
    return null;
  }

  return {
    event,
    data: dataLines.join("\n"),
  };
}

export async function streamAgriAgentChat(
  request: AgriAgentChatRequest,
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
) {
  const res = await fetch(withApiBase("/api/v1/agri-agent/chat/stream"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(request),
    signal,
  });

  await consumeSseStream(res, callbacks);
}

export async function streamAgriAgentChatWithImage(
  params: {
    image: File;
    question: string;
    userId?: string;
    conversationId?: string;
  },
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
) {
  const form = new FormData();
  form.append("image", params.image);
  form.append("question", params.question);
  if (params.userId) form.append("userId", params.userId);
  if (params.conversationId) form.append("conversationId", params.conversationId);

  const res = await fetch(withApiBase("/api/v1/agri-agent/chat/stream/with-image"), {
    method: "POST",
    headers: { Accept: "text/event-stream" },
    body: form,
    signal,
  });

  await consumeSseStream(res, callbacks);
}

function parseJsonChunk(data: string): ParsedChunk {
  let json: unknown;
  try {
    json = JSON.parse(data);
  } catch {
    // Non-JSON raw text (e.g. bare reasoning from Coze) should NOT be shown as answer
    if (looksLikeReasoningText(data) || looksLikeInternalMetadata(data)) {
      return { kind: "ignore" };
    }
    return { kind: "answer", text: data };
  }

  if (!json || typeof json !== "object") {
    return { kind: "ignore" };
  }

  const obj = json as Record<string, unknown>;
  const msgType = String(obj.msg_type ?? obj.type ?? obj.event ?? "").toLowerCase();

  const conversationId = firstString(obj.conversationId, obj.conversation_id, obj.contextId);
  if (conversationId) {
    return { kind: "context", conversationId };
  }

  if (msgType === "done" || msgType.includes("completed") || msgType.includes("finish")) {
    return { kind: "done" };
  }

  if (msgType === "error") {
    return { kind: "error", text: firstString(obj.message, obj.msg, obj.error, obj.data) || "请求失败" };
  }

  if (THINKING_MSG_TYPES.has(msgType)) {
    const text = readableThinkingText(obj);
    return text ? { kind: "thinking", text } : { kind: "ignore" };
  }

  if (INTERNAL_MSG_TYPES.has(msgType)) {
    const text = readableInternalEventText(msgType, obj);
    return text ? { kind: "thinking", text } : { kind: "ignore" };
  }

  if (msgType === "answer" || msgType === "message" || msgType === "delta") {
    const text = extractAnswerText(obj);
    return text ? { kind: "answer", text } : { kind: "ignore" };
  }

  const token = firstString(obj.token, obj.answer, obj.text, obj.delta);
  if (token) {
    const cleaned = cleanAnswerText(token);
    return cleaned ? { kind: "answer", text: cleaned } : { kind: "ignore" };
  }

  const content = obj.content;
  if (typeof content === "string" && !looksLikeInternalJson(content)) {
    const cleaned = cleanAnswerText(content);
    return cleaned ? { kind: "answer", text: cleaned } : { kind: "ignore" };
  }

  return { kind: "ignore" };
}

function extractAnswerText(obj: Record<string, unknown>): string | null {
  const direct = firstString(obj.token, obj.answer, obj.text, obj.delta, obj.message);
  if (direct && !looksLikeInternalJson(direct)) return cleanAnswerText(direct);

  const content = obj.content;
  if (typeof content === "string") {
    if (looksLikeInternalJson(content)) return null;
    return cleanAnswerText(content);
  }
  return cleanAnswerText(extractText(content));
}

function extractText(value: unknown): string | null {
  if (typeof value === "string") {
    if (!value.trim() || looksLikeInternalJson(value)) return null;
    return value;
  }
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;
  return firstString(obj.content, obj.answer, obj.text, obj.message, obj.delta);
}

function readableThinkingText(obj: Record<string, unknown>): string | null {
  const raw = firstString(obj.reasoning_content, obj.reasoning, obj.thinking, obj.content, obj.delta)
    || extractText(obj.data);
  if (!raw) return null;
  return summarizeReasoning(raw);
}

function readableInternalEventText(msgType: string, obj: Record<string, unknown>): string | null {
  if (msgType === "knowledge_recall") {
    return summarizeKnowledgeRecall(obj.data);
  }
  if (msgType.includes("tool") || msgType.includes("function")) {
    return summarizeToolEvent(msgType, obj);
  }
  return statusTextFor(msgType);
}

function summarizeKnowledgeRecall(data: unknown): string {
  const parsed = parseMaybeJsonObject(data);
  // Safety check: if parsed data contains internal Coze metadata, don't leak it
  if (parsed && (parsed.ori_req || parsed.bot_context || parsed.scene_context)) {
    return "正在检索农业知识库...";
  }
  const chunks = Array.isArray(parsed?.chunks) ? parsed.chunks : [];
  if (chunks.length === 0) return "正在检索农业知识库：暂未召回到高相关资料。";

  const titles = chunks
    .slice(0, 3)
    .map((chunk) => {
      const item = chunk as Record<string, unknown>;
      return firstString(item.title, item.name, item.document_name, item.dataset_name, item.content)?.slice(0, 36);
    })
    .filter(Boolean);
  return titles.length
    ? `正在检索农业知识库：召回 ${chunks.length} 条资料（${titles.join("、")}）。`
    : `正在检索农业知识库：召回 ${chunks.length} 条相关资料。`;
}

function summarizeToolEvent(msgType: string, obj: Record<string, unknown>): string {
  const name = firstString(obj.name, obj.tool_name, obj.function_name)
    || (msgType.includes("function") ? "函数工具" : "农业分析工具");
  const content = firstString(obj.content, obj.data, obj.response_for_model);
  if (content?.includes("RPCError") || content?.includes("限流")) {
    return `${name} 暂时不可用，正在准备保守回答。`;
  }
  if (msgType.includes("response") || msgType.includes("result")) {
    return `${name} 已返回结果，正在整理答案。`;
  }
  return `正在调用 ${name}。`;
}

function summarizeReasoning(raw: string): string | null {
  const text = raw.replace(/<\|FunctionCallBegin\|>[\s\S]*?(?:<\|FunctionCallEnd\|>|$)/g, "").trim();
  if (!text || looksLikeInternalJson(text)) return null;

  const steps: string[] = [];
  if (/图片|图像|水果|作物|识别/.test(text)) steps.push("识别用户正在询问图片内容。");
  if (/知识库|召回|检索/.test(text)) steps.push("检查是否需要检索农业知识库。");
  if (/工具|imgUnderstand|tupianlijie/.test(text)) steps.push("判断需要调用图片理解工具。" );
  if (/限流|失败|不可用|RPCError/.test(text)) steps.push("图片理解工具暂时不可用，准备降级回答。" );
  if (/苹果|红富士/.test(text)) steps.push("根据可见外观特征判断可能是苹果类水果。" );
  if (/结论|依据|建议|风险|复查/.test(text)) steps.push("按结论、依据、建议和复查点组织回复。" );

  if (steps.length > 0) return Array.from(new Set(steps)).join("\n");

  const sentence = text
    .split(/[。！？\n]/)
    .map((s) => s.trim())
    .find((s) => s.length >= 8 && !looksLikeReasoningText(s));
  return sentence ? `正在分析：${sentence.slice(0, 80)}。` : "芽芽正在分析问题并组织答案。";
}

function parseMaybeJsonObject(value: unknown): Record<string, unknown> | null {
  if (!value) return null;
  if (typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value !== "string") return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function cleanAnswerText(value: string | null): string | null {
  if (!value) return null;
  let text = value;

  if (text.includes("正式回答：")) {
    text = text.slice(text.lastIndexOf("正式回答：") + "正式回答：".length);
  }
  text = text.replace(/<\|FunctionCallBegin\|>[\s\S]*?(?:<\|FunctionCallEnd\|>|$)/g, "");
  text = text.replace(/RPCError\{[^}]*}/g, "");
  text = text.replace(/^\s*(用户现在|首先|不对，|所以应该|然后按照|看系统提示|按照要求|现在组织语言|接下来)[\s\S]*?(?=(?:ryz你好|【结论】|当前工具数据|这是|您好|你好|同学好))/g, "");
  text = text.trim();
  if (!text || looksLikeInternalJson(text) || looksLikeReasoningText(text)) return null;
  return text;
}

function looksLikeReasoningText(value: string): boolean {
  const text = value.trim();
  return /^(用户现在|首先|不对，|所以应该|然后按照|看系统提示|按照要求|现在组织语言|接下来可以)/.test(text)
    || text.includes("<|FunctionCallBegin|>")
    || text.includes("tupianlijie-imgUnderstand")
    || text.includes("应该调用")
    || text.includes("调用工具")
    || text.includes("组织语言")
    || text.includes("我的角色是")
    || text.includes("可以问问用户")
    || /引导用户|按照.*要求|因为是.*助手/.test(text);
}

function looksLikeInternalMetadata(value: string): boolean {
  const text = value.trim();
  // Detect raw Coze internal event JSON blobs that leaked through
  if (text.length > 200 && (text.includes("ori_req") || text.includes("bot_context")
      || text.includes("scene_context") || text.includes("connector_id")
      || text.includes("coze_api_key") || text.includes("bot_persona"))) {
    return true;
  }
  return false;
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return String(value);
  }
  return null;
}

function looksLikeInternalJson(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return false;
  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;
    const msgType = String(parsed?.msg_type ?? parsed?.type ?? "").toLowerCase();
    return INTERNAL_MSG_TYPES.has(msgType) || THINKING_MSG_TYPES.has(msgType)
      || Boolean(parsed?.ori_req)
      || Boolean(parsed?.bot_context)
      || Boolean(parsed?.scene_context)
      || (typeof parsed?.data === "string" && parsed.data.length > 200);
  } catch {
    return false;
  }
}

async function consumeSseStream(res: Response, callbacks: StreamCallbacks) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `agri-agent stream request failed: ${res.status}`);
  }

  const handleParsed = (chunk: ParsedChunk) => {
    switch (chunk.kind) {
      case "answer":
        callbacks.onToken(chunk.text);
        break;
      case "thinking":
        callbacks.onThinking?.(chunk.text);
        break;
      case "context":
        callbacks.onContext?.(chunk.conversationId);
        break;
      case "status":
        callbacks.onStatus?.(chunk.text);
        break;
      case "done":
        callbacks.onDone?.("[DONE]");
        break;
      case "error":
        callbacks.onError?.(chunk.text);
        break;
      case "ignore":
        break;
    }
  };

  const reader = res.body?.getReader();
  if (!reader) {
    const text = await res.text();
    if (text.trim()) handleParsed(parseJsonChunk(text));
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  const handleEvent = (evt: StreamEvent) => {
    const data = evt.data;
    if (!data || data === "[DONE]") {
      callbacks.onDone?.(data);
      return;
    }
    // === FRONT-LINE DEFENSE: silently discard leaked internal metadata ===
    // This catches knowledge_recall/tool_call JSON blobs that somehow bypass
    // backend filtering, preventing them from reaching ANY callback.
    const hasInternalMarker = data.length > 80 && (
      data.includes("ori_req") || data.includes("bot_context")
      || data.includes("bot_persona") || data.includes("scene_context")
      || data.includes("connector_conversation_id") || data.includes("agent_schema")
    );
    if (hasInternalMarker) {
      return;
    }

    if (evt.event === "error") {
      callbacks.onError?.(data);
      return;
    }
    if (evt.event === "thinking") {
      const parsed = parseJsonChunk(data);
      if (parsed.kind === "thinking") callbacks.onThinking?.(parsed.text);
      // Silently skip non-actionable thinking events (raw reasoning text, etc.)
      // The UI already shows "芽芽正在思考..." based on message.status === "thinking"
      return;
    }
    if (evt.event === "tool_result") {
      callbacks.onStatus?.("农业分析工具已返回结果...");
      return;
    }
    if (evt.event === "context" || evt.event === "conversation" || evt.event === "conversationId") {
      callbacks.onContext?.(data);
      return;
    }

    handleParsed(parseJsonChunk(data));
  };

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() ?? "";
    for (const block of blocks) {
      const evt = parseSseBlock(block);
      if (evt) handleEvent(evt);
    }
    if (done) break;
  }

  const tail = buffer.trim();
  if (tail) {
    const evt = parseSseBlock(tail);
    if (evt) handleEvent(evt);
    else handleParsed(parseJsonChunk(tail));
  }
}

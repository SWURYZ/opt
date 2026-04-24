import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Power,
  Clock,
  Fan,
  Droplets,
  Sun,
  Plus,
  Trash2,
  CheckCircle,
  Loader,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import {
  sendManualControl,
  fetchDeviceStatus,
  fetchRealtimeDeviceStatus,
  fetchScheduleRules,
  createScheduleRule,
  toggleScheduleRule,
  deleteScheduleRule,
  type ScheduleRuleResponse,
  type DeviceStatusResponse,
  type RealtimeDeviceStatus,
} from "../services/deviceControl";
import { fetchAllConnectedDevices, type DeviceMappingResponse } from "../services/greenhouseMonitor";
import { useGreenhouses } from "../lib/greenhouseStore";
import { useVirtualSwitches, type VirtualSwitch } from "../lib/virtualSwitchStore";

type DeviceStatus = "on" | "off" | "loading" | "error";
type SwitchKey = "light" | "fan" | "water";

type GhControlState = {
  light: DeviceStatus;
  fan: DeviceStatus;
  water: DeviceStatus;
  feedback?: string;
};

const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
  blue: { bg: "bg-blue-50", text: "text-blue-600", icon: "text-blue-500" },
  cyan: { bg: "bg-cyan-50", text: "text-cyan-600", icon: "text-cyan-500" },
  yellow: { bg: "bg-yellow-50", text: "text-yellow-600", icon: "text-yellow-500" },
  red: { bg: "bg-red-50", text: "text-red-600", icon: "text-red-500" },
};

function normalizeGreenhouseName(code: string | null | undefined): string {
  if (!code) return "未分配";
  const raw = code.trim();
  const m1 = /GH[-_]?(\d{1,2})/i.exec(raw);
  if (m1) return `${parseInt(m1[1], 10)}号大棚`;
  const m2 = /^(\d{1,2})号?大?棚?$/.exec(raw);
  if (m2) return `${parseInt(m2[1], 10)}号大棚`;
  return raw;
}

function isHardwareDevice(d: DeviceMappingResponse): boolean {
  return !d.deviceType || d.deviceType.toUpperCase() !== "MOBILE_SCANNER";
}

function defaultGhState(): GhControlState {
  return { light: "off", fan: "off", water: "off" };
}

function applyRealtimeToState(status: RealtimeDeviceStatus): GhControlState {
  const light = status.led === "ON" ? "on" : "off";
  const fan = status.motor === "ON" ? "on" : "off";
  return { light, fan, water: fan };
}

function applyFallbackToState(status: DeviceStatusResponse): GhControlState {
  const light = status.ledStatus === "ON" ? "on" : "off";
  const fan = status.motorStatus === "ON" ? "on" : "off";
  return { light, fan, water: fan };
}

export function DeviceControl() {
  const { list: greenhouseList } = useGreenhouses();
  const [virtualSwitchMap, updateVirtualSwitch] = useVirtualSwitches();
  const [activeTab, setActiveTab] = useState<"manual" | "timer">("manual");
  const [boundByGreenhouse, setBoundByGreenhouse] = useState<Record<string, DeviceMappingResponse>>({});
  const [controlStates, setControlStates] = useState<Record<string, GhControlState>>({});
  const [timers, setTimers] = useState<ScheduleRuleResponse[]>([]);
  const [timerGreenhouse, setTimerGreenhouse] = useState("");
  const [showAddTimer, setShowAddTimer] = useState(false);
  const [newTimer, setNewTimer] = useState({
    ruleName: "补光灯定时",
    turnOnTime: "06:00",
    turnOffTime: "18:00",
    repeat: "DAILY",
    commandType: "LIGHT_CONTROL",
  });
  const [timerMessage, setTimerMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const greenhouseNames = useMemo(() => greenhouseList.map((g) => g.name), [greenhouseList]);

  const selectedTimerDeviceId = useMemo(() => {
    if (!timerGreenhouse) return "";
    return boundByGreenhouse[timerGreenhouse]?.deviceId || "";
  }, [boundByGreenhouse, timerGreenhouse]);

  const timerRows = useMemo(() => {
    if (!selectedTimerDeviceId) return [];
    return timers.filter((r) => r.deviceId === selectedTimerDeviceId);
  }, [timers, selectedTimerDeviceId]);

  const ensureControlState = useCallback((ghName: string) => {
    setControlStates((prev) => (prev[ghName] ? prev : { ...prev, [ghName]: defaultGhState() }));
  }, []);

  const syncDeviceState = useCallback(async (ghName: string, deviceId: string) => {
    try {
      const status = await fetchRealtimeDeviceStatus(deviceId);
      if (status) {
        setControlStates((prev) => ({
          ...prev,
          [ghName]: { ...applyRealtimeToState(status), feedback: prev[ghName]?.feedback },
        }));
        return;
      }
    } catch {
      // fallback below
    }

    try {
      const status = await fetchDeviceStatus(deviceId);
      if (status) {
        setControlStates((prev) => ({
          ...prev,
          [ghName]: { ...applyFallbackToState(status), feedback: prev[ghName]?.feedback },
        }));
      }
    } catch {
      // ignore errors to keep UI responsive
    }
  }, []);

  const refreshBoundDevices = useCallback(async () => {
    const nextByGh: Record<string, DeviceMappingResponse> = {};
    try {
      const rows = await fetchAllConnectedDevices();
      for (const d of rows.filter(isHardwareDevice)) {
        const ghName = normalizeGreenhouseName(d.greenhouseCode);
        if (ghName === "未分配") continue;
        if (!nextByGh[ghName]) nextByGh[ghName] = d;
      }
    } catch {
      // ignore fetch error; keep previous state
    }

    setBoundByGreenhouse(nextByGh);

    for (const ghName of greenhouseNames) ensureControlState(ghName);

    if (!timerGreenhouse || !greenhouseNames.includes(timerGreenhouse)) {
      setTimerGreenhouse(greenhouseNames[0] || "");
    }

    await Promise.all(
      Object.entries(nextByGh).map(async ([ghName, d]) => {
        await syncDeviceState(ghName, d.deviceId);
      }),
    );
  }, [ensureControlState, greenhouseNames, syncDeviceState, timerGreenhouse]);

  useEffect(() => {
    void refreshBoundDevices();
  }, [refreshBoundDevices]);

  useEffect(() => {
    // 未绑定真实设备的大棚，直接复用与 RealtimeMonitor 相同的虚拟开关状态
    setControlStates((prev) => {
      const next = { ...prev };
      for (const ghName of greenhouseNames) {
        if (boundByGreenhouse[ghName]?.deviceId) continue;
        const v: VirtualSwitch = virtualSwitchMap[ghName] ?? { led: false, motor: false, water: false };
        const old = next[ghName] ?? defaultGhState();
        next[ghName] = {
          ...old,
          light: v.led ? "on" : "off",
          fan: v.motor ? "on" : "off",
          water: v.water ? "on" : "off",
        };
      }
      return next;
    });
  }, [greenhouseNames, boundByGreenhouse, virtualSwitchMap]);

  useEffect(() => {
    // 绑定真实设备的大棚定时轮询，保持与 RealtimeMonitor 的开关状态一致
    const timer = window.setInterval(() => {
      for (const [ghName, d] of Object.entries(boundByGreenhouse)) {
        if (d?.deviceId) {
          void syncDeviceState(ghName, d.deviceId);
        }
      }
    }, 2000);
    return () => window.clearInterval(timer);
  }, [boundByGreenhouse, syncDeviceState]);

  const loadRules = useCallback(async () => {
    try {
      const rules = await fetchScheduleRules();
      setTimers(rules);
    } catch {
      // ignore errors
    }
  }, []);

  useEffect(() => {
    void loadRules();
  }, [loadRules]);

  async function handleToggle(ghName: string, key: SwitchKey) {
    const binding = boundByGreenhouse[ghName];
    const prevState = controlStates[ghName] || defaultGhState();

    if (!binding?.deviceId) {
      // 未绑定时写入共享虚拟开关 store，让 DeviceControl 与 RealtimeMonitor 同步
      const now = virtualSwitchMap[ghName] ?? { led: false, motor: false, water: false };
      if (key === "light") updateVirtualSwitch(ghName, { led: !now.led });
      if (key === "fan") updateVirtualSwitch(ghName, { motor: !now.motor });
      if (key === "water") updateVirtualSwitch(ghName, { water: !now.water });
      setControlStates((prev) => ({
        ...prev,
        [ghName]: { ...(prev[ghName] ?? defaultGhState()), feedback: "虚拟设备已切换（与大棚实况同步）" },
      }));
      return;
    }

    const commandType = key === "light" ? "LIGHT_CONTROL" : "MOTOR_CONTROL";
    const current = key === "light" ? prevState.light : key === "fan" ? prevState.fan : prevState.water;
    const targetAction = current === "on" ? "OFF" : "ON";

    setControlStates((prev) => {
      const now = prev[ghName] || defaultGhState();
      if (commandType === "MOTOR_CONTROL") {
        return {
          ...prev,
          [ghName]: { ...now, fan: "loading", water: "loading", feedback: undefined },
        };
      }
      return {
        ...prev,
        [ghName]: { ...now, light: "loading", feedback: undefined },
      };
    });

    try {
      const resp = await sendManualControl({
        deviceId: binding.deviceId,
        commandType,
        action: targetAction,
      });

      const success = resp.status === "SENT" || resp.status === "DELIVERED";
      const targetStatus: DeviceStatus = success ? (targetAction === "ON" ? "on" : "off") : "error";

      setControlStates((prev) => {
        const now = prev[ghName] || defaultGhState();
        if (commandType === "MOTOR_CONTROL") {
          return {
            ...prev,
            [ghName]: {
              ...now,
              fan: targetStatus,
              water: targetStatus,
              feedback: success ? "指令已下发" : resp.message,
            },
          };
        }
        return {
          ...prev,
          [ghName]: {
            ...now,
            light: targetStatus,
            feedback: success ? "指令已下发" : resp.message,
          },
        };
      });

      window.setTimeout(() => {
        void syncDeviceState(ghName, binding.deviceId);
      }, 1200);
    } catch {
      setControlStates((prev) => ({
        ...prev,
        [ghName]: {
          ...prevState,
          feedback: "网络错误，请检查后端服务是否启动",
        },
      }));
    }
  }

  async function addTimer() {
    if (!selectedTimerDeviceId) {
      setTimerMessage({ type: "error", text: "当前大棚未绑定设备，请先到设备登记进行绑定" });
      window.setTimeout(() => setTimerMessage(null), 2600);
      return;
    }
    if (newTimer.turnOnTime >= newTimer.turnOffTime) {
      setTimerMessage({ type: "error", text: "新增失败：开启时间不能晚于或等于关闭时间" });
      window.setTimeout(() => setTimerMessage(null), 2600);
      return;
    }
    try {
      await createScheduleRule({
        deviceId: selectedTimerDeviceId,
        ruleName: newTimer.ruleName,
        turnOnTime: newTimer.turnOnTime,
        turnOffTime: newTimer.turnOffTime,
        repeatMode: newTimer.repeat,
        commandType: newTimer.commandType,
        enabled: true,
      });
      setShowAddTimer(false);
      setTimerMessage({ type: "success", text: "新增成功" });
      void loadRules();
      window.setTimeout(() => setTimerMessage(null), 2200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "新增失败，请检查后端服务";
      setTimerMessage({ type: "error", text: msg });
      window.setTimeout(() => setTimerMessage(null), 3000);
    }
  }

  async function handleDeleteRule(id: number) {
    try {
      await deleteScheduleRule(id);
      await loadRules();
      setTimerMessage({ type: "success", text: "删除成功" });
      window.setTimeout(() => setTimerMessage(null), 2200);
    } catch {
      setTimerMessage({ type: "error", text: "删除失败，请检查后端服务" });
      window.setTimeout(() => setTimerMessage(null), 2600);
    }
  }

  const manualCardConfig: Array<{ key: SwitchKey; name: string; type: string; icon: any; color: keyof typeof colorMap }> = [
    { key: "light", name: "补光灯", type: "补光灯", icon: Sun, color: "yellow" },
    { key: "fan", name: "风扇", type: "风机", icon: Fan, color: "blue" },
    { key: "water", name: "浇水设施", type: "灌溉", icon: Droplets, color: "cyan" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-800">设备远程开关</h1>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("manual")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
            activeTab === "manual" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Power className="w-4 h-4" />
          手动开关
        </button>
        <button
          onClick={() => setActiveTab("timer")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
            activeTab === "timer" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Clock className="w-4 h-4" />
          定时安排
        </button>
      </div>

      {activeTab === "manual" && (
        <>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-3">
            <div className="text-blue-500">📡</div>
            <div className="text-xs text-blue-700">
              <span className="font-medium">控制流程：</span>
              按大棚绑定设备独立控制补光灯、风扇和浇水。新增大棚后会自动出现待绑定控制位。
            </div>
          </div>

          <div className="space-y-4">
            {greenhouseNames.map((ghName) => {
              const binding = boundByGreenhouse[ghName];
              const state = controlStates[ghName] || defaultGhState();
              return (
                <div key={ghName} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-2 h-2 rounded-full ${binding ? "bg-green-500" : "bg-gray-300"}`} />
                      <h3 className="text-sm font-semibold text-gray-800">{ghName} — BearPi 设备</h3>
                      <span className="text-xs text-gray-400 font-mono truncate">{binding?.deviceId || "未绑定设备"}</span>
                    </div>
                  </div>

                  {!binding && (
                    <div className="text-sm text-gray-500 bg-gray-50 border border-gray-100 rounded-lg p-3 mb-3">
                      当前为虚拟设备开关（可直接本地开关）。如需控制真实硬件，请先前往设备登记扫码绑定。
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {manualCardConfig.map((cfg) => {
                      const colors = colorMap[cfg.color] || colorMap.blue;
                      const status = state[cfg.key];
                      return (
                        <div key={`${ghName}-${cfg.key}`} className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className={`p-2 rounded-xl ${colors.bg}`}>
                                <cfg.icon className={`w-5 h-5 ${colors.icon}`} />
                              </div>
                              <div className="flex items-center gap-1.5">
                                {status === "loading" ? (
                                  <Loader className="w-4 h-4 text-gray-400 animate-spin" />
                                ) : status === "on" ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : status === "error" ? (
                                  <AlertCircle className="w-4 h-4 text-red-500" />
                                ) : (
                                  <div className="w-4 h-4 rounded-full bg-gray-200" />
                                )}
                              </div>
                            </div>
                            <h3 className="text-sm font-semibold text-gray-800 mb-0.5">{cfg.name}</h3>
                            <div className="text-xs text-gray-400 mb-3 truncate">{cfg.type}</div>

                            <div className="flex items-center justify-between">
                              <span
                                className={`text-xs font-medium ${
                                  status === "on" ? "text-green-600" : status === "loading" ? "text-gray-400" : "text-gray-400"
                                }`}
                              >
                                {status === "on" ? "运行中" : status === "loading" ? "执行中..." : "已停止"}
                              </span>
                              <button
                                onClick={() => void handleToggle(ghName, cfg.key)}
                                disabled={status === "loading"}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                  status === "on"
                                    ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                                    : status === "loading"
                                    ? "bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-100"
                                    : "bg-green-50 text-green-600 hover:bg-green-100 border border-green-200"
                                }`}
                              >
                                {status === "on" ? (
                                  <>
                                    <ToggleRight className="w-3.5 h-3.5" />关闭
                                  </>
                                ) : status === "loading" ? (
                                  <>
                                    <Loader className="w-3.5 h-3.5 animate-spin" />执行中
                                  </>
                                ) : (
                                  <>
                                    <ToggleLeft className="w-3.5 h-3.5" />开启
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {state.feedback && (
                    <div className="mt-3 text-xs text-green-700 bg-green-50 rounded-lg px-2 py-1">
                      ✓ {state.feedback}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {activeTab === "timer" && (
        <>
          {timerMessage && (
            <div
              className={`text-sm px-3 py-2 rounded-lg border ${
                timerMessage.type === "success"
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              {timerMessage.text}
            </div>
          )}

          <div className="bg-green-50 border border-green-100 rounded-xl p-3 flex items-center gap-3">
            <div className="text-green-500">⏰</div>
            <div className="text-xs text-green-700">
              <span className="font-medium">定时控制：</span>
              请选择大棚后管理其绑定设备的定时安排。
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-semibold text-gray-700">定时安排列表</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">大棚：</span>
              <select
                value={timerGreenhouse}
                onChange={(e) => setTimerGreenhouse(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-green-400"
              >
                {greenhouseNames.map((gh) => (
                  <option key={gh} value={gh}>{gh}</option>
                ))}
              </select>
              <span className="text-xs text-gray-400 font-mono">{selectedTimerDeviceId || "未绑定设备"}</span>
              <button
                onClick={() => setShowAddTimer(true)}
                disabled={!selectedTimerDeviceId}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                新增规则
              </button>
            </div>
          </div>

          {!selectedTimerDeviceId && (
            <div className="text-sm text-gray-500 bg-gray-50 border border-gray-100 rounded-lg p-4">
              当前大棚未绑定设备，暂不可配置定时安排。
            </div>
          )}

          {showAddTimer && selectedTimerDeviceId && (
            <div className="bg-white rounded-xl border-2 border-green-300 p-5 shadow-sm">
              <h4 className="text-sm font-semibold text-gray-800 mb-4">新增定时安排</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">控制类型</label>
                  <select
                    value={newTimer.commandType}
                    onChange={(e) =>
                      setNewTimer((p) => ({
                        ...p,
                        commandType: e.target.value,
                        ruleName: e.target.value === "LIGHT_CONTROL" ? "补光灯定时" : "灌溉定时",
                      }))
                    }
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400"
                  >
                    <option value="LIGHT_CONTROL">补光灯定时</option>
                    <option value="MOTOR_CONTROL">灌溉定时</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">规则名称</label>
                  <input
                    type="text"
                    value={newTimer.ruleName}
                    onChange={(e) => setNewTimer((p) => ({ ...p, ruleName: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400"
                    placeholder="如: 补光灯早间定时"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">开启时间</label>
                  <input
                    type="time"
                    value={newTimer.turnOnTime}
                    onChange={(e) => setNewTimer((p) => ({ ...p, turnOnTime: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">关闭时间</label>
                  <input
                    type="time"
                    value={newTimer.turnOffTime}
                    onChange={(e) => setNewTimer((p) => ({ ...p, turnOffTime: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">重复模式</label>
                  <select
                    value={newTimer.repeat}
                    onChange={(e) => setNewTimer((p) => ({ ...p, repeat: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400"
                  >
                    <option value="DAILY">每天</option>
                    <option value="WEEKDAY">工作日</option>
                    <option value="WEEKEND">周末</option>
                    <option value="ONCE">仅一次</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setShowAddTimer(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">取消</button>
                <button onClick={() => void addTimer()} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">确认添加</button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["ID", "控制类型", "规则名称", "开启时间", "关闭时间", "重复模式", "状态", "操作"].map((h) => (
                    <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {timerRows.map((rule, index) => (
                  <tr key={rule.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono">{index + 1}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rule.commandType === "LIGHT_CONTROL" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"}`}>
                        {rule.commandType === "LIGHT_CONTROL" ? "补光灯" : "灌溉"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-700">{rule.ruleName}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 font-mono">{rule.turnOnTime}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 font-mono">{rule.turnOffTime}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {{ DAILY: "每天", WEEKDAY: "工作日", WEEKEND: "周末", ONCE: "仅一次" }[rule.repeatMode] || rule.repeatMode}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={async () => {
                          await toggleScheduleRule(rule.id, !rule.enabled);
                          await loadRules();
                        }}
                        className={`text-xs px-2 py-0.5 rounded-full font-medium cursor-pointer ${rule.enabled ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}
                      >
                        {rule.enabled ? "启用" : "禁用"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => void handleDeleteRule(rule.id)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {timerRows.length === 0 && (
              <div className="text-center py-10 text-gray-400 text-sm">
                {selectedTimerDeviceId ? "暂无定时安排，点击「新增规则」添加" : "当前大棚未绑定设备，暂无可展示规则"}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

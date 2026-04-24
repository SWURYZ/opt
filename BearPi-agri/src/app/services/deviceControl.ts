// 使用相对路径 + Vite 代理,避免手机访问时 localhost 指向手机本地导致失败
const DEVICE_CONTROL_BASE = "/api/v1/device-control";
const LIGHT_SCHEDULE_BASE = "/api/v1/light-schedule";
const IOT_ACCESS_BASE = "/api/v1/iot";

/* ==================== 业务三：设备远程手动控制 ==================== */

export type ManualCommandType = "LIGHT_CONTROL" | "MOTOR_CONTROL";
export type ManualAction = "ON" | "OFF";

export interface ManualControlRequest {
  deviceId: string;
  commandType: ManualCommandType;
  action: ManualAction;
}

export interface ManualControlResponse {
  requestId: string;
  cloudMessageId: string | null;
  status: string;
  message: string;
}

export interface DeviceStatusResponse {
  deviceId: string;
  ledStatus: string;
  motorStatus: string;
  lastUpdated: string | null;
}

export interface RealtimeDeviceStatus {
  deviceId: string;
  reportTime: string | null;
  led: string | null;
  motor: string | null;
  temperature: number | null;
  humidity: number | null;
  luminance: number | null;
}

export interface ControlCommand {
  id: number;
  deviceId: string;
  requestId: string;
  cloudMessageId: string | null;
  commandType: string;
  commandPayload: string;
  status: string;
  resultCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

function apiError(message: string, res?: Response): Error {
  return new Error(res ? `${message}: ${res.status}` : message);
}

async function readApiResponse<T>(res: Response, fallbackMessage: string): Promise<T> {
  if (!res.ok) {
    throw apiError(fallbackMessage, res);
  }
  const json: ApiResponse<T> = await res.json();
  if (json.code !== 0) {
    throw new Error(json.message || fallbackMessage);
  }
  return json.data;
}

export async function sendManualControl(req: ManualControlRequest): Promise<ManualControlResponse> {
  const res = await fetch(`${DEVICE_CONTROL_BASE}/manual`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return readApiResponse<ManualControlResponse>(res, "手动控制失败");
}

export async function fetchDeviceStatus(deviceId: string): Promise<DeviceStatusResponse> {
  const res = await fetch(`${DEVICE_CONTROL_BASE}/devices/${encodeURIComponent(deviceId)}/status`);
  return readApiResponse<DeviceStatusResponse>(res, "获取设备状态失败");
}

export async function fetchRealtimeDeviceStatus(deviceId: string): Promise<RealtimeDeviceStatus> {
  const res = await fetch(`${IOT_ACCESS_BASE}/devices/${encodeURIComponent(deviceId)}/status`);
  return readApiResponse<RealtimeDeviceStatus>(res, "获取实时设备状态失败");
}

export async function fetchCommandHistory(deviceId: string): Promise<ControlCommand[]> {
  const res = await fetch(`${DEVICE_CONTROL_BASE}/devices/${encodeURIComponent(deviceId)}/commands`);
  return readApiResponse<ControlCommand[]>(res, "获取指令历史失败");
}

/* ==================== 业务四：补光灯定时控制 ==================== */

export interface ScheduleRuleRequest {
  deviceId: string;
  ruleName: string;
  turnOnTime: string;
  turnOffTime: string;
  repeatMode?: string;
  commandType?: string;
  enabled?: boolean;
}

export interface ScheduleRuleResponse {
  id: number;
  deviceId: string;
  ruleName: string;
  turnOnTime: string;
  turnOffTime: string;
  enabled: boolean;
  repeatMode: string;
  commandType: string;
  createdAt: string;
}

export interface ScheduleExecutionLog {
  id: number;
  ruleId: number;
  deviceId: string;
  action: string;
  status: string;
  cloudMessageId: string | null;
  errorMessage: string | null;
  executedAt: string;
}

export async function fetchScheduleRules(): Promise<ScheduleRuleResponse[]> {
  const res = await fetch(`${LIGHT_SCHEDULE_BASE}/rules`);
  return readApiResponse<ScheduleRuleResponse[]>(res, "获取定时规则失败");
}

export async function createScheduleRule(req: ScheduleRuleRequest): Promise<ScheduleRuleResponse> {
  const res = await fetch(`${LIGHT_SCHEDULE_BASE}/rules`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return readApiResponse<ScheduleRuleResponse>(res, "创建失败");
}

export async function updateScheduleRule(id: number, req: ScheduleRuleRequest): Promise<ScheduleRuleResponse> {
  const res = await fetch(`${LIGHT_SCHEDULE_BASE}/rules/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return readApiResponse<ScheduleRuleResponse>(res, "更新定时规则失败");
}

export async function toggleScheduleRule(id: number, enabled: boolean): Promise<void> {
  const res = await fetch(`${LIGHT_SCHEDULE_BASE}/rules/${id}/toggle?enabled=${enabled}`, {
    method: "PATCH",
  });
  await readApiResponse<unknown>(res, "切换定时规则失败");
}

export async function deleteScheduleRule(id: number): Promise<void> {
  const res = await fetch(`${LIGHT_SCHEDULE_BASE}/rules/${id}`, { method: "DELETE" });
  if (!res.ok) {
    throw apiError("删除失败", res);
  }
}

export async function fetchExecutionLogs(ruleId: number): Promise<ScheduleExecutionLog[]> {
  const res = await fetch(`${LIGHT_SCHEDULE_BASE}/rules/${ruleId}/logs`);
  return readApiResponse<ScheduleExecutionLog[]>(res, "获取执行日志失败");
}

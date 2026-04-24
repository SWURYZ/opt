import { withApiBase } from "../lib/env";

export interface AgriAgentChatRequest {
  question: string;
  userId?: string;
  conversationId?: string;
  fileId?: string;
}

interface StreamEvent {
  event: string;
  data: string;
}

interface StreamCallbacks {
  onToken: (token: string) => void;
  onThinking?: (token: string) => void;
  onContext?: (conversationId: string) => void;
  onDone?: (data: string) => void;
  onError?: (message: string) => void;
}

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

async function consumeSseStream(res: Response, callbacks: StreamCallbacks) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `agri-agent stream request failed: ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) {
    const text = await res.text();
    if (text.trim()) callbacks.onToken(text);
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
    if (evt.event === "error") {
      callbacks.onError?.(data);
      return;
    }
    if (evt.event === "thinking") {
      callbacks.onThinking?.(data);
      return;
    }
    if (evt.event === "context" || evt.event === "conversation" || evt.event === "conversationId") {
      callbacks.onContext?.(data);
      return;
    }

    try {
      const json = JSON.parse(data);
      const conversationId = json.conversationId || json.conversation_id || json.contextId;
      if (conversationId) callbacks.onContext?.(String(conversationId));
      const token = json.token ?? json.content ?? json.answer ?? json.text ?? json.delta ?? json.message;
      if (token != null) callbacks.onToken(String(token));
      return;
    } catch {
      callbacks.onToken(data);
    }
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
    else callbacks.onToken(tail);
  }
}

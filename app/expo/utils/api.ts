import { Content } from "@google/genai";
import { fetch } from "expo/fetch";

// API基础URL
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

// 消息类型
export type MessageType = "text" | "voice" | "image" | "file";

// 消息对象接口
export interface Message {
  id: string;
  text: string;
  timestamp: Date;
  isUser: boolean;
  type?: MessageType;
  data?: any;
}

// AI响应类型
export type AIResponseType =
  | { type: "thinking"; content: boolean }
  | { type: "chunk"; content: string }
  | { type: "command"; command: string; result: string; data?: any }
  | { type: "complete"; content: string }
  | { type: "error"; error: string }
  | { type: "structured"; data: any }
  | { type: "markdown"; content: string };

// 账单接口
export interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  note: string;
  paymentMethod: string;
}

// 附件接口
export interface AttachmentPayload {
  mimeType: string;
  data: string; // base64 encoded string of file content
  name?: string;
}

// 流式读取处理函数
export const readStream = async (
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onChunk: (chunk: AIResponseType) => void
) => {
  let decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const buffer = decoder.decode(value, { stream: true });
      try {
        // 有可能一个chunk包含多个JSON对象，用换行分割
        const lines = buffer.split("\n\nid:");

        for (const chunk of lines) {
          if (!chunk.trim()) continue;
          let eventData = (chunk.match(/data:\s*([\s\S]*)/)?.[1] || "").replace(
            /\n\n$/,
            ""
          );
          if (!eventData) continue;
          const data = JSON.parse(eventData) as AIResponseType;
          onChunk(data);
        }
      } catch (e) {
        console.error("Error parsing chunk:", e);
        onChunk({ type: "error", error: "Failed to parse response" });
      }
    }
  } catch (e) {
    console.error("Error reading stream:", e);
    onChunk({ type: "error", error: "Failed to read response stream" });
  }
};

// 聊天API服务
export const chatAPI = {
  // 发送消息到API
  sendMessage: async (
    message: string,
    history: Content[],
    onResponse: (response: AIResponseType) => void,
    attachments: AttachmentPayload[] = []
  ): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          histories: history,
          attachments,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("Response body is null");
      }

      const reader = response.body.getReader();
      await readStream(reader, onResponse);
    } catch (error) {
      console.error("Error sending message:", error);
      onResponse({
        type: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  // 构建消息历史
  buildHistory: (messages: Message[]): Content[] => {
    return messages
      .filter(
        (msg) =>
          msg.type !== "voice" && msg.type !== "image" && msg.type !== "file"
      )
      .map((msg) => ({
        role: msg.isUser ? "user" : "model",
        parts: [{ text: msg.text }],
      }));
  },

  // 创建本地消息对象
  createMessage: (
    text: string,
    isUser: boolean,
    type: MessageType = "text",
    data?: any
  ): Message => {
    return {
      id: Date.now().toString(),
      text,
      timestamp: new Date(),
      isUser,
      type,
      data,
    };
  },
};

import { Content } from "@google/genai";
import { fetch } from "expo/fetch";
import { User } from "@/types/user.types";

// API基础URL
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

// 消息类型
export type MessageType = "text" | "voice" | "image" | "file" | "cmd";

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

// 认证相关接口
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface GoogleLoginRequest {
  idToken: string;
}

export interface AppleLoginRequest {
  identityToken: string;
  user: string; // user identifier from Apple authentication
}

export interface WeChatLoginRequest {
  code: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
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
          // Skip heartbeat events to avoid unnecessary JSON parsing errors
          if (!eventData || eventData.trim() === "keep-alive") continue;
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

// API 客户端
export const apiClient = {
  // 认证相关
  auth: {
    login: async (data: LoginRequest): Promise<LoginResponse> => {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    },

    register: async (data: RegisterRequest): Promise<LoginResponse> => {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    },

    googleLogin: async (data: GoogleLoginRequest): Promise<LoginResponse> => {
      const response = await fetch(`${API_URL}/api/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    },

    appleLogin: async (data: AppleLoginRequest): Promise<LoginResponse> => {
      const response = await fetch(`${API_URL}/api/auth/apple`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    },

    wechatLogin: async (data: WeChatLoginRequest): Promise<LoginResponse> => {
      const response = await fetch(`${API_URL}/api/auth/wechat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    },

    getProfile: async (token: string): Promise<User> => {
      const response = await fetch(`${API_URL}/api/auth/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    },

    logout: async (token: string): Promise<void> => {
      const response = await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    },

    deleteAccount: async (token: string): Promise<void> => {
      const response = await fetch(`${API_URL}/api/auth/delete-account`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    },
  },

  // 数据同步相关
  sync: {
    syncData: async (token: string): Promise<void> => {
      const response = await fetch(`${API_URL}/api/sync`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    },

    uploadBills: async (token: string, bills: any[]): Promise<void> => {
      const response = await fetch(`${API_URL}/api/sync/bills`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bills }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    },

    downloadBills: async (
      token: string,
      lastSyncTime?: string
    ): Promise<any[]> => {
      const url = lastSyncTime
        ? `${API_URL}/api/sync/bills?lastSync=${lastSyncTime}`
        : `${API_URL}/api/sync/bills`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    },
  },
};

// 聊天API服务
export const chatAPI = {
  // 发送消息到API
  sendMessage: async (
    message: string,
    history: Content[], // history messages,to be determined
    onResponse: (response: AIResponseType) => void,
    attachments: AttachmentPayload[] = [],
    lang: string = "en",
    currentDate?: string,
    summary?: any
  ): Promise<void> => {
    try {
      // Derive local date string if not provided (YYYY-MM-DD in user locale)
      const todayLocal = (() => {
        if (currentDate) return currentDate;
        const d = new Date();
        const tzOffset = d.getTimezoneOffset();
        const local = new Date(d.getTime() - tzOffset * 60000);
        return local.toISOString().split("T")[0];
      })();

      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          attachments,
          lang,
          currentDate: todayLocal,
          summary,
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
      .filter((msg) => msg.type === "text")
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

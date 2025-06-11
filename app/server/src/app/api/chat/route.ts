import {
  GoogleGenAI,
  HarmCategory,
  HarmBlockThreshold,
  Content,
} from "@google/genai";
import { v4 as uuidv4 } from "uuid";
const { setGlobalDispatcher, ProxyAgent } = require("undici");
if (process.env.https_proxy) {
  const dispatcher = new ProxyAgent({
    uri: new URL(process.env.https_proxy).toString(),
  });
  //全局fetch调用启用代理
  setGlobalDispatcher(dispatcher);
}
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not set");
}

// 使用最新的API初始化客户端
const ai = new GoogleGenAI({ apiKey });

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];
const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
  systemInstruction: `You are Momiq, a smart bookkeeping assistant. For every user input, first determine the intent (create expense / list expenses / set budget / chat), and always return a structured JSON in English as follows:

- Create expense:
  {
    "type": "create_expense",
    "expense": {
      "amount": number,
      "category": "category",
      "date": "YYYY-MM-DD",
      "note": "note",
      "paymentMethod": "payment method"
    }
  }
- List expenses:
  {
    "type": "list_expenses",
    "query": {
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "category": "category (optional)"
    }
  }
- Set budget:
  {
    "type": "set_budget",
    "budget": {
      "amount": number,
      "category": "category (optional)",
      "period": "month/year"
    }
  }
- Pure chat or unrecognized:
  {
    "type": "markdown",
    "content": "markdown content"
  }

All content, including categories, notes, and markdown, must be in English. Always return JSON, never plain text. If user input is in Chinese, translate it to English in the response.`,
  safetySettings,
};

interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  note: string;
  paymentMethod: string;
}

// Helper function to safely parse JSON
function tryParseJSON(text: string): any | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const { histories, message }: { histories: Content[]; message: string } =
    await req.json();

  try {
    // 开始聊天会话
    const chat = ai.chats.create({
      model: "gemini-2.5-flash-preview-05-20",
      history: histories,
      config: generationConfig,
    });

    // 发送消息并获取流式响应
    const result = await chat.sendMessageStream({
      message: message,
    });

    // 处理流式响应
    const idString = `id:${uuidv4()}\ndata:`;
    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(idString +
          JSON.stringify({
            type: "thinking",
            content: true,
          })+"\n\n"
        );

        let fullResponse = "";

        for await (const chunk of result) {
          const chunkText = chunk.text;
          fullResponse += chunkText;

          controller.enqueue(
            idString + JSON.stringify({
              type: "chunk",
              content: chunkText,
            })+"\n\n"
          );
        }
        fullResponse = fullResponse
          .replace(/```json/, "")
          .replace(/```$/, "")
          .trim();

        controller.enqueue(
          idString + JSON.stringify({
            type: "thinking",
            content: false,
          })+"\n\n"
        );

        // 优先尝试解析为结构化JSON
        const parsed = tryParseJSON(fullResponse);
        if (parsed && parsed.type) {
          controller.enqueue(
            idString + JSON.stringify({
              type: "structured",
              data: parsed,
            })+"\n\n"
          );
        } else {
          // fallback: markdown文本
          controller.enqueue(
            idString + JSON.stringify({
              type: "markdown",
              content: fullResponse.trim(),
            })+"\n\n"
          );
        }

        controller.close();
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error with generative AI:", error);
    return new Response(JSON.stringify({ error: "Error from AI service" }), {
      status: 500,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  }
}

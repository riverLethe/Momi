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
  systemInstruction: `You are Momiq, a smart bookkeeping assistant for personal finance. Your job is to convert user messages into FINANCIAL COMMANDS.

Rules:
1. First decide the intent: create_expense • list_expenses • set_budget • markdown (default).
2. If intent = create_expense:
   • The user may mention multiple expenses in a single message (e.g. a long diary-style text). If multiple expenses are found, return *all* of them inside an **array** called "expenses" instead of a single "expense" object. Each array item must follow the same structure defined below.
   • If the user does NOT provide a date, set "date" to undefined (omit the field in the JSON).
   • If the user does NOT provide a category, intelligently infer one that best matches the description. Use ONLY one of the following ids:
     food, cafe, groceries, transport, shopping, entertainment, utilities, housing, communication, gifts, education, health, insurance, travel, personal_care, pets, subscriptions, taxes, other
   • If the user gives a category in Chinese, translate it to the English id above.
   • Detect the merchant / store / vendor mentioned in the message and return it as "merchant" (string). Keep the original language exactly as the user wrote it. If none is mentioned, omit the field or set it to undefined.
   • Extract any remaining descriptive text as a "note" field (string). Keep it exactly as provided by the user without translation. If no note is provided, omit or set undefined.
3. If intent = list_expenses:
   • If startDate / endDate missing, default to the current month.
4. If intent = set_budget:
   • If period missing, default to "monthly".
5. For any free-form chat, return markdown.

Response MUST be a single JSON object with structure below and **never contain plain text outside the JSON**:

for example outputs:

- Create expense (single):
  {
    "type": "create_expense",
    "expense": {
      "amount": number,
      "category": "category",
      "date": "YYYY-MM-DD", // optional, omit or null if not provided
      "note": "note", // optional
      "paymentMethod": "payment method",
      "merchant": "merchant name" // optional
    }
  }
- Create expense (multiple):
  {
    "type": "create_expense",
    "expenses": [
      {
        "amount": number,
        "category": "category",
        "date": "YYYY-MM-DD", // optional
        "note": "note", // optional
        "paymentMethod": "payment method",
        "merchant": "merchant name" // optional
      },
      {
        "amount": number,
        "category": "category",
        "date": "YYYY-MM-DD", // optional
        "note": "note", // optional
        "paymentMethod": "payment method",
        "merchant": "merchant name" // optional
      }
    ]
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

Categories and markdown content must be in English. The "note" and "merchant" values should remain in the original language provided by the user (do NOT translate them). Always return JSON, never plain text. If user input is in Chinese, translate any necessary parts (except note and merchant) to English in the response.`,
  safetySettings,
};

interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  note?: string;
  paymentMethod: string;
  merchant?: string;
}

// 附件接口（来自客户端）
interface AttachmentPayload {
  mimeType: string;
  data: string; // base64 string
  name?: string;
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
  const {
    histories,
    message,
    attachments = [],
  }: {
    histories: Content[];
    message: string;
    attachments?: AttachmentPayload[];
  } = await req.json();

  // Build parts array combining text and attachments
  const parts: Array<any> = [];
  if (message && message.trim()) {
    parts.push({ text: message });
  }
  if (attachments && attachments.length) {
    attachments.forEach((att) => {
      if (att.data && att.mimeType) {
        parts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: att.data,
          },
        });
      }
    });
  }

  try {
    // 开始聊天会话
    const chat = ai.chats.create({
      model: "gemini-2.5-flash-preview-05-20",
      history: histories,
      config: generationConfig,
    });

    // 发送消息并获取流式响应
    const result = await (chat as any).sendMessageStream({
      contents: [{ role: "user", parts }],
    } as any);

    // 处理流式响应
    const idString = `id:${uuidv4()}\ndata:`;
    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(
          idString +
            JSON.stringify({
              type: "thinking",
              content: true,
            }) +
            "\n\n"
        );

        let fullResponse = "";

        for await (const chunk of result) {
          const chunkText = chunk.text;
          fullResponse += chunkText;

          controller.enqueue(
            idString +
              JSON.stringify({
                type: "chunk",
                content: chunkText,
              }) +
              "\n\n"
          );
        }
        fullResponse = fullResponse
          .replace(/```json/, "")
          .replace(/```$/, "")
          .trim();

        controller.enqueue(
          idString +
            JSON.stringify({
              type: "thinking",
              content: false,
            }) +
            "\n\n"
        );

        // 优先尝试解析为结构化JSON
        const parsed = tryParseJSON(fullResponse);
        if (parsed && parsed.type) {
          controller.enqueue(
            idString +
              JSON.stringify({
                type: "structured",
                data: parsed,
              }) +
              "\n\n"
          );
        } else {
          // fallback: markdown文本
          controller.enqueue(
            idString +
              JSON.stringify({
                type: "markdown",
                content: fullResponse.trim(),
              }) +
              "\n\n"
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

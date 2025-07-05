import {
  GoogleGenAI,
  HarmCategory,
  HarmBlockThreshold,
  Content,
} from "@google/genai";

// Helper function to generate UUID
function generateId(): string {
  return (
    "msg_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
  );
}
const { setGlobalDispatcher, ProxyAgent } = require("undici");
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore – no types available for jsonrepair, but runtime import is fine
import { jsonrepair } from "jsonrepair";
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

// Helper to dynamically build system instruction based on requested language
function buildSystemInstruction(lang: string, today: string): string {
  const base = `Today is ${today}.

You are MomiQ, a smart bookkeeping assistant for personal finance. Your job is to convert user messages into FINANCIAL COMMANDS.

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
   • Return a "query" object. Supported optional fields (omit if not provided):
     startDate, endDate — YYYY-MM-DD strings
     dateField          — "date" | "createdAt" | "updatedAt" (default "date")
     category / categories — single category id or an array of ids above
     keyword / keywords   — single keyword or array to search in "note" and "merchant"
     minAmount, maxAmount — numbers for amount range (both optional)
     dateRanges          — array of { startDate, endDate } objects (overrides startDate/endDate)
   • If a field is omitted, do NOT apply that filter. For example, if startDate/endDate are both missing, return expenses for ALL dates.
   • Example:
     {
       "type": "list_expenses",
       "query": {
         "startDate": "2024-05-01",
         "endDate": "2024-05-31",
         "category": "food",
         "keyword": "Starbucks",
         "minAmount": 10,
         "maxAmount": 50,
         "dateField": "date"
       }
     }
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
      "category": "category (optional)",
      "keyword": "keyword (optional)",
      "minAmount": number,
      "maxAmount": number,
      "dateField": "date|createdAt|updatedAt"
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

Categories must be in English.Markdown content must be in ${lang}. The "note" and "merchant" values should remain in the original language provided by the user (do NOT translate them). Always return JSON, never plain text.`;

  return base;
}

function buildGenerationConfig(lang: string, currentDate?: string) {
  const today = currentDate || new Date().toISOString().split("T")[0];
  return {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
    systemInstruction: buildSystemInstruction(lang, today),
    safetySettings,
  } as const;
}

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
    lang = "en",
    currentDate,
    summary,
  }: {
    histories: Content[];
    message: string;
    attachments?: AttachmentPayload[];
    lang?: string;
    currentDate?: string;
    summary?: any;
  } = await req.json();

  const todayParam = currentDate || new Date().toISOString().split("T")[0];

  // Build parts array combining text and attachments
  const parts: Array<any> = [];
  // If bill summary is provided, prepend it so the model can reference it.
  if (summary) {
    parts.push({
      text: `BILL_SUMMARY\n${typeof summary === "string" ? summary : JSON.stringify(summary)}`,
    });
  }

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
    const generationConfig = buildGenerationConfig(lang, todayParam);

    // 发送消息并获取流式响应
    const result = await ai.models.generateContentStream({
      model: "gemini-2.5-flash-preview-05-20",
      contents: [{ role: "user", parts }],
      config: generationConfig,
    });

    // 处理流式响应
    const idString = `id:${generateId()}\ndata:`;
    const stream = new ReadableStream({
      async start(controller) {
        // Heartbeat every 15 seconds to keep connection alive
        const hb = setInterval(() => {
          controller.enqueue(idString + "keep-alive\n\n");
        }, 15000);

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
          .replace(/```json[\s\S]*?{/, "{")
          .replace(/```$/, "")
          .trim();

        let parsed = tryParseJSON(fullResponse);
        if (!parsed) {
          try {
            const repaired = jsonrepair(fullResponse);
            parsed = JSON.parse(repaired);
          } catch (_) {
            parsed = null;
          }
        }

        controller.enqueue(
          idString +
            JSON.stringify({
              type: "thinking",
              content: false,
            }) +
            "\n\n"
        );

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

        clearInterval(hb);
        controller.close();
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
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

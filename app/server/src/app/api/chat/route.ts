import {
  GoogleGenAI,
  HarmCategory,
  HarmBlockThreshold,
  Content,
} from "@google/genai";

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
  systemInstruction: `You are Momiq, a friendly and helpful AI assistant for personal finance management.
  - You are embedded in a mobile app for bookkeeping.
  - Your goal is to help users track their expenses, manage their budget, and provide financial insights in a conversational way.
  - Be conversational, and proactive.
  - When a user mentions an expense, confirm the recording of the expense and ask clarifying questions if necessary (e.g., category, payment method).
  - Provide insights based on user's spending habits.
  - Keep your responses concise and easy to understand for a mobile interface.
  - You can create and manage expense records with the following formats:
    - Create expense: [CREATE_EXPENSE]{amount}{category}{date}{note}{payment_method}
    - List expenses: [LIST_EXPENSES]{start_date}{end_date}{category?}
    - Expense details: [EXPENSE_DETAILS]{expense_id}
    - Expense analysis: [ANALYZE_EXPENSES]{period}{category?}
  - Always try to be helpful and extract expense information from user messages.
  - When user asks about their expenses or budget, respond with appropriate expense commands.`,
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

// Mock database for expenses
let expenses: Expense[] = [
  {
    id: "1",
    amount: 35.5,
    category: "Food & Drinks",
    date: "2023-05-10",
    note: "Lunch with colleagues",
    paymentMethod: "Credit Card",
  },
  {
    id: "2",
    amount: 120.0,
    category: "Shopping",
    date: "2023-05-08",
    note: "New clothes",
    paymentMethod: "Debit Card",
  },
  {
    id: "3",
    amount: 50.0,
    category: "Transportation",
    date: "2023-05-09",
    note: "Taxi rides",
    paymentMethod: "Cash",
  },
];

// Helper function to process commands from AI responses
function processCommand(command: string): { result: string; data?: any } {
  // Create expense command
  if (command.startsWith("[CREATE_EXPENSE]")) {
    const params = command.replace("[CREATE_EXPENSE]", "").split("}{");
    if (params.length >= 4) {
      const amount = parseFloat(params[0].replace("{", ""));
      const category = params[1];
      const date = params[2];
      const note = params[3];
      const paymentMethod = params[4].replace("}", "");

      const newExpense: Expense = {
        id: Date.now().toString(),
        amount,
        category,
        date,
        note,
        paymentMethod,
      };

      expenses.push(newExpense);
      return {
        result: `Successfully created expense: ${amount} for ${category}`,
        data: newExpense,
      };
    }
  }

  // List expenses command
  else if (command.startsWith("[LIST_EXPENSES]")) {
    const params = command.replace("[LIST_EXPENSES]", "").split("}{");
    const startDate = params[0].replace("{", "");
    const endDate = params[1].replace("}", "");
    const category = params.length > 2 ? params[2].replace("}", "") : undefined;

    let filteredExpenses = expenses;
    if (category) {
      filteredExpenses = filteredExpenses.filter(
        (e) => e.category === category
      );
    }

    return {
      result: `Here are your expenses:`,
      data: filteredExpenses,
    };
  }

  // Expense details command
  else if (command.startsWith("[EXPENSE_DETAILS]")) {
    const expenseId = command
      .replace("[EXPENSE_DETAILS]{", "")
      .replace("}", "");
    const expense = expenses.find((e) => e.id === expenseId);

    if (expense) {
      return {
        result: `Expense details:`,
        data: expense,
      };
    } else {
      return { result: `Expense not found` };
    }
  }

  // Expense analysis command
  else if (command.startsWith("[ANALYZE_EXPENSES]")) {
    const params = command.replace("[ANALYZE_EXPENSES]", "").split("}{");
    const period = params[0].replace("{", "");
    const category = params.length > 1 ? params[1].replace("}", "") : undefined;

    let filteredExpenses = expenses;
    if (category) {
      filteredExpenses = filteredExpenses.filter(
        (e) => e.category === category
      );
    }

    const totalAmount = filteredExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );
    const categorySummary = filteredExpenses.reduce(
      (acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      result: `Expense analysis for ${period}:`,
      data: {
        totalAmount,
        categorySummary,
        count: filteredExpenses.length,
      },
    };
  }

  // Default, just return the text
  return { result: command };
}

export async function POST(req: Request) {
  const { histories, message }: { histories: Content[]; message: string } =
    await req.json();

  try {
    // 开始聊天会话
    const chat = ai.chats.create({
      model: "gemini-2.5-pro",
      history: histories,
      config: generationConfig,
    });

    // 发送消息并获取流式响应
    const result = await chat.sendMessageStream({
      message: message,
    });

    // 处理流式响应
    const stream = new ReadableStream({
      async start(controller) {
        // 发送思考中状态
        controller.enqueue(
          JSON.stringify({
            type: "thinking",
            content: true,
          })
        );

        let fullResponse = "";

        for await (const chunk of result) {
          const chunkText = chunk.text;
          fullResponse += chunkText;

          // 流式发送文本
          controller.enqueue(
            JSON.stringify({
              type: "chunk",
              content: chunkText,
            })
          );
        }

        // 完成思考状态
        controller.enqueue(
          JSON.stringify({
            type: "thinking",
            content: false,
          })
        );

        // 检查是否包含命令并处理
        const commandRegex =
          /\[(CREATE_EXPENSE|LIST_EXPENSES|EXPENSE_DETAILS|ANALYZE_EXPENSES)\](.*?)(\s|$)/g;
        let match;
        let processedCommands = false;

        while ((match = commandRegex.exec(fullResponse)) !== null) {
          const command = match[0].trim();
          const { result, data } = processCommand(command);

          // 发送命令处理结果
          controller.enqueue(
            JSON.stringify({
              type: "command",
              command: match[1],
              result,
              data,
            })
          );

          processedCommands = true;
        }

        // 如果没有命令，发送完整消息
        if (!processedCommands) {
          controller.enqueue(
            JSON.stringify({
              type: "complete",
              content: fullResponse,
            })
          );
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error with generative AI:", error);
    return new Response(JSON.stringify({ error: "Error from AI service" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

import { Dispatch, SetStateAction } from "react";
import { chatAPI, AIResponseType, Message } from "@/utils/api";
import {
  saveBill,
  getBills,
  filterBills,
  BillQuery,
} from "@/utils/bills.utils";
import { updateBudgets } from "@/utils/budget.utils";
import { Bill } from "@/types/bills.types";
import i18n from "@/i18n";
import { formatCurrency } from "@/utils/format";

interface UseAIResponseParams {
  user: any;
  refreshData: () => void;
  scrollToBottom: () => void;
  setMessages: Dispatch<SetStateAction<Message[]>>;
  setIsThinking: Dispatch<SetStateAction<boolean>>;
  setCurrentStreamedMessage: Dispatch<SetStateAction<string>>;
}

export const createHandleAIResponse = (params: UseAIResponseParams) => {
  const {
    user,
    refreshData,
    scrollToBottom,
    setMessages,
    setIsThinking,
    setCurrentStreamedMessage,
  } = params;

  let placeholderId: string | null = null;

  return async (response: AIResponseType) => {
    if (response.type === "thinking") {
      const isNowThinking = !!response.content;
      setIsThinking(isNowThinking);

      if (isNowThinking && !placeholderId) {
        const placeholder = chatAPI.createMessage("", false, "text", {
          type: "ai_loading",
        });
        placeholderId = placeholder.id;
        setMessages((prev) => [...prev, placeholder]);
        setTimeout(scrollToBottom, 50);
      }

      return;
    }

    if (response.type === "markdown") {
      const markdownMessage = chatAPI.createMessage("", false, "text", {
        type: "markdown",
        content: response.content,
      });
      setMessages((prev) => [...prev, markdownMessage]);
      setTimeout(scrollToBottom, 50);
      return;
    }

    if (response.type === "complete") {
      if (placeholderId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === placeholderId
              ? { ...m, text: response.content, data: undefined }
              : m
          )
        );
        placeholderId = null;
      } else {
        const aiMessage = chatAPI.createMessage(response.content, false);
        setMessages((prev) => [...prev, aiMessage]);
      }
      setCurrentStreamedMessage("");
      setIsThinking(false);
      setTimeout(scrollToBottom, 50);
      return;
    }

    if (response.type === "error") {
      const errorText = i18n.t("Sorry, an error occurred: {{error}}", {
        error: response.error,
      });
      if (placeholderId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === placeholderId
              ? {
                  ...m,
                  text: `⚠️ ${errorText}`,
                  data: { type: "system_error" },
                }
              : m
          )
        );
        placeholderId = null;
      } else {
        const errorMessage = chatAPI.createMessage(errorText, false, "text", {
          type: "system_error",
        });
        setMessages((prev) => [...prev, errorMessage]);
      }
      setIsThinking(false);
      setCurrentStreamedMessage("");
      setTimeout(scrollToBottom, 50);
      return;
    }

    if (response.type !== "structured") return;

    const { type, expense, expenses, query, budget, content } = response.data;

    if (type === "create_expense" && (expense || expenses)) {
      const expenseArray: any[] = Array.isArray(expenses)
        ? expenses
        : expense
          ? [expense]
          : [];

      // 优化：在后台处理费用创建，避免阻塞UI
      setTimeout(async () => {
        const newBills: Bill[] = [];
        for (const exp of expenseArray) {
          try {
            const savedBill = await saveBill(
              {
                amount: exp.amount,
                category: exp.category || "others",
                date: exp.date ? new Date(exp.date) : new Date(),
                merchant: exp.merchant || "",
                notes: exp.note || "",
                account: exp.paymentMethod || "Default",
                isFamilyBill: false,
              },
              user || { id: "local-user", name: "Local User" }
            );
            newBills.push(savedBill);
          } catch (err) {
            console.error("Failed to save expense from AI:", err);
          }
        }
        if (newBills.length) {
          // 后台刷新数据
          setTimeout(() => refreshData(), 100);
          const expenseMessage = chatAPI.createMessage(
            newBills.length > 1
              ? i18n.t("{{count}} expenses created", { count: newBills.length })
              : i18n.t("Expense created"),
            false,
            "text",
            { type: "expense_list", expenses: newBills }
          );
          setMessages((prev) => [...prev, expenseMessage]);
          setTimeout(scrollToBottom, 50);
        }
      }, 50);
    } else if (type === "list_expenses" && query) {
      // 优化：在后台处理账单查询，避免阻塞UI
      setTimeout(async () => {
        try {
          const allBills = await getBills();

          const billQuery: BillQuery = {
            startDate: query.startDate,
            endDate: query.endDate,
            category: query.category,
            categories: query.categories,
            keyword: query.keyword,
            keywords: query.keywords,
            minAmount: query.minAmount,
            maxAmount: query.maxAmount,
            dateField: query.dateField,
            dateRanges: query.dateRanges,
          } as BillQuery;

          const matched = filterBills(allBills, billQuery);

          // 减少显示数量以提高性能
          const MAX_DISPLAY = 6;
          const topBills = matched.slice(0, MAX_DISPLAY);

          const totalAmount = matched.reduce((sum, b) => sum + b.amount, 0);

          const listMessage = chatAPI.createMessage(
            matched.length === 0
              ? i18n.t("No matching bills found")
              : i18n.t("Found {{count}} bills, total spending: {{amount}}", {
                  count: matched.length,
                  amount: formatCurrency(totalAmount),
                }),
            false,
            "text",
            {
              type: "expense_list",
              expenses: topBills,
              moreCount: matched.length - topBills.length,
              query: billQuery,
            }
          );
          setMessages((prev) => [...prev, listMessage]);
          setTimeout(scrollToBottom, 50);
        } catch (err) {
          console.error("Failed to filter bills:", err);
          const errorMessage = chatAPI.createMessage(
            i18n.t("Sorry, an error occurred when filtering bills"),
            false,
            "text",
            { type: "system_error" }
          );
          setMessages((prev) => [...prev, errorMessage]);
          setTimeout(scrollToBottom, 50);
        }
      }, 50);
    } else if (type === "set_budget" && budget) {
      await updateBudgets({ [budget.period]: budget.amount }).catch((err) =>
        console.error(err)
      );
      const budgetMessage = chatAPI.createMessage(
        i18n.t("Budget set: {{amount}} ({{category}}, {{period}})", {
          amount: budget.amount,
          category: budget.category || "All",
          period: budget.period,
        }),
        false,
        "text",
        { type: "budget", budget }
      );
      setMessages((prev) => [...prev, budgetMessage]);
    } else if (type === "markdown" && content) {
      const markdownMessage = chatAPI.createMessage("", false, "text", {
        type: "markdown",
        content,
      });
      setMessages((prev) => [...prev, markdownMessage]);
    } else {
      const fallbackMessage = chatAPI.createMessage(
        JSON.stringify(response.data),
        false
      );
      setMessages((prev) => [...prev, fallbackMessage]);
    }

    setTimeout(scrollToBottom, 50);
  };
};

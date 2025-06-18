import { Dispatch, SetStateAction } from "react";
import { chatAPI, AIResponseType, Message } from "@/utils/api";
import { saveBill } from "@/utils/bills.utils";
import { updateBudgets } from "@/utils/budget.utils";
import { Bill } from "@/types/bills.types";
import i18n from "@/i18n";

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

  return async (response: AIResponseType) => {
    if (response.type === "thinking") {
      setIsThinking(!!response.content);
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
      const aiMessage = chatAPI.createMessage(response.content, false);
      setMessages((prev) => [...prev, aiMessage]);
      setCurrentStreamedMessage("");
      setIsThinking(false);
      setTimeout(scrollToBottom, 50);
      return;
    }

    if (response.type === "error") {
      const errorMessage = chatAPI.createMessage(
        i18n.t("Sorry, an error occurred: {{error}}", {
          error: response.error,
        }),
        false
      );
      setMessages((prev) => [...prev, errorMessage]);
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
        refreshData();
        const expenseMessage = chatAPI.createMessage(
          newBills.length > 1
            ? i18n.t("{{count}} expenses created", { count: newBills.length })
            : i18n.t("Expense created"),
          false,
          "text",
          { type: "expense_list", expenses: newBills }
        );
        setMessages((prev) => [...prev, expenseMessage]);
      }
    } else if (type === "list_expenses" && query) {
      const listMessage = chatAPI.createMessage(
        i18n.t("Expense query"),
        false,
        "text",
        { type: "expense_list", expenses: [] }
      );
      setMessages((prev) => [...prev, listMessage]);
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

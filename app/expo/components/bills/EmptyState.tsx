import { useAuth } from "@/providers/AuthProvider";
import { useViewStore } from "@/stores/viewStore";
import React from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import EmptyStateView from "../common/EmptyStateView";

export const EmptyState = () => {
  const { viewMode } = useViewStore();
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  const getEmptyStateMessage = () => {
    if (viewMode === "family" && !isAuthenticated) {
      return t("Please sign in to view family expenses");
    }
    return t("Try adjusting filters or add your first expense");
  };

  return (
    <EmptyStateView
      title={t("No Expenses Found")}
      description={getEmptyStateMessage()}
      imageSrc={require("@/assets/images/welcome-bill.png")}
      actionText={t("Add Expense")}
      actionIcon={<Plus size={28} color="#3B82F6" />}
      onActionPress={() => router.push("/(tabs)/chat" as any)}
      hideAction={viewMode === "family" && !isAuthenticated}
    />
  );
}; 
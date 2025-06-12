import { useAuth } from "@/providers/AuthProvider";
import { useViewStore } from "@/stores/viewStore";
import React from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { MessageSquarePlus } from "lucide-react-native";
import EmptyStateView from "../common/EmptyStateView";

export const EmptyState = () => {
  const { viewMode } = useViewStore();
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  const getEmptyStateMessage = () => {
    if (viewMode === "family" && !isAuthenticated) {
      return t("Please sign in to view family bills");
    }
    return t("Try adjusting filters or record your first bill");
  };

  return (
    <EmptyStateView
      title={t("No Bills Found")}
      description={getEmptyStateMessage()}
      imageSrc={require("@/assets/images/welcome-bill.png")}
      actionText={t("Record your first bill")}
      actionSubtitle={t("Use our AI chat to easily log your bills")}
      actionIcon={<MessageSquarePlus size={28} color="#3B82F6" />}
      onActionPress={() => router.push("/(tabs)/chat" as any)}
      hideAction={viewMode === "family" && !isAuthenticated}
    />
  );
};

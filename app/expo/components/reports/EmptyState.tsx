import React from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import EmptyStateView from "../common/EmptyStateView";

interface EmptyStateProps {
  message?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  message 
}) => {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <EmptyStateView
      title={t("No Data Available")}
      description={message || t("Start tracking your expenses to see reports")}
      imageSrc={require("@/assets/images/welcome-report.png")}
      actionText={t("Add Expense")}
      actionIcon={<Plus size={28} color="#3B82F6" />}
      onActionPress={() => router.push("/(tabs)/chat" as any)}
    />
  );
};

export default EmptyState; 
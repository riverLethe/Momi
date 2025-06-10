import React from "react";
import { useTranslation } from "react-i18next";
import { MessageSquarePlus } from "lucide-react-native";
import EmptyStateView from "../common/EmptyStateView";

interface WelcomeScreenProps {
  onStartChatPress: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStartChatPress,
}) => {
  const { t } = useTranslation();
  
  return (
    <EmptyStateView
      title={t("Welcome to Momiq")}
      description={t("Your personal finance tracker to help you manage expenses and reach your financial goals")}
      imageSrc={require("@/assets/images/welcome-home.png")}
      actionText={t("Record your first bill")}
      actionSubtitle={t("Use our AI chat to easily log your expenses")}
      actionIcon={<MessageSquarePlus size={28} color="#3B82F6" />}
      onActionPress={onStartChatPress}
    />
  );
};

export default WelcomeScreen; 
import React from "react";
import { useTranslation } from "react-i18next";
import { View, Pressable } from "react-native";
import { Text, XStack } from "tamagui";
import { 
  PlusCircle, 
  PiggyBank, 
  Receipt, 
  MessageCircle,
  TrendingUp
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

// 单个操作项类型定义
interface ActionItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  gradient: string[];
  onPress: () => void;
}

// 组件属性定义
interface QuickActionBarProps {
  onAddBillPress: () => void;
  onAddBudgetPress: () => void;
  onViewBillsPress?: () => void;
  onStartChatPress?: () => void;
  onAnalysisPress?: () => void;
}

// 快速操作组件
const QuickActionBar: React.FC<QuickActionBarProps> = ({
  onAddBillPress,
  onAddBudgetPress,
  onViewBillsPress,
  onStartChatPress,
  onAnalysisPress
}) => {
  const { t } = useTranslation();
  
  // 定义操作项
  const actionItems: ActionItem[] = [
    {
      key: "add",
      icon: <PlusCircle size={24} color="#ffffff" />,
      label: t("Add"),
      gradient: ["#3B82F6", "#2563EB"],
      onPress: onAddBillPress
    },
    {
      key: "budget",
      icon: <PiggyBank size={24} color="#ffffff" />,
      label: t("Budget"),
      gradient: ["#10B981", "#059669"],
      onPress: onAddBudgetPress
    },
    {
      key: "bills",
      icon: <Receipt size={24} color="#ffffff" />,
      label: t("Bills"),
      gradient: ["#8B5CF6", "#7C3AED"],
      onPress: onViewBillsPress || onAddBillPress
    },
    {
      key: "chat",
      icon: <MessageCircle size={24} color="#ffffff" />,
      label: t("Chat"),
      gradient: ["#F59E0B", "#D97706"],
      onPress: onStartChatPress || (() => {})
    }
  ];

  // 如果分析功能可用，则添加分析操作项
  if (onAnalysisPress) {
    actionItems.push({
      key: "analysis",
      icon: <TrendingUp size={24} color="#ffffff" />,
      label: t("Analysis"),
      gradient: ["#EC4899", "#BE185D"],
      onPress: onAnalysisPress
    });
  }
  
  return (
    <View className="px-4 py-2 mb-2">
      <XStack justifyContent="space-between" space="$2" flexWrap="wrap">
        {actionItems.map((item) => (
          <Pressable
            key={item.key}
            onPress={item.onPress}
            style={({ pressed }) => ({
              opacity: pressed ? 0.85 : 1,
              minWidth: 68,
              marginBottom: 8,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 3,
              elevation: 3,
              borderRadius: 16,
              flex: 1,
            })}
          >
            <LinearGradient
              colors={item.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="rounded-2xl p-4 items-center"
            >
              <View className="p-2">
                {item.icon}
              </View>
              <Text
                color="white"
                fontWeight="$6"
                fontSize="$3"
                textAlign="center"
                marginTop="$1"
              >
                {item.label}
              </Text>
            </LinearGradient>
          </Pressable>
        ))}
      </XStack>
    </View>
  );
};

export default QuickActionBar; 
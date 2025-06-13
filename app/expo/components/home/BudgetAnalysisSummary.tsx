import React from "react";
import { useTranslation } from "react-i18next";
import { View, Pressable } from "react-native";
import {
  Card,
  YStack,
  XStack,
  Text,
  Button,
  Separator,
  Progress,
} from "tamagui";
import {
  BarChart4,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  BadgeDollarSignIcon,
} from "lucide-react-native";

// 预算状态类型
export type BudgetStatusType = "good" | "warning" | "danger";

// 预算周期类型
export type BudgetPeriod = "weekly" | "monthly" | "yearly";

// 预算状态
export interface BudgetStatusInfo {
  status: BudgetStatusType;
  remaining: number;
  spent: number;
  total: number;
  percentage: number;
}

// 类别支出状态类型
export type CategoryStatusType = "normal" | "exceeding" | "save";

// 类别支出分析
export interface CategorySpending {
  id: string;
  label: string;
  status: CategoryStatusType;
  percentage: number;
  amount: number;
  color?: string;
}

// 组件属性定义
interface BudgetAnalysisSummaryProps {
  budgetStatus: BudgetStatusInfo;
  categories: CategorySpending[];
  isPersonalView?: boolean;
  period: BudgetPeriod;
  onManageBudgetPress: () => void;
  onCategoryPress?: (categoryId: string) => void;
  currency?: string;
}

// 获取预算状态图标和颜色
const getBudgetStatusInfo = (status: BudgetStatusType) => {
  switch (status) {
    case "good":
      return {
        icon: <TrendingUp size={18} color="#10B981" />,
        color: "#10B981",
        backgroundColor: "#ECFDF5",
        label: "On Track",
      };
    case "warning":
      return {
        icon: <AlertTriangle size={18} color="#F59E0B" />,
        color: "#F59E0B",
        backgroundColor: "#FFFBEB",
        label: "Watch Spending",
      };
    case "danger":
      return {
        icon: <TrendingDown size={18} color="#EF4444" />,
        color: "#EF4444",
        backgroundColor: "#FEF2F2",
        label: "Over Budget",
      };
  }
};

// 获取类别状态信息
const getCategoryStatusInfo = (
  status: CategoryStatusType,
  percentage: number
) => {
  switch (status) {
    case "normal":
      return {
        color: "#10B981",
        label: "Normal",
      };
    case "exceeding":
      return {
        color: "#EF4444",
        label: `Exceeding by ${percentage}%`,
      };
    case "save":
      return {
        color: "#3B82F6",
        label: `Save ${percentage}%`,
      };
  }
};

// 获取预算周期标签
const getPeriodLabel = (period: BudgetPeriod, t: (key: string) => string) => {
  switch (period) {
    case "weekly":
      return t("This Week");
    case "monthly":
      return t("This Month");
    case "yearly":
      return t("This Year");
  }
};

// 预算分析摘要组件
const BudgetAnalysisSummary: React.FC<BudgetAnalysisSummaryProps> = ({
  budgetStatus,
  categories,
  isPersonalView = true,
  period,
  onManageBudgetPress,
  onCategoryPress,
  currency = "¥",
}) => {
  const { t } = useTranslation();
  const statusInfo = getBudgetStatusInfo(budgetStatus.status);

  // 格式化货币金额
  const formatCurrency = (amount: number) => {
    return `${currency}${amount.toLocaleString()}`;
  };

  // 计算进度条颜色
  const getProgressColor = (status: BudgetStatusType, percentage: number) => {
    if (status === "danger") return "#EF4444";
    if (status === "warning" || percentage > 70) return "#F59E0B";
    return "#10B981";
  };

  return (
    <Card
      backgroundColor="white"
      borderRadius="$6"
      marginHorizontal="$4"
      marginBottom="$4"
      padding="$4"
      elevate
      shadowColor="rgba(0,0,0,0.08)"
      shadowRadius={8}
    >
      <YStack space="$4">
        {/* 标题和状态 */}
        <XStack justifyContent="space-between" alignItems="center">
          <XStack space="$2" alignItems="center">
            <BarChart4 size={24} />
            <Text fontSize="$4" fontWeight="$8" color="$gray12">
              {t("Budget Analysis")}
            </Text>
          </XStack>

          <XStack
            backgroundColor={statusInfo.backgroundColor}
            paddingHorizontal="$2"
            paddingVertical="$1"
            borderRadius="$4"
            alignItems="center"
            space="$1"
          >
            {statusInfo.icon}
            <Text fontSize="$2" fontWeight="$6" color={statusInfo.color}>
              {t(statusInfo.label)}
            </Text>
          </XStack>
        </XStack>

        {/* 周期和金额 */}
        <YStack space="$3">
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$3" fontWeight="$6" color="$gray10">
              {getPeriodLabel(period, t)}
            </Text>
            <XStack space="$1" alignItems="center">
              <BadgeDollarSignIcon size={16} color="#3B82F6" />
              <Text fontSize="$2" color="$gray10">
                {t("Total Budget")}: {formatCurrency(budgetStatus.total)}
              </Text>
            </XStack>
          </XStack>

          {/* 进度条 */}
          <YStack space="$2">
            <Progress value={budgetStatus.percentage} backgroundColor="$gray4">
              <Progress.Indicator
                animation="bouncy"
                backgroundColor={getProgressColor(
                  budgetStatus.status,
                  budgetStatus.percentage
                )}
              />
            </Progress>

            <XStack justifyContent="space-between">
              <Text fontSize="$2" color="$gray10">
                {t("Spent")}: {formatCurrency(budgetStatus.spent)} (
                {budgetStatus.percentage}%)
              </Text>
              <Text
                fontSize="$3"
                fontWeight="$7"
                color={budgetStatus.remaining > 0 ? "$green9" : "$red9"}
              >
                {t("Remaining")}: {formatCurrency(budgetStatus.remaining)}
              </Text>
            </XStack>
          </YStack>
        </YStack>

        <Separator />

        {/* 类别分析 */}
        <YStack space="$3">
          <Text fontSize="$3" fontWeight="$6" color="$gray11">
            {t("Category Analysis")}
          </Text>

          {categories.length === 0 ? (
            <Text
              fontSize="$2"
              color="$gray9"
              textAlign="center"
              paddingVertical="$3"
            >
              {t("No spending data available")}
            </Text>
          ) : (
            <YStack space="$3">
              {categories.map((category) => {
                const catStatus = getCategoryStatusInfo(
                  category.status,
                  category.percentage
                );
                return (
                  <Pressable
                    key={category.id}
                    onPress={() => onCategoryPress?.(category.id)}
                  >
                    <XStack
                      justifyContent="space-between"
                      alignItems="center"
                      paddingVertical="$2"
                      pressStyle={{ opacity: onCategoryPress ? 0.7 : 1 }}
                    >
                      <XStack space="$2" alignItems="center">
                        <View
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: 6,
                            backgroundColor: category.color || catStatus.color,
                          }}
                        />
                        <Text fontSize="$3" color="$gray11">
                          {t(category.label)}
                        </Text>
                      </XStack>

                      <XStack alignItems="center" space="$2">
                        <Text fontSize="$3" fontWeight="$5">
                          {formatCurrency(category.amount)}
                        </Text>
                        <Text
                          fontSize="$2"
                          color={catStatus.color}
                          backgroundColor={`${catStatus.color}10`}
                          paddingHorizontal="$2"
                          paddingVertical="$1"
                          borderRadius="$2"
                        >
                          {t(catStatus.label)}
                        </Text>
                      </XStack>
                    </XStack>
                  </Pressable>
                );
              })}
            </YStack>
          )}
        </YStack>

        {/* 操作按钮 */}
        <Button
          backgroundColor="$blue2"
          color="$blue9"
          size="$3"
          onPress={onManageBudgetPress}
          pressStyle={{ opacity: 0.8 }}
          borderColor="$blue6"
          borderWidth={1}
        >
          {t("Manage Budget")}
        </Button>
      </YStack>
    </Card>
  );
};

export default BudgetAnalysisSummary;

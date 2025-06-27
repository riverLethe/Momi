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
} from "tamagui";
import {
  BotIcon,
  EditIcon,
  WalletIcon,
} from "lucide-react-native";
import { formatCurrency } from "@/utils/format";
import BudgetHealthCard from "@/components/reports/BudgetHealthCard";
import type { Bill } from "@/types/bills.types";
import type { Budgets } from "@/utils/budget.utils";
import {
  DatePeriodEnum,
  HealthScore,
} from "@/types/reports.types";

// 预算状态类型
export type BudgetStatusType = "good" | "warning" | "danger" | "none";

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

// 类别支出状态类型 (新)
export type CategoryStatusType =
  | "increased"   // 比上周期增加
  | "decreased"   // 比上周期减少
  | "unchanged"   // 基本持平(变化<5%)
  | "overBudget"  // 超出预算
  | "withinBudget" // 在预算内
  | "normal"      // 兼容旧版本
  | "exceeding"   // 兼容旧版本
  | "save";       // 兼容旧版本

// 类别支出分析
export interface CategorySpending {
  id: string;
  label: string;
  amount: number;          // 当前周期支出
  previousAmount?: number;  // 上个周期支出(可选)
  budget?: number;         // 该类别的预算（可选）
  changePercentage?: number; // 变化百分比（可选）
  color?: string;
  status?: CategoryStatusType; // 可选，如果在组件外部已计算
  percentage?: number;     // 兼容旧版本
}

// 组件属性定义
interface BudgetSummaryCardProps {
  budgetStatus: BudgetStatusInfo;
  categories: CategorySpending[];
  /**
   * Provide budgets for three periods. A value of null/undefined stands for "not set".
   */
  budgets: {
    weekly?: number | null;
    monthly?: number | null;
    yearly?: number | null;
  };
  onCategoryPress?: (categoryId: string) => void;
  onEditBudgetPress?: () => void;
  isLoading?: boolean;

  bills?: Bill[];
  /** Full budgets detail object including filters */
  budgetsDetail?: Budgets;
  periodType: DatePeriodEnum;
  periodStart?: Date;
  periodEnd?: Date;
  /** Triggered when user needs to set a budget (used to open modal) */
  onChatPress?: () => void;
  healthScore?: HealthScore;
}

export const BudgetSummaryCard: React.FC<BudgetSummaryCardProps> = ({
  budgetStatus,
  categories,
  budgets,
  onCategoryPress,
  onEditBudgetPress,
  isLoading = false,
  bills,
  budgetsDetail,
  periodType,
  periodStart,
  periodEnd,
  onChatPress,
  healthScore,
}) => {
  const { t } = useTranslation();

  // 计算类别状态
  const getCategoryStatus = (current: number, previous: number = 0, budget?: number): CategoryStatusType => {
    // 如果有预算，首先检查是否超出预算
    if (budget && budget > 0) {
      return current > budget ? "overBudget" : "withinBudget";
    }

    // 计算环比变化百分比
    const changePercentage = previous === 0
      ? (current > 0 ? 100 : 0) // 如果上期为0，本期有值则为100%增长
      : ((current - previous) / previous) * 100;

    // 环比变化判断
    if (Math.abs(changePercentage) < 5) {
      return "unchanged";
    } else if (changePercentage > 0) {
      return "increased";
    } else {
      return "decreased";
    }
  };

  // 获取类别状态信息（同时处理新旧版本兼容）
  const getCategoryStatusInfo = (
    category: CategorySpending
  ) => {
    // 处理旧版本数据格式
    if (category.status === "normal" ||
      category.status === "exceeding" ||
      category.status === "save") {
      // 使用旧版本的状态处理逻辑
      const percentage = category.percentage || 0;

      switch (category.status) {
        case "normal":
          return {
            color: "#aaaaaa",
            label: t("Normal"),
          };
        case "exceeding":
          return {
            color: "#EF4444",
            label: t(`Exceeding by {{percentage}}%`, {
              percentage,
            }),
          };
        case "save":
          return {
            color: "#10B981",
            label: t(`Save {{percentage}}%`, {
              percentage,
            }),
          };
      }
    }

    // 提取新版本所需属性（设置默认值防止错误）
    const {
      amount,
      previousAmount = 0,
      budget,
      status: providedStatus
    } = category;

    // 使用提供的状态或计算新状态
    const status = providedStatus || getCategoryStatus(amount, previousAmount, budget);

    // 计算变化百分比（用于显示）
    const changePercentage = previousAmount === 0
      ? (amount > 0 ? 100 : 0)
      : Math.round(((amount - previousAmount) / previousAmount) * 100);

    switch (status) {
      case "increased":
        return {
          color: "#EF4444", // 红色
          label: t(`Increased by {{percentage}}%`, {
            percentage: Math.abs(changePercentage),
          }),
        };
      case "decreased":
        return {
          color: "#10B981", // 绿色
          label: t(`Decreased by {{percentage}}%`, {
            percentage: Math.abs(changePercentage),
          }),
        };
      case "unchanged":
        return {
          color: "#aaaaaa", // 灰色
          label: t("Similar to last period"),
        };
      case "overBudget":
        return {
          color: "#EF4444", // 红色
          label: t(`{{percentage}}% over budget`, {
            percentage: Math.round(((amount - (budget || 0)) / (budget || 1)) * 100),
          }),
        };
      case "withinBudget":
        return {
          color: "#10B981", // 绿色
          label: t(`{{percentage}}% of budget`, {
            percentage: Math.round((amount / (budget || 1)) * 100),
          }),
        };
      default:
        // 兜底返回，确保总是有值
        return {
          color: "#aaaaaa",
          label: t("No comparison data"),
        };
    }
  };

  // Map DatePeriodEnum to BudgetPeriod key
  const periodKey: BudgetPeriod =
    periodType === DatePeriodEnum.WEEK
      ? "weekly"
      : periodType === DatePeriodEnum.MONTH
        ? "monthly"
        : "yearly";

  const periodBudget = budgets[periodKey] ?? null;

  // Choose the effective budget overview: prefer explicit overviewBudget (from reports)
  const effectiveBudget = {
    amount: periodBudget,
    spent: budgetStatus.spent,
    remaining: budgetStatus.remaining,
    percentage: budgetStatus.percentage,
    status: budgetStatus.status,
  };

  const isBudgetSet = effectiveBudget.amount != null;

  // Determine severity primarily from health-score, otherwise from budget status
  const severity: "good" | "warning" | "danger" = healthScore
    ? healthScore.status === "Poor"
      ? "danger"
      : healthScore.status === "Fair"
        ? "warning"
        : "good"
    : effectiveBudget.status === "danger"
      ? "danger"
      : effectiveBudget.status === "warning"
        ? "warning"
        : "good";

  return (
    <>
      <Card
        backgroundColor="white"
        marginHorizontal="$3"
        padding="$3"
        borderRadius="$4"
      >
        <YStack gap="$4">
          {/* Header with status */}
          <XStack justifyContent="space-between" alignItems="center">
            <XStack gap="$2" alignItems="center">
              <WalletIcon size={24} color="#6366F1" />
              <Text fontSize="$4" fontWeight="$8" color="$gray12">
                {t("Budget")}
              </Text>
            </XStack>

            <XStack gap="$2" alignItems="center">
              {
                isBudgetSet && (
                  <Button
                    size="$2"
                    borderWidth={1}
                    paddingHorizontal="$2"
                    pressStyle={{ opacity: 0.8 }}
                    onPress={onChatPress}
                  >
                    <BotIcon size={20} color="#6366F1" />
                  </Button>
                )
              }

              <Button
                size="$2"
                borderWidth={1}
                paddingHorizontal="$2"
                pressStyle={{ opacity: 0.8 }}
                onPress={onEditBudgetPress}
              >
                <EditIcon size={16} />
              </Button>
            </XStack>
          </XStack>

          {isLoading ? (
            null
          ) : !isBudgetSet ? (
            <YStack gap="$4" alignItems="center" paddingVertical="$4">
              <YStack alignItems="center" gap="$2">
                <Text fontWeight="$7" fontSize="$4" color="$gray12" textAlign="center">
                  {t("Set up a budget for this period to unlock detailed insights")}
                </Text>
              </YStack>
            </YStack>
          ) : (
            <YStack gap="$3">
              {/* Replaced progress bar with merged BudgetHealthCard */}
              <BudgetHealthCard budget={effectiveBudget as any} health={healthScore} severity={severity} />
              <Separator marginVertical="$3" />

              {/* 类别分析 */}
              <YStack gap="$3">
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
                  <YStack gap="$1">
                    {categories.map((category) => {
                      // 确保类别对象总是包含必要属性
                      const safeCategory = {
                        id: category.id,
                        label: category.label,
                        amount: category.amount || 0,
                        previousAmount: category.previousAmount || 0,
                        percentage: category.percentage || 0,
                        status: category.status,
                        color: category.color,
                      };

                      const catStatus = getCategoryStatusInfo(safeCategory);

                      return (
                        <Pressable
                          key={category.id}
                          onPress={() => onCategoryPress?.(category.id)}
                          style={({ pressed }) => ({ opacity: onCategoryPress && pressed ? 0.7 : 1 })}
                        >
                          <XStack
                            justifyContent="space-between"
                            alignItems="center"
                            paddingVertical="$2"
                          >
                            <XStack gap="$2" alignItems="center">
                              <View
                                style={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: 3,
                                  backgroundColor:
                                    category.color || catStatus.color,
                                }}
                              />
                              <Text fontSize="$3" color="$gray11">
                                {t(category.label)}
                              </Text>
                            </XStack>

                            <XStack alignItems="center" gap="$2">
                              <Text
                                fontSize="$2"
                                color={catStatus.color}
                                backgroundColor={`${catStatus.color}10`}
                                paddingHorizontal="$2"
                                paddingVertical="$1"
                                borderRadius="$2"
                              >
                                {catStatus.label}
                              </Text>
                              <Text fontSize="$3" fontWeight="$5">
                                {formatCurrency(category.amount)}
                              </Text>
                            </XStack>
                          </XStack>
                        </Pressable>
                      );
                    })}
                  </YStack>
                )}
              </YStack>
            </YStack>
          )}

        </YStack>
      </Card>
    </>
  );
};

export default BudgetSummaryCard;

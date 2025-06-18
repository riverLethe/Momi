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
  Avatar,
  Spinner,
} from "tamagui";
import {
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  EditIcon,
  DollarSign,
} from "lucide-react-native";
import { formatCurrency } from "@/utils/format";

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
interface BudgetSummaryCardProps {
  budgetStatus: BudgetStatusInfo;
  categories: CategorySpending[];
  isPersonalView?: boolean;
  /**
   * Provide budgets for three periods. A value of null/undefined stands for "not set".
   */
  budgets: {
    weekly?: number | null;
    monthly?: number | null;
    yearly?: number | null;
  };
  /**
   * Currently selected budget period. If provided together with `onPeriodChange`,
   * the component will behave as a controlled component. When omitted, the
   * component will manage the period selection internally (back-compat).
   */
  currentPeriod?: BudgetPeriod;
  /** Optional callback when user selects a different period */
  onPeriodChange?: (period: BudgetPeriod) => void;
  /** @deprecated kept for backward compatibility */
  currentBudget?: number | null;
  onCategoryPress?: (categoryId: string) => void;
  onManageBudgetPress?: () => void;
  onEditBudgetPress?: () => void;
  isLoading?: boolean;
}

// Get status info
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
    case "none":
      return {
        icon: <DollarSign size={18} color="#3B82F6" />,
        color: "#3B82F6",
        backgroundColor: "#EBF5FF",
        label: "No Budget",
      };
  }
};

// 获取预算周期标签
const getPeriodLabel = (period: BudgetPeriod, t: (key: string) => string) => {
  switch (period) {
    case "weekly":
      return t("Week");
    case "monthly":
      return t("Month");
    case "yearly":
      return t("Year");
  }
};

export const BudgetSummaryCard: React.FC<BudgetSummaryCardProps> = ({
  budgetStatus,
  categories,
  isPersonalView = true,
  budgets,
  currentPeriod: controlledPeriod,
  onPeriodChange,
  currentBudget: _deprecatedBudget,
  onCategoryPress,
  onManageBudgetPress,
  onEditBudgetPress,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const statusInfo = getBudgetStatusInfo(budgetStatus.status);

  // 获取类别状态信息
  const getCategoryStatusInfo = (
    status: CategoryStatusType,
    percentage: number
  ) => {
    switch (status) {
      case "normal":
        return {
          color: "#aaaaaa",
          label: t("Normal"),
        };
      case "exceeding":
        return {
          color: "#EF4444",
          label: t(`Exceeding by {{percentage}}%`, {
            percentage: percentage,
          }),
        };
      case "save":
        return {
          color: "#10B981",
          label: t(`Save {{percentage}}%`, {
            percentage: percentage,
          }),
        };
    }
  };

  // Period selection – behaves as controlled if `controlledPeriod` is supplied
  const [internalPeriod, setInternalPeriod] = React.useState<BudgetPeriod>(
    controlledPeriod ?? "monthly"
  );

  // Keep internal state in sync with controlled prop (if any)
  React.useEffect(() => {
    if (
      controlledPeriod !== undefined &&
      controlledPeriod !== internalPeriod
    ) {
      setInternalPeriod(controlledPeriod);
    }
  }, [controlledPeriod, internalPeriod]);

  // Handle period button press
  const handleSelectPeriod = (period: BudgetPeriod) => {
    if (onPeriodChange) {
      // Controlled – notify parent
      onPeriodChange(period);
    } else {
      // Uncontrolled – manage locally for backward compatibility
      setInternalPeriod(period);
    }
  };

  const periodBudget = budgets[internalPeriod] ?? _deprecatedBudget ?? null;

  // Check if we have actual spending data
  const hasSpendingData = budgetStatus.spent > 0 || categories.length > 0;

  // Format budget display
  const formatBudget = (amount: number | null) => {
    if (amount === null) return t("Not Set");
    return formatCurrency(amount);
  };

  // Calculate progress bar color
  const getProgressColor = (status: BudgetStatusType, percentage: number) => {
    if (status === "danger") return "#EF4444";
    if (status === "warning" || percentage > 70) return "#F59E0B";
    return "#10B981";
  };

  // Clamp progress bar value to [0, 100] so UI remains consistent even when spending exceeds the budget
  const progressValue = Math.min(Math.max(budgetStatus.percentage, 0), 100);

  return (
    <>
      <Card
        backgroundColor="white"
        marginHorizontal="$2"
        marginBottom="$4"
        padding="$4"
      >
        <YStack gap="$4">
          {/* Header with status */}
          <XStack justifyContent="space-between" alignItems="center">
            <XStack gap="$2" alignItems="center">
              <Avatar
                backgroundColor={statusInfo.backgroundColor}
                borderWidth={2}
                borderColor={statusInfo.color}
                size="$2.5"
                borderRadius="$10"
              >
                {statusInfo.icon}
              </Avatar>
              <Text fontSize="$4" fontWeight="$8" color="$gray12">
                {t("Budget")}
              </Text>
            </XStack>

            <XStack gap="$2">
              {/* Segmented control */}
              <XStack gap="$1">
                {(["weekly", "monthly", "yearly"] as BudgetPeriod[]).map((p) => (
                  <Button
                    key={p}
                    onPress={() => handleSelectPeriod(p)}
                    backgroundColor={internalPeriod === p ? "$blue9" : "$gray2"}
                    color={internalPeriod === p ? "white" : "$gray11"}
                    size="$2"
                    paddingHorizontal="$2"
                  >
                    {t(getPeriodLabel(p, t))}
                  </Button>
                ))}
              </XStack>
              {periodBudget && (
                <Button
                  size="$2"
                  borderWidth={1}
                  paddingHorizontal="$2"
                  pressStyle={{ opacity: 0.8 }}
                  onPress={onEditBudgetPress}
                >
                  <EditIcon size={16} />
                </Button>
              )}
            </XStack>
          </XStack>

          {isLoading ? (
            <YStack alignItems="center" justifyContent="center" height={120}>
              <Spinner size="large" color="#3B82F6" />
              <Text marginTop="$2" color="$gray9">
                {t("Loading...")}
              </Text>
            </YStack>
          ) : periodBudget ? (
            <YStack gap="$3">
              <Text fontSize="$3" fontWeight="$6" color="$gray10">
                {t("Spending Analysis")}
              </Text>

              {/* 进度条 */}
              <YStack gap="$2">
                <Progress
                  value={progressValue}
                  backgroundColor="$gray4"
                >
                  <Progress.Indicator
                    animation="bouncy"
                    backgroundColor={getProgressColor(
                      budgetStatus.status,
                      budgetStatus.percentage
                    )}
                  />
                </Progress>

                <XStack justifyContent="space-between">
                  <Text fontSize="$3" color="$gray10">
                    {t("Spent")}: {formatCurrency(budgetStatus.spent)} (
                    {budgetStatus.percentage.toFixed(2)}%)
                  </Text>
                  <XStack alignItems="flex-end">
                    <Text
                      fontSize="$3"
                      fontWeight="$7"
                      color={budgetStatus.remaining > 0 ? "$green9" : "$red9"}
                    >
                      {t("Total")}: {formatBudget(periodBudget)}
                    </Text>
                    <Text color="$gray10" fontSize="$3" marginHorizontal="$1">
                      /
                    </Text>
                    <Text fontSize="$3" fontWeight="$6" color="$gray10">
                      {getPeriodLabel(internalPeriod, t)}
                    </Text>
                  </XStack>
                </XStack>
              </YStack>
            </YStack>
          ) : (
            <YStack gap="$4" alignItems="center" paddingVertical="$4">
              <YStack alignItems="center" gap="$2">
                <Text fontWeight="$7" fontSize="$4" color="$gray12">
                  {t("No Budget Set")}
                </Text>
                <Text
                  fontSize="$3"
                  color="$gray10"
                  textAlign="center"
                  paddingHorizontal="$6"
                >
                  {t(
                    "Set up your budget to track your spending against your financial goals"
                  )}
                </Text>
              </YStack>

              <Button
                size="$3"
                backgroundColor="$blue9"
                color="white"
                paddingHorizontal="$4"
                marginTop="$2"
                pressStyle={{ opacity: 0.8 }}
                onPress={onEditBudgetPress}
              >
                {t("Set Budget")}
              </Button>
            </YStack>
          )}

          {periodBudget && (
            <>
              <Separator marginBottom="$3" />

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
                            <XStack gap="$2" alignItems="center">
                              <View
                                style={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: 6,
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
            </>
          )}

          {/* Only show "View More Report" button if there's actual spending data */}
          {hasSpendingData && periodBudget && (
            <>
              <Button
                backgroundColor="$blue2"
                color="$blue9"
                size="$3"
                onPress={onManageBudgetPress}
                pressStyle={{ opacity: 0.8 }}
                borderColor="$blue6"
                borderWidth={1}
              >
                {t("View More Report")}
              </Button>

              <Text fontSize="$2" color="$gray9" marginTop="$2">
                {t(
                  "View detailed reports to better understand your spending patterns"
                )}
              </Text>
            </>
          )}
        </YStack>
      </Card>
    </>
  );
};

export default BudgetSummaryCard;

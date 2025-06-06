import React, { useState } from "react";
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
  Dialog,
  Adapt,
  Sheet,
  Input,
  Label,
  Avatar,
  Heading,
  Group,
} from "tamagui";
import { 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle, 
  EditIcon,
  Check,
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
interface BudgetSummaryCardProps {
  budgetStatus: BudgetStatusInfo;
  categories: CategorySpending[];
  isPersonalView?: boolean;
  currentPeriod: BudgetPeriod;
  currentBudget: number | null;
  onSaveBudget: (amount: number, period: BudgetPeriod) => Promise<void>;
  onCategoryPress?: (categoryId: string) => void;
  onManageBudgetPress: () => void;
  isLoading?: boolean;
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
        label: "On Track"
      };
    case "warning":
      return {
        icon: <AlertTriangle size={18} color="#F59E0B" />,
        color: "#F59E0B",
        backgroundColor: "#FFFBEB",
        label: "Watch Spending"
      };
    case "danger":
      return {
        icon: <TrendingDown size={18} color="#EF4444" />,
        color: "#EF4444",
        backgroundColor: "#FEF2F2",
        label: "Over Budget"
      };
  }
};

// 获取类别状态信息
const getCategoryStatusInfo = (status: CategoryStatusType, percentage: number) => {
  switch (status) {
    case "normal":
      return {
        color: "#aaaaaa",
        label: "Normal"
      };
    case "exceeding":
      return {
        color: "#EF4444",
        label: `Exceeding by ${percentage}%`
      };
    case "save":
      return {
        color: "#10B981",
        label: `Save ${percentage}%`
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
  currentPeriod,
  currentBudget,
  onSaveBudget,
  onCategoryPress,
  onManageBudgetPress,
  isLoading = false,
  currency = "¥"
}) => {
  const { t } = useTranslation();
  const statusInfo = getBudgetStatusInfo(budgetStatus.status);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<BudgetPeriod>(currentPeriod);
  const [budgetAmount, setBudgetAmount] = useState(currentBudget?.toString() || "");
  const [dialogLoading, setDialogLoading] = useState(false);
  
  // 格式化货币金额
  const formatCurrency = (amount: number) => {
    return `${currency}${amount.toLocaleString()}`;
  };

  // 格式化预算显示
  const formatBudget = (amount: number | null) => {
    if (amount === null) return t("Not Set");
    return formatCurrency(amount);
  };
  
  // 计算进度条颜色
  const getProgressColor = (status: BudgetStatusType, percentage: number) => {
    if (status === "danger") return "#EF4444";
    if (status === "warning" || percentage > 70) return "#F59E0B";
    return "#10B981";
  };

  // 保存预算
  const handleSaveBudget = async () => {
    if (!budgetAmount) return;
    
    const amount = parseFloat(budgetAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    setDialogLoading(true);
    try {
      await onSaveBudget(amount, selectedPeriod);
      setShowDialog(false);
    } finally {
      setDialogLoading(false);
    }
  };

  return (
    <>
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
              <Avatar backgroundColor={statusInfo.backgroundColor} borderWidth={2} borderColor={statusInfo.color} size="$2.5" borderRadius="$15">
                {statusInfo.icon}
              </Avatar>
              <Text fontSize="$4" fontWeight="$8" color="$gray12">
                {t("Budget")}
              </Text>
            </XStack>
            
            <XStack space="$2">
              <Button
                size="$2"
                borderWidth={1}
                paddingHorizontal="$2"
                pressStyle={{ opacity: 0.8 }}
                onPress={() => setShowDialog(true)}
              >
                <EditIcon size={16} />
              </Button>
            </XStack>
          </XStack>
          
                  
          {/* 预算分析 */}
          <YStack space="$3">
            <Text fontSize="$3" fontWeight="$6" color="$gray10">
              {t("Spending Analysis")}
            </Text>
            
            {/* 进度条 */}
            <YStack space="$2">
              <Progress 
                value={budgetStatus.percentage} 
                backgroundColor="$gray4"
              >
                <Progress.Indicator 
                  animation="bouncy" 
                  backgroundColor={getProgressColor(budgetStatus.status, budgetStatus.percentage)} 
                />
              </Progress>
              
              <XStack justifyContent="space-between">
                <Text fontSize="$3" color="$gray10">
                  {t("Spent")}: {formatCurrency(budgetStatus.spent)} ({budgetStatus.percentage}%)
                </Text>
               <XStack alignItems="flex-end">
                 <Text 
                  fontSize="$3" 
                  fontWeight="$7" 
                  color={budgetStatus.remaining > 0 ? "$green9" : "$red9"}
                >
                  {t("Total")}: {formatBudget(currentBudget)} 
                </Text>
                <Text color="$gray10" fontSize="$3" marginHorizontal="$1">/</Text>
                <Text 
                  fontSize="$2.5" 
                  fontWeight="$6" 
                  color="$gray10"
                >
                  {getPeriodLabel(currentPeriod, t)}
                </Text>
               </XStack>
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
              <Text fontSize="$2" color="$gray9" textAlign="center" paddingVertical="$3">
                {t("No spending data available")}
              </Text>
            ) : (
              <YStack space="$1">
                {categories.map((category) => {
                  const catStatus = getCategoryStatusInfo(category.status, category.percentage);
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
                              backgroundColor: category.color || catStatus.color
                            }} 
                          />
                          <Text fontSize="$3" color="$gray11">
                            {t(category.label)}
                          </Text>
                        </XStack>
                        
                        <XStack alignItems="center" space="$2">
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
            {t("View More Report")}
          </Button>
          
          <Text fontSize="$2" color="$gray9">
            {t("View detailed reports to better understand your spending patterns")}
          </Text>
        </YStack>
      </Card>
      
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <Adapt platform="touch">
          <Sheet
            modal
            dismissOnSnapToBottom
            animation="medium"
          >
            <Sheet.Frame padding="$4">
              <Sheet.Handle />
              <YStack space="$5">
                {/* 标题 */}
                <Text fontSize="$6" fontWeight="$8" textAlign="center">
                  {t("Update Budget")}
                </Text>
                
                {/* 预算金额输入 */}
                <YStack space="$3">
                  <Label htmlFor="budget-amount" fontSize="$4" fontWeight="$6" color="$gray11">
                    {t("Budget Amount")}
                  </Label>
                  <Input
                    id="budget-amount"
                    size="$4"
                    placeholder={`${currency}5,000`}
                    keyboardType="numeric"
                    value={budgetAmount}
                    onChangeText={setBudgetAmount}
                    borderColor="$gray5"
                    borderWidth={1}
                    backgroundColor="$gray1"
                    fontSize="$5"
                  />
                </YStack>
                
                {/* 预算周期选择 - 使用自定义按钮组 */}
                <YStack space="$3">
                  <Label fontSize="$4" fontWeight="$6" color="$gray11">
                    {t("Budget Period")}
                  </Label>
                  <XStack borderRadius="$4" overflow="hidden">
                    {(["weekly", "monthly", "yearly"] as BudgetPeriod[]).map((period) => (
                      <Button
                        key={period}
                        size="$4"
                        flex={1}
                        backgroundColor={selectedPeriod === period ? "$blue9" : "$gray3"}
                        color={selectedPeriod === period ? "white" : "$gray11"}
                        onPress={() => setSelectedPeriod(period)}
                        borderRadius={0}
                        borderWidth={0}
                        marginHorizontal={0}
                        animation="quick"
                      >
                        {getPeriodLabel(period, t)}
                      </Button>
                    ))}
                  </XStack>
                </YStack>
                
                {/* 操作按钮 */}
                <XStack space="$3" marginTop="$3">
                  <Button
                    size="$4"
                    flex={1}
                    backgroundColor="$gray4"
                    color="$gray12"
                    onPress={() => setShowDialog(false)}
                    pressStyle={{ opacity: 0.8 }}
                  >
                    {t("Cancel")}
                  </Button>
                  <Button
                    size="$4"
                    flex={1}
                    backgroundColor="$blue9"
                    color="white"
                    onPress={handleSaveBudget}
                    disabled={dialogLoading || !budgetAmount}
                    pressStyle={{ opacity: 0.8 }}
                  >
                    {t("Save")}
                  </Button>
                </XStack>
              </YStack>
            </Sheet.Frame>
            <Sheet.Overlay />
          </Sheet>
        </Adapt>
      </Dialog>
    </>
  );
};

export default BudgetSummaryCard; 
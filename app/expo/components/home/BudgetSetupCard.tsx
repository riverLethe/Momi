import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  XStack,
  YStack,
  Text,
  Button,
  Input,
  Label,
  Separator,
  Dialog,
  Adapt,
  Sheet,
  Spinner,
} from "tamagui";
import { Check, X, EditIcon, BadgeDollarSignIcon } from "lucide-react-native";

// 预算周期类型
export type BudgetPeriod = "weekly" | "monthly" | "yearly";

// 预算设置组件属性
interface BudgetSetupCardProps {
  currentPeriod: BudgetPeriod;
  currentBudget: number | null;
  currency?: string;
  onSaveBudget: (
    amount: number,
    period: BudgetPeriod,
    filterMode: "all" | "include" | "exclude",
    selectedCategories: string[]
  ) => Promise<void>;
  isLoading?: boolean;
}

export const BudgetSetupCard: React.FC<BudgetSetupCardProps> = ({
  currentPeriod,
  currentBudget,
  currency = "¥",
  onSaveBudget,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const [showDialog, setShowDialog] = useState(false);
  const [selectedPeriod, setSelectedPeriod] =
    useState<BudgetPeriod>(currentPeriod);
  const [budgetAmount, setBudgetAmount] = useState(
    currentBudget?.toString() || ""
  );
  const [dialogLoading, setDialogLoading] = useState(false);

  // 格式化预算显示
  const formatBudget = (amount: number | null) => {
    if (amount === null) return t("Not Set");
    return `${currency}${amount.toLocaleString()}`;
  };

  // 获取预算周期显示文本
  const getPeriodLabel = (period: BudgetPeriod) => {
    switch (period) {
      case "weekly":
        return t("Weekly");
      case "monthly":
        return t("Monthly");
      case "yearly":
        return t("Yearly");
      default:
        return "";
    }
  };

  // 保存预算
  const handleSaveBudget = async () => {
    if (!budgetAmount) return;

    const amount = parseFloat(budgetAmount);
    if (isNaN(amount) || amount <= 0) return;

    setDialogLoading(true);
    try {
      await onSaveBudget(amount, selectedPeriod, "all", []);
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
          <XStack alignItems="center" justifyContent="space-between">
            <XStack alignItems="center" space="$2">
              <BadgeDollarSignIcon size={24} />
              <Text fontSize="$4" fontWeight="$8" color="$gray12">
                {t("Budget Setup")}
              </Text>
            </XStack>

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

          <Separator />

          <YStack space="$3">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$3" color="$gray11">
                {t("Current Budget")}
              </Text>
              <Text
                fontWeight="$7"
                fontSize="$4"
                color={currentBudget ? "$green9" : "$gray9"}
              >
                {formatBudget(currentBudget)}
              </Text>
            </XStack>

            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$3" color="$gray11">
                {t("Budget Period")}
              </Text>
              <Text
                fontWeight="$6"
                fontSize="$3"
                color="$blue9"
                backgroundColor="$blue2"
                paddingHorizontal="$2"
                paddingVertical="$1"
                borderRadius="$2"
              >
                {getPeriodLabel(currentPeriod)}
              </Text>
            </XStack>
          </YStack>

          <Text fontSize="$2" color="$gray9">
            {t(
              "Setting a budget helps you track spending and achieve financial goals"
            )}
          </Text>
        </YStack>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <Adapt platform="touch">
          <Sheet modal dismissOnSnapToBottom animation="bouncy">
            <Sheet.Frame padding="$4">
              <Sheet.Handle />
              <YStack space="$4" marginTop="$2">
                <Text fontSize="$5" fontWeight="$8" textAlign="center">
                  {currentBudget ? t("Update Budget") : t("Set Your Budget")}
                </Text>

                <YStack space="$3">
                  <Label htmlFor="amount" fontSize="$3" color="$gray11">
                    {t("Budget Amount")}
                  </Label>
                  <Input
                    id="amount"
                    size="$4"
                    placeholder={`${currency}5,000`}
                    keyboardType="numeric"
                    value={budgetAmount}
                    onChangeText={setBudgetAmount}
                    borderWidth={1}
                    borderColor="$gray5"
                    backgroundColor="$gray1"
                  />
                </YStack>

                <YStack space="$3">
                  <Label fontSize="$3" color="$gray11">
                    {t("Budget Period")}
                  </Label>
                  <XStack space="$2">
                    {(["weekly", "monthly", "yearly"] as BudgetPeriod[]).map(
                      (period) => (
                        <Button
                          key={period}
                          size="$3"
                          flex={1}
                          backgroundColor={
                            selectedPeriod === period ? "$blue9" : "$gray3"
                          }
                          color={
                            selectedPeriod === period ? "white" : "$gray11"
                          }
                          onPress={() => setSelectedPeriod(period)}
                          pressStyle={{ opacity: 0.8 }}
                        >
                          {getPeriodLabel(period)}
                        </Button>
                      )
                    )}
                  </XStack>
                </YStack>

                <XStack space="$3" marginTop="$2">
                  <Button
                    size="$4"
                    flex={1}
                    backgroundColor="$gray3"
                    onPress={() => setShowDialog(false)}
                    icon={X}
                  >
                    {t("Cancel")}
                  </Button>
                  <Button
                    size="$4"
                    flex={2}
                    backgroundColor="$green9"
                    color="white"
                    onPress={handleSaveBudget}
                    disabled={dialogLoading || !budgetAmount}
                    pressStyle={{ opacity: 0.8 }}
                    iconAfter={
                      dialogLoading ? () => <Spinner color="white" /> : Check
                    }
                  >
                    {t("Save Budget")}
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

export default BudgetSetupCard;

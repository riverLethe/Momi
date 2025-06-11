import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  YStack,
  XStack,
  Text,
  Button,
  Input,
  Label,
  Dialog,
  Adapt,
  Sheet,
  Spinner,
} from "tamagui";
import { Check, X } from "lucide-react-native";

// Budget period type
export type BudgetPeriod = "weekly" | "monthly" | "yearly";

interface BudgetUpdateModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentPeriod: BudgetPeriod;
  currentBudget: number | null;
  currency?: string;
  onSaveBudget: (amount: number, period: BudgetPeriod) => Promise<void>;
}

const BudgetUpdateModal: React.FC<BudgetUpdateModalProps> = ({
  isOpen,
  onOpenChange,
  currentPeriod,
  currentBudget,
  currency = "¥",
  onSaveBudget,
}) => {
  const { t } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] =
    useState<BudgetPeriod>(currentPeriod);
  const [budgetAmount, setBudgetAmount] = useState(
    currentBudget?.toString() || ""
  );
  const [isLoading, setIsLoading] = useState(false);

  // Get period label
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

  // Save budget
  const handleSaveBudget = async () => {
    if (!budgetAmount) return;

    const amount = parseFloat(budgetAmount);
    if (isNaN(amount) || amount <= 0) return;

    setIsLoading(true);
    try {
      await onSaveBudget(amount, selectedPeriod);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save budget:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <Adapt platform="touch">
        <Sheet modal dismissOnSnapToBottom animation="medium">
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
                        color={selectedPeriod === period ? "white" : "$gray11"}
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
                  onPress={() => onOpenChange(false)}
                >
                  {t("Cancel")}
                </Button>
                <Button
                  size="$4"
                  flex={1}
                  backgroundColor="$blue9"
                  color="white"
                  onPress={handleSaveBudget}
                  disabled={isLoading || !budgetAmount}
                  pressStyle={{ opacity: 0.8 }}
                  iconAfter={
                    isLoading ? () => <Spinner color="white" /> : <></>
                  }
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
  );
};

export default BudgetUpdateModal;

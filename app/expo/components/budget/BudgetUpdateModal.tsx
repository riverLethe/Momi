import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  YStack,
  XStack,
  Text,
  Button,
  Input,
  Label,
  Sheet,
  Spinner,
  Select,
  Adapt,
  Paragraph,
  Avatar,
} from "tamagui";
import { ChevronDown, Check } from "lucide-react-native";
import { EXPENSE_CATEGORIES, getCategoryIcon } from "@/constants/categories";

// Budget period type
export type BudgetPeriod = "weekly" | "monthly" | "yearly";
type FilterMode = "all" | "include" | "exclude";

interface BudgetUpdateModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentPeriod: BudgetPeriod;
  currentBudget: number | null;
  currency?: string;
  /**
   * Callback after saving budget.
   * @param amount Budget amount
   * @param period Budget period
   * @param filterMode Category filter mode
   * @param categories Selected categories depending on mode
   */
  onSaveBudget: (
    amount: number,
    period: BudgetPeriod,
    filterMode: FilterMode,
    categories: string[]
  ) => Promise<void>;
  // Existing filter settings
  initialCategories?: string[];
}

const BudgetUpdateModal: React.FC<BudgetUpdateModalProps> = ({
  isOpen,
  onOpenChange,
  currentPeriod,
  currentBudget,
  currency = "¥",
  onSaveBudget,
  initialCategories = [],
}) => {
  const { t } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] =
    useState<BudgetPeriod>(currentPeriod);
  const [budgetAmount, setBudgetAmount] = useState(
    currentBudget?.toString() || ""
  );
  const [isLoading, setIsLoading] = useState(false);

  const [ignoredCategories, setIgnoredCategories] =
    useState<string[]>(initialCategories);
  const [isCategorySheetOpen, setCategorySheetOpen] = useState(false);

  // Reset temporary state whenever modal opens (or props update)
  useEffect(() => {
    if (!isOpen) return;
    setSelectedPeriod(currentPeriod);
    setBudgetAmount(currentBudget?.toString() || "");
    setIgnoredCategories(initialCategories);
  }, [isOpen]);

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
      const modeToSave: FilterMode =
        ignoredCategories.length > 0 ? "exclude" : "all";

      await onSaveBudget(amount, selectedPeriod, modeToSave, ignoredCategories);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save budget:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet
      open={isOpen}
      onOpenChange={onOpenChange}
      snapPoints={[45]}
      /* Prevent closing the sheet via swipe or overlay press */
      disableDrag
      dismissOnSnapToBottom={false}
      dismissOnOverlayPress={false}
    >
      <Sheet.Overlay />
      <Sheet.Frame padding="$4" paddingBottom="$6">
        <Sheet.ScrollView showsVerticalScrollIndicator={false}>
          <YStack gap="$1" marginTop="$2">
            <XStack
              justifyContent="space-between"
              alignItems="center"
              marginBottom="$2"
            >
              <Text flex={1} fontSize={18} fontWeight="700">
                {t("Set Budget")}
              </Text>

              <XStack gap="$2">
                <Button
                  size="$2"
                  backgroundColor="$gray3"
                  onPress={() => onOpenChange(false)}
                >
                  {t("Cancel")}
                </Button>
                <Button
                  size="$2"
                  backgroundColor="$blue9"
                  color="white"
                  onPress={handleSaveBudget}
                  disabled={isLoading || !budgetAmount}
                  pressStyle={{ opacity: 0.8 }}
                  iconAfter={
                    isLoading ? () => <Spinner color="white" /> : undefined
                  }
                >
                  {t("Save")}
                </Button>
              </XStack>
            </XStack>

            <YStack>
              <Label htmlFor="amount" fontSize="$3" color="$gray11">
                {t("Budget Amount")}
              </Label>
              <Input
                id="amount"
                size="$3"
                placeholder={`${currency}5,000`}
                keyboardType="numeric"
                value={budgetAmount}
                onChangeText={setBudgetAmount}
                borderWidth={1}
                borderColor="$gray5"
                backgroundColor="$gray1"
              />
            </YStack>

            {/* Budget Period using dropdown */}
            <YStack>
              <Label fontSize="$3" color="$gray11">
                {t("Budget Period")}
              </Label>
              <Select
                value={selectedPeriod}
                onValueChange={(val) => setSelectedPeriod(val as BudgetPeriod)}
              >
                <Select.Trigger
                  backgroundColor="$gray1"
                  borderColor="$gray5"
                  borderWidth={1}
                  borderRadius="$4"
                  justifyContent="space-between"
                  paddingHorizontal="$3"
                  size="$3"
                >
                  <Select.Value>
                    <Paragraph fontSize="$3" color="$gray11">
                      {getPeriodLabel(selectedPeriod)}
                    </Paragraph>
                  </Select.Value>
                  <Select.Icon>
                    <ChevronDown size={14} color="#64748B" />
                  </Select.Icon>
                </Select.Trigger>
                <Adapt platform="touch">
                  <Sheet modal snapPoints={[30]}>
                    <Sheet.Frame>
                      <Sheet.ScrollView>
                        <Adapt.Contents />
                      </Sheet.ScrollView>
                    </Sheet.Frame>
                    <Sheet.Overlay />
                  </Sheet>
                </Adapt>
                <Select.Content>
                  <Select.ScrollUpButton />
                  <Select.Viewport>
                    <Select.Group>
                      <Select.Item index={0} value="weekly">
                        <Select.ItemText>{t("Weekly")}</Select.ItemText>
                      </Select.Item>
                      <Select.Item index={1} value="monthly">
                        <Select.ItemText>{t("Monthly")}</Select.ItemText>
                      </Select.Item>
                      <Select.Item index={2} value="yearly">
                        <Select.ItemText>{t("Yearly")}</Select.ItemText>
                      </Select.Item>
                    </Select.Group>
                  </Select.Viewport>
                  <Select.ScrollDownButton />
                </Select.Content>
              </Select>
            </YStack>

            {/* Ignore Categories - multi select using custom Sheet */}
            <YStack>
              <Label fontSize="$3" color="$gray11">
                {t("Ignore Categories")}
              </Label>
              <Button
                size="$3"
                backgroundColor="$gray1"
                borderColor="$gray5"
                borderWidth={1}
                borderRadius="$4"
                justifyContent="space-between"
                paddingHorizontal="$3"
                iconAfter={<ChevronDown size={14} color="#64748B" />}
                onPress={() => setCategorySheetOpen(true)}
              >
                <Paragraph fontSize="$3">
                  {ignoredCategories.length === 0
                    ? t("None")
                    : `${ignoredCategories.length} ${t("Selected")}`}
                </Paragraph>
              </Button>

              {/* Multi-select sheet */}
              <Sheet
                modal
                open={isCategorySheetOpen}
                onOpenChange={setCategorySheetOpen}
                snapPoints={[60]}
                dismissOnSnapToBottom={false}
                dismissOnOverlayPress={true}
              >
                <Sheet.Overlay />
                <Sheet.Handle />
                <Sheet.Frame
                  padding="$4"
                  paddingHorizontal="$3"
                  paddingBottom="$6"
                >
                  <YStack flex={1}>
                    <Sheet.ScrollView
                      showsVerticalScrollIndicator={false}
                      flex={1}
                    >
                      <YStack gap="$2" paddingBottom="$6">
                        {EXPENSE_CATEGORIES.map((cat) => {
                          const CategoryIcon = getCategoryIcon(cat.id);
                          const selected = ignoredCategories.includes(cat.id);
                          return (
                            <Button
                              key={cat.id}
                              backgroundColor={
                                selected ? cat.lightColor : "white"
                              }
                              paddingHorizontal="$2"
                              justifyContent="flex-start"
                              onPress={() => {
                                setIgnoredCategories((prev) =>
                                  prev.includes(cat.id)
                                    ? prev.filter((c) => c !== cat.id)
                                    : [...prev, cat.id]
                                );
                              }}
                            >
                              <XStack alignItems="center" gap="$2">
                                <Avatar
                                  circular
                                  size="$2"
                                  backgroundColor={`${cat.color}20`}
                                >
                                  <CategoryIcon size={16} color={cat.color} />
                                </Avatar>
                                <Text fontSize="$3" color="$gray11" flex={1}>
                                  {t(cat.name)}
                                </Text>
                                {selected && (
                                  <Check size={16} color={cat.color} />
                                )}
                              </XStack>
                            </Button>
                          );
                        })}
                      </YStack>
                    </Sheet.ScrollView>
                  </YStack>
                </Sheet.Frame>
              </Sheet>
            </YStack>
          </YStack>
        </Sheet.ScrollView>
      </Sheet.Frame>
    </Sheet>
  );
};

export default BudgetUpdateModal;

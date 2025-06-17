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
  Paragraph,
  Avatar,
} from "tamagui";
import { ChevronDown, Check } from "lucide-react-native";
import { EXPENSE_CATEGORIES, getCategoryIcon } from "@/constants/categories";
import { Budgets, BudgetPeriod, BudgetDetail } from "@/utils/budget.utils";

// Category filter mode
type FilterMode = "all" | "include" | "exclude";

interface BudgetUpdateModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** 当前预算（3 个周期） */
  budgets: Budgets;
  /** 保存回调：返回新的预算对象 */
  onSave: (next: Budgets) => Promise<void>;
  /** 已有类别过滤（用于初始化） */
  initialCategories?: string[];
  currency?: string;
  defaultPeriod?: BudgetPeriod;
}

const BudgetUpdateModal: React.FC<BudgetUpdateModalProps> = ({
  isOpen,
  onOpenChange,
  budgets,
  onSave,
  initialCategories = [],
  currency = "¥",
  defaultPeriod = "weekly",
}) => {
  const { t } = useTranslation();

  // Define per-period form state
  type PeriodForm = {
    amount: string;
    ignoredCategories: string[];
  };

  const [selectedPeriod, setSelectedPeriod] = useState<BudgetPeriod>(defaultPeriod);

  const [form, setForm] = useState<Record<BudgetPeriod, PeriodForm>>({
    weekly: {
      amount: budgets.weekly?.amount?.toString() || "",
      ignoredCategories: budgets.weekly?.categories || [],
    },
    monthly: {
      amount: budgets.monthly?.amount?.toString() || "",
      ignoredCategories: budgets.monthly?.categories || [],
    },
    yearly: {
      amount: budgets.yearly?.amount?.toString() || "",
      ignoredCategories: budgets.yearly?.categories || [],
    },
  });

  const [errors, setErrors] = useState<{ [k in BudgetPeriod]?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCategorySheetOpen, setCategorySheetOpen] = useState(false);

  // Reset when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setForm({
      weekly: {
        amount: budgets.weekly?.amount?.toString() || "",
        ignoredCategories: budgets.weekly?.categories || [],
      },
      monthly: {
        amount: budgets.monthly?.amount?.toString() || "",
        ignoredCategories: budgets.monthly?.categories || [],
      },
      yearly: {
        amount: budgets.yearly?.amount?.toString() || "",
        ignoredCategories: budgets.yearly?.categories || [],
      },
    });
    setSelectedPeriod(defaultPeriod);
    setErrors({});
  }, [isOpen]);

  // Validation rules
  const validate = () => {
    const errs: { [k in BudgetPeriod]?: string } = {};
    const w = parseFloat(form.weekly.amount);
    const m = parseFloat(form.monthly.amount);
    const y = parseFloat(form.yearly.amount);

    if (form.weekly.amount && (isNaN(w) || w <= 0)) {
      errs.weekly = t("Invalid amount");
    }
    if (form.monthly.amount && (isNaN(m) || m <= 0)) {
      errs.monthly = t("Invalid amount");
    }
    if (form.yearly.amount && (isNaN(y) || y <= 0)) {
      errs.yearly = t("Invalid amount");
    }

    // Cross-period rules
    if (!errs.weekly && !errs.monthly && form.weekly.amount && form.monthly.amount) {
      if (m < w * 4) {
        errs.monthly = t("Monthly budget should be at least 4× weekly budget");
      }
    }
    if (!errs.monthly && !errs.yearly && form.monthly.amount && form.yearly.amount) {
      if (y < m * 12) {
        errs.yearly = t("Yearly budget should be at least 12× monthly budget");
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      const buildDetail = (p: BudgetPeriod): BudgetDetail => {
        const amtStr = form[p].amount;
        const cats = form[p].ignoredCategories;
        const mode: FilterMode = cats.length > 0 ? "exclude" : "all";
        return {
          amount: amtStr ? parseFloat(amtStr) : null,
          filterMode: mode,
          categories: cats,
        };
      };

      const next: Budgets = {
        weekly: buildDetail("weekly"),
        monthly: buildDetail("monthly"),
        yearly: buildDetail("yearly"),
      };

      await onSave(next);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save budgets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Renderer for category multi-select
  const renderCategorySheet = () => (
    <Sheet
      modal
      open={isCategorySheetOpen}
      onOpenChange={setCategorySheetOpen}
      snapPoints={[60]}
      dismissOnOverlayPress
      dismissOnSnapToBottom={false}
    >
      <Sheet.Overlay />
      <Sheet.Handle />
      <Sheet.Frame padding="$4" paddingHorizontal="$3" paddingBottom="$6">
        <YStack flex={1}>
          <Sheet.ScrollView showsVerticalScrollIndicator={false} flex={1}>
            <YStack gap="$2" paddingBottom="$6">
              {EXPENSE_CATEGORIES.map((cat) => {
                const CategoryIcon = getCategoryIcon(cat.id);
                const selected = form[selectedPeriod].ignoredCategories.includes(cat.id);
                return (
                  <Button
                    key={cat.id}
                    backgroundColor={selected ? cat.lightColor : "white"}
                    paddingHorizontal="$2"
                    justifyContent="flex-start"
                    onPress={() => toggleCategory(cat.id)}
                  >
                    <XStack alignItems="center" gap="$2">
                      <Avatar circular size="$2" backgroundColor={`${cat.color}20`}>
                        <CategoryIcon size={16} color={cat.color} />
                      </Avatar>
                      <Text fontSize="$3" color="$gray11" flex={1}>
                        {t(cat.name)}
                      </Text>
                      {selected && <Check size={16} color={cat.color} />}
                    </XStack>
                  </Button>
                );
              })}
            </YStack>
          </Sheet.ScrollView>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );

  // Helper to render one period input row
  const PeriodRow = (
    period: BudgetPeriod,
    value: string,
    setValue: (v: string) => void
  ) => (
    <YStack gap="$1">
      <Label htmlFor={`${period}-amount`} fontSize="$3" color="$gray11">
        {t("Amount")}
      </Label>
      <Input
        id={`${period}-amount`}
        size="$3"
        placeholder={`${currency}0`}
        keyboardType="numeric"
        value={value}
        onChangeText={setValue}
        borderWidth={1}
        borderColor={errors[period] ? "$red9" : "$gray5"}
        backgroundColor={"$gray1"}
      />
      {errors[period] && (
        <Text fontSize="$2" color="$red9">
          {errors[period]}
        </Text>
      )}
    </YStack>
  );

  // Functions to update current period amount or categories
  const updateAmount = (val: string) => {
    setForm((prev) => ({
      ...prev,
      [selectedPeriod]: { ...prev[selectedPeriod], amount: val },
    }));
  };

  function toggleCategory(catId: string) {
    setForm((prev) => {
      const curCats = prev[selectedPeriod].ignoredCategories;
      const nextCats = curCats.includes(catId)
        ? curCats.filter((c) => c !== catId)
        : [...curCats, catId];
      return {
        ...prev,
        [selectedPeriod]: {
          ...prev[selectedPeriod],
          ignoredCategories: nextCats,
        },
      };
    });
  }

  return (
    <Sheet
      open={isOpen}
      onOpenChange={onOpenChange}
      snapPoints={[50]}
      disableDrag
      dismissOnSnapToBottom={false}
      dismissOnOverlayPress={false}
    >
      <Sheet.Overlay />
      <Sheet.Frame padding="$4" paddingBottom="$6">
        <Sheet.ScrollView showsVerticalScrollIndicator={false}>
          <YStack gap="$3" marginTop="$2">
            {/* Header */}
            <XStack justifyContent="space-between" alignItems="center" marginBottom="$2">
              <Text flex={1} fontSize={18} fontWeight="700">
                {t("Set Budgets")}
              </Text>
              <XStack gap="$2">
                <Button size="$2" backgroundColor="$gray3" onPress={() => onOpenChange(false)}>
                  {t("Cancel")}
                </Button>
                <Button
                  size="$2"
                  backgroundColor="$blue9"
                  color="white"
                  onPress={handleSave}
                  disabled={isLoading}
                  pressStyle={{ opacity: 0.8 }}
                  iconAfter={isLoading ? () => <Spinner color="white" /> : undefined}
                >
                  {t("Save")}
                </Button>
              </XStack>
            </XStack>

            {/* Tab Selector */}
            <XStack gap="$2" >
              {(["weekly", "monthly", "yearly"] as BudgetPeriod[]).map((p) => (
                <Button
                  key={p}
                  size="$2"
                  backgroundColor={selectedPeriod === p ? "$blue9" : "$gray2"}
                  color={selectedPeriod === p ? "white" : "$gray11"}
                  onPress={() => setSelectedPeriod(p)}
                >
                  {t(p.charAt(0).toUpperCase() + p.slice(1))}
                </Button>
              ))}
            </XStack>

            {/* Amount input for selected period */}
            {PeriodRow(selectedPeriod, form[selectedPeriod].amount, updateAmount)}

            {/* Ignore Categories Button (per period) */}
            <YStack >
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
                  {form[selectedPeriod].ignoredCategories.length === 0
                    ? t("None")
                    : `${form[selectedPeriod].ignoredCategories.length} ${t("Selected")}`}
                </Paragraph>
              </Button>
            </YStack>
          </YStack>
        </Sheet.ScrollView>
      </Sheet.Frame>

      {/* Category multi-select sheet */}
      {renderCategorySheet()}
    </Sheet>
  );
};

export default BudgetUpdateModal;

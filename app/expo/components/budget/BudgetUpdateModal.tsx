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
} from "tamagui";
import { ChevronDown } from "lucide-react-native";
import { Budgets, BudgetPeriod, BudgetDetail, _BudgetPeriodMap } from "@/utils/budget.utils";
import { formatCurrency } from "@/utils/format";
import CategorySelectSheet from "../ui/CategorySelectSheet";
import { DatePeriodEnum } from "@/types/reports.types";
import { KeyboardAvoidingView, Platform } from "react-native";

// Category filter mode
type FilterMode = "all" | "include" | "exclude";
interface BudgetUpdateModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** 当前预算（3 个周期） */
  budgets: Budgets;
  /** 保存回调：返回新的预算对象 */
  onSave: (next: Budgets) => Promise<void>;
  defaultPeriod?: DatePeriodEnum;
}

const BudgetUpdateModal: React.FC<BudgetUpdateModalProps> = ({
  isOpen,
  onOpenChange,
  budgets,
  onSave,
  defaultPeriod = DatePeriodEnum.WEEK,
}) => {
  const { t } = useTranslation();

  // Define per-period form state
  type PeriodForm = {
    amount: string;
    ignoredCategories: string[];
  };

  const [selectedPeriod, setSelectedPeriod] = useState<BudgetPeriod>(_BudgetPeriodMap[defaultPeriod]);

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
    setSelectedPeriod(_BudgetPeriodMap[defaultPeriod]);
    setErrors({});
  }, [isOpen]);

  /**
   * Compute validation errors.
   *
   * @param currentForm Current form state to validate
   * @param includeCrossPeriod Whether to include cross-period rules. When saving we
   *                           skip these rules so they don't block submission.
   */
  const computeErrors = (
    currentForm: Record<BudgetPeriod, PeriodForm>,
    includeCrossPeriod = true
  ): { [k in BudgetPeriod]?: string } => {
    const errs: { [k in BudgetPeriod]?: string } = {};

    const parseAmt = (val: string) => {
      const num = parseFloat(val);
      return { num, isInvalid: val !== "" && (isNaN(num) || num <= 0) };
    };

    const weekly = parseAmt(currentForm.weekly.amount);
    const monthly = parseAmt(currentForm.monthly.amount);
    const yearly = parseAmt(currentForm.yearly.amount);

    // Per-period validation (blocking)
    if (weekly.isInvalid) {
      errs.weekly = t("Invalid amount");
    }
    if (monthly.isInvalid) {
      errs.monthly = t("Invalid amount");
    }
    if (yearly.isInvalid) {
      errs.yearly = t("Invalid amount");
    }

    // Cross-period validation (warning – don't block save)
    if (includeCrossPeriod) {
      if (!errs.weekly && !errs.monthly && currentForm.weekly.amount && currentForm.monthly.amount) {
        if (monthly.num < weekly.num * 4) {
          errs.monthly = t("Monthly budget should be at least 4× weekly budget");
        }
      }
      if (!errs.monthly && !errs.yearly && currentForm.monthly.amount && currentForm.yearly.amount) {
        if (yearly.num < monthly.num * 12) {
          errs.yearly = t("Yearly budget should be at least 12× monthly budget");
        }
      }
    }

    return errs;
  };

  // Real-time validation – update `errors` whenever form changes while modal is open.
  useEffect(() => {
    if (!isOpen) return;
    setErrors(computeErrors(form, true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, isOpen]);

  const handleSave = async () => {
    const blockingErrors = computeErrors(form, false);
    if (Object.keys(blockingErrors).length > 0) {
      // Update UI with full error set for user feedback
      setErrors(computeErrors(form, true));
      return;
    }
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
        <CategorySelectSheet
          isOpen={isCategorySheetOpen}
          setIsOpen={setCategorySheetOpen}
          multiSelect
          selectedCategories={form[selectedPeriod].ignoredCategories}
          onCategoriesChange={(categories) => {
            setForm((prev) => ({
              ...prev,
              [selectedPeriod]: { ...prev[selectedPeriod], ignoredCategories: categories },
            }));
          }}
          onlyContent
        />
      </Sheet.Frame>
    </Sheet>
  );

  // Functions to update current period amount or categories
  const updateAmount = (val: string) => {
    setForm((prev) => ({
      ...prev,
      [selectedPeriod]: { ...prev[selectedPeriod], amount: val },
    }));
  };

  return (
    <Sheet
      open={isOpen}
      onOpenChange={onOpenChange}
      snapPoints={[40]}
      disableDrag
      dismissOnSnapToBottom={false}
      dismissOnOverlayPress={false}
      moveOnKeyboardChange
    >
      <Sheet.Overlay />
      <Sheet.Frame padding="$4" paddingBottom="$0">
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
            <YStack gap="$1">
              <Label htmlFor={`${selectedPeriod}-amount`} fontSize="$3" color="$gray11">
                {t("Amount")}
              </Label>
              <Input
                id={`${selectedPeriod}-amount`}
                size="$3"
                placeholder={formatCurrency(0).replace(/0+([.,]0+)?/, "0")}
                keyboardType="numeric"
                value={form[selectedPeriod].amount}
                onChangeText={updateAmount}
                borderWidth={1}
                borderColor={errors[selectedPeriod] ? "$red9" : "$gray5"}
                backgroundColor={"$gray1"}
              />
              {errors[selectedPeriod] && (
                <Text fontSize="$2" color="$red9">
                  {errors[selectedPeriod]}
                </Text>
              )}
            </YStack>

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

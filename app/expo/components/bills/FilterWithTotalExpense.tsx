import React, { useState } from "react";
import { Calendar, Filter } from "lucide-react-native";
import { Button, XStack, YStack, Text } from "tamagui";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/utils/format";

import { useTranslatedCategoryName } from "@/constants/categories";
import CategorySelectSheet from "@/components/ui/CategorySelectSheet";
import { DateRangeSheet } from "@/components/ui/DateRangeSheet";

export type CategoryFilterType = string[]; // empty array means "all"

interface FilterWithTotalExpenseProps {
  onCategoryFilterChange: (filters: CategoryFilterType) => void;
  onDateRangeChange: (startDate: Date | null, endDate: Date | null) => void;
  categoryFilter: CategoryFilterType;
  totalExpense: number;
  startDate: Date | null;
  endDate: Date | null;
  aiFilterActive?: boolean;
  children?: React.ReactNode;
}

export const FilterWithTotalExpense: React.FC<FilterWithTotalExpenseProps> = ({
  onCategoryFilterChange,
  onDateRangeChange,
  categoryFilter,
  totalExpense,
  startDate,
  endDate,
  aiFilterActive,
  children,
}) => {
  const { t } = useTranslation();
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
  const [isDateSheetOpen, setIsDateSheetOpen] = useState(false);

  const SelectedCategoryName = () => {
    if (categoryFilter.length === 0)
      return (
        <Text fontSize={12} color="$gray11" pointerEvents="none">
          {t("All Categories")}
        </Text>
      );
    if (categoryFilter.length === 1) {
      const name = useTranslatedCategoryName(categoryFilter[0]);
      return (
        <Text fontSize={12} color="$gray11" pointerEvents="none">
          {name}
        </Text>
      );
    }
    return (
      <Text fontSize={12} color="$gray11" pointerEvents="none">
        {t("{{count}} Categories", { count: categoryFilter.length })}
      </Text>
    );
  };

  const getDateRangeLabel = () => {
    if (!startDate && !endDate) {
      return t("All Time");
    }

    // if a single day is selected
    if (
      startDate &&
      endDate &&
      startDate.toDateString() === endDate.toDateString()
    ) {
      return startDate.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }

    if (startDate && endDate) {
      const startStr = startDate.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year:
          startDate.getFullYear() === endDate.getFullYear()
            ? undefined
            : "numeric",
      });

      const endStr = endDate.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      return `${startStr} - ${endStr}`;
    }

    // Should not happen with new component logic, but good for safety
    if (startDate) {
      return `${t("From")} ${startDate.toLocaleDateString()}`;
    }

    if (endDate) {
      return `${t("Until")} ${endDate.toLocaleDateString()}`;
    }

    return t("All Time");
  };

  const handleApplyDateRange = (start: Date | null, end: Date | null) => {
    onDateRangeChange(start, end);
    setIsDateSheetOpen(false);
  };

  return (
    <>
      <XStack
        alignItems="center"
        justifyContent="space-between"
        flex={1}
      >
        <XStack alignItems="flex-start">
          <Text fontSize={12} color="$gray9">
            {t("Total")}: {formatCurrency(totalExpense)}
          </Text>
        </XStack>
        {
          aiFilterActive ? children : (
            <XStack gap="$2" alignItems="center">
              <Button
                size="$2"
                onPress={() => setIsDateSheetOpen(true)}

              >
                <XStack gap="$1.5" alignItems="center">
                  <Calendar size={12} color="#777777" />
                  <Text fontSize={12} color="$gray11" pointerEvents="none">
                    {getDateRangeLabel()}
                  </Text>
                </XStack>
              </Button>

              <Button
                size="$2"
                onPress={() => setIsCategorySheetOpen(true)}
              >
                <XStack gap="$1.5" alignItems="center">
                  <Filter size={12} color="#777777" />
                  <SelectedCategoryName />
                </XStack>
              </Button>
            </XStack>
          )
        }
      </XStack>

      <CategorySelectSheet
        isOpen={isCategorySheetOpen}
        setIsOpen={setIsCategorySheetOpen}
        multiSelect
        selectedCategories={categoryFilter}
        onCategoriesChange={onCategoryFilterChange}
      />

      <DateRangeSheet
        isOpen={isDateSheetOpen}
        setIsOpen={setIsDateSheetOpen}
        onApply={handleApplyDateRange}
        initialStartDate={startDate}
        initialEndDate={endDate}
      />
    </>
  );
};

export default FilterWithTotalExpense;

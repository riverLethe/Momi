import React, { useState } from "react";
import { Calendar, Filter } from "lucide-react-native";
import { Button, XStack, YStack, Text } from "tamagui";
import { useTranslation } from "react-i18next";

import { useTranslatedCategoryName } from "@/constants/categories";
import CategorySelectSheet from "@/components/ui/CategorySelectSheet";
import { DateRangeSheet } from "@/components/ui/DateRangeSheet";

export type CategoryFilterType = "all" | string;

interface FilterWithTotalExpenseProps {
  onCategoryFilterChange: (filter: CategoryFilterType) => void;
  onDateRangeChange: (startDate: Date | null, endDate: Date | null) => void;
  categoryFilter: CategoryFilterType;
  totalExpense: number;
  startDate: Date | null;
  endDate: Date | null;
}

export const FilterWithTotalExpense: React.FC<FilterWithTotalExpenseProps> = ({
  onCategoryFilterChange,
  onDateRangeChange,
  categoryFilter,
  totalExpense,
  startDate,
  endDate,
}) => {
  const { t } = useTranslation();
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
  const [isDateSheetOpen, setIsDateSheetOpen] = useState(false);

  const SelectedCategoryName = () => {
    if (categoryFilter === "all")
      return (
        <Text fontSize="$2.5" color="$gray11">
          {t("All Categories")}
        </Text>
      );
    const name = useTranslatedCategoryName(categoryFilter);
    return (
      <Text fontSize="$2.5" color="$gray11">
        {name}
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
        paddingHorizontal="$4"
        paddingVertical="$2"
        alignItems="center"
        justifyContent="space-between"
      >
        <XStack alignItems="flex-start">
          <Text fontSize="$2.5" color="$gray9">
            {t("Total: ¥{{totalExpense}}", {
              totalExpense: totalExpense.toFixed(2),
            })}
          </Text>
        </XStack>
        <XStack space="$2" alignItems="center">
          <Button
            size="$2"
            icon={<Calendar size={12} color="#777777" />}
            onPress={() => setIsDateSheetOpen(true)}
            space="$1.5"
          >
            <Text fontSize="$2.5" color="$gray11">
              {getDateRangeLabel()}
            </Text>
          </Button>

          <Button
            size="$2"
            icon={<Filter size={12} color="#777777" />}
            onPress={() => setIsCategorySheetOpen(true)}
            space="$1.5"
          >
            <SelectedCategoryName />
          </Button>
        </XStack>
      </XStack>

      <CategorySelectSheet
        isOpen={isCategorySheetOpen}
        setIsOpen={setIsCategorySheetOpen}
        selectedCategory={categoryFilter}
        onCategoryChange={onCategoryFilterChange}
        showAllOption={true}
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

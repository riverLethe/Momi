import React, { useState } from "react";
import { 
  Calendar, 
  Filter, 
  X,
  Check,
} from "lucide-react-native";
import {
  Button,
  XStack,
  YStack,
  Sheet,
  ScrollView,
  ListItem,
  Separator,
  Text,
  Paragraph,
} from "tamagui";
import { useTranslation } from "react-i18next";

import { EXPENSE_CATEGORIES, getCategoryIcon, useTranslatedCategoryName } from "@/constants/categories";

export type DateFilterType = "all" | "today" | "this_week" | "this_month" | "this_year";
export type CategoryFilterType = "all" | string;

interface BillsFilterProps {
  onDateFilterChange: (filter: DateFilterType) => void;
  onCategoryFilterChange: (filter: CategoryFilterType) => void;
  dateFilter: DateFilterType;
  categoryFilter: CategoryFilterType;
}

const DATE_FILTER_OPTIONS: { value: DateFilterType; labelKey: string }[] = [
  { value: "all", labelKey: "All" },
  { value: "today", labelKey: "Today" },
  { value: "this_week", labelKey: "This Week" },
  { value: "this_month", labelKey: "This Month" },
  { value: "this_year", labelKey: "This Year" },
];

export const BillsFilter: React.FC<BillsFilterProps> = ({
  onDateFilterChange,
  onCategoryFilterChange,
  dateFilter,
  categoryFilter,
}) => {
  const { t } = useTranslation();
  const [isDateSheetOpen, setIsDateSheetOpen] = useState(false);
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);

  const selectedDateLabel = DATE_FILTER_OPTIONS.find(opt => opt.value === dateFilter)?.labelKey || "All";
  const SelectedCategoryName = () => {
    if (categoryFilter === 'all') return <Text>{t('All Categories')}</Text>;
    const name = useTranslatedCategoryName(categoryFilter);
    return <Text>{name}</Text>;
  };

  return (
    <>
      <XStack 
        paddingHorizontal="$3" 
        paddingVertical="$2" 
        space="$2.5"
      >
        <FilterButton 
          icon={Calendar} 
          label={t(selectedDateLabel)} 
          onPress={() => setIsDateSheetOpen(true)} 
        />
        <FilterButton 
          icon={Filter} 
          label={<SelectedCategoryName />}
          onPress={() => setIsCategorySheetOpen(true)} 
        />
      </XStack>
      
      <OptionSheet 
        isOpen={isDateSheetOpen} 
        setIsOpen={setIsDateSheetOpen}
        title={t("Select Date Range")}
      >
        {DATE_FILTER_OPTIONS.map((option) => (
          <ListItem
            key={option.value}
            title={t(option.labelKey)}
            iconAfter={dateFilter === option.value ? <Check size={16} /> : undefined}
            onPress={() => {
              onDateFilterChange(option.value);
              setIsDateSheetOpen(false);
            }}
            pressTheme
          />
        ))}
      </OptionSheet>

      <OptionSheet 
        isOpen={isCategorySheetOpen} 
        setIsOpen={setIsCategorySheetOpen}
        title={t("Select Category")}
      >
        <ScrollView>
            <ListItem
              title={t("All Categories")}
              iconAfter={categoryFilter === "all" ? <Check size={16} /> : undefined}
              onPress={() => {
                onCategoryFilterChange("all");
                setIsCategorySheetOpen(false);
              }}
              pressTheme
            />
            <Separator />
            {EXPENSE_CATEGORIES.map((cat) => {
              const CategoryIcon = getCategoryIcon(cat.id);
              return (
                <ListItem
                  key={cat.id}
                  title={t(cat.name)}
                  icon={<CategoryIcon size={18} color={cat.color} />}
                  iconAfter={categoryFilter === cat.id ? <Check size={16} /> : undefined}
                  onPress={() => {
                    onCategoryFilterChange(cat.id);
                    setIsCategorySheetOpen(false);
                  }}
                  pressTheme
                />
              );
            })}
        </ScrollView>
      </OptionSheet>
    </>
  );
};

const FilterButton = ({ icon: Icon, label, onPress }: { icon: React.FC<any>, label: React.ReactNode, onPress: () => void }) => (
  <Button
    flex={1}
    icon={Icon}
    onPress={onPress}
    backgroundColor="white"
    borderColor="$gray6"
    borderWidth={1}
    pressStyle={{
      backgroundColor: "$gray2",
    }}
  >
    {label}
  </Button>
);

const OptionSheet = ({ isOpen, setIsOpen, title, children }: { isOpen: boolean, setIsOpen: (isOpen: boolean) => void, title: string, children: React.ReactNode }) => (
  <Sheet
    modal
    open={isOpen}
    onOpenChange={setIsOpen}
    snapPoints={[50]}
    dismissOnSnapToBottom
  >
    <Sheet.Overlay />
    <Sheet.Handle />
    <Sheet.Frame padding="$4">
      <YStack>
        <XStack justifyContent="space-between" alignItems="center" marginBottom="$3">
          <Paragraph fontSize={18} fontWeight="700">{title}</Paragraph>
          <Button size="$3" circular onPress={() => setIsOpen(false)} icon={X} />
        </XStack>
        {children}
      </YStack>
    </Sheet.Frame>
  </Sheet>
);

export default BillsFilter; 
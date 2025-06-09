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
  Dialog,
  Paragraph,
} from "tamagui";
import { useTranslation } from "react-i18next";
import { Platform, TouchableOpacity } from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';

import { EXPENSE_CATEGORIES, getCategoryIcon, useTranslatedCategoryName } from "@/constants/categories";
import CategorySelectSheet from "@/components/ui/CategorySelectSheet";

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
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  
  // Date picker states
  const [tempStartDate, setTempStartDate] = useState<Date | null>(startDate);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(endDate);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const SelectedCategoryName = () => {
    if (categoryFilter === 'all') return <Text fontSize="$2.5" color="$gray11">{t('All Categories')}</Text>;
    const name = useTranslatedCategoryName(categoryFilter);
    return <Text fontSize="$2.5" color="$gray11">{name}</Text>;
  };

  const getDateRangeLabel = () => {
    if (!startDate && !endDate) {
      return t("All Time");
    }
    
    if (startDate && endDate) {
      // Check if same day
      if (startDate.toDateString() === endDate.toDateString()) {
        return startDate.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric"
        });
      }
      
      // Date range
      const startStr = startDate.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric"
      });
      
      const endStr = endDate.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
      
      return `${startStr} - ${endStr}`;
    }
    
    if (startDate) {
      return `${t("From")} ${startDate.toLocaleDateString()}`;
    }
    
    return `${t("Until")} ${endDate!.toLocaleDateString()}`;
  };
  
  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setTempStartDate(selectedDate);
    }
  };
  
  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setTempEndDate(selectedDate);
    }
  };
  
  const applyDateRange = () => {
    onDateRangeChange(tempStartDate, tempEndDate);
    setIsDatePickerOpen(false);
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
          <Text fontSize="$2.5" color="$gray9">{t("Total: ¥{{totalExpense}}", {totalExpense: totalExpense.toFixed(2)})}</Text>
        </XStack>
        <XStack space="$2" alignItems="center">
          <Button
            size="$2"
            icon={<Calendar size={12} color="#777777"/>}
            onPress={() => {
              setTempStartDate(startDate);
              setTempEndDate(endDate);
              setIsDatePickerOpen(true);
            }}
            space="$1.5"
          >
            <Text fontSize="$2.5" color="$gray11">{getDateRangeLabel()}</Text>
          </Button>
          
          <Button
            size="$2"
            icon={<Filter size={12} color="#777777"/>}
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
      
      <Dialog
        modal
        open={isDatePickerOpen}
        onOpenChange={setIsDatePickerOpen}
      >
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content>
            <Dialog.Title>{t("Select Date Range")}</Dialog.Title>
            
            <YStack space="$4" padding="$4">
              <XStack space="$4" justifyContent="space-between">
                <YStack flex={1}>
                  <Text fontSize="$3" color="$gray11" marginBottom="$1">{t("Start Date")}</Text>
                  <TouchableOpacity
                    onPress={() => setShowStartPicker(true)}
                    style={{
                      borderWidth: 1,
                      borderColor: '#ddd',
                      borderRadius: 8,
                      padding: 12,
                    }}
                  >
                    <Text>
                      {tempStartDate ? tempStartDate.toLocaleDateString() : t("Select Date")}
                    </Text>
                  </TouchableOpacity>
                  {showStartPicker && (
                    <DateTimePicker
                      value={tempStartDate || new Date()}
                      mode="date"
                      display="default"
                      onChange={handleStartDateChange}
                    />
                  )}
                </YStack>
                
                <YStack flex={1}>
                  <Text fontSize="$3" color="$gray11" marginBottom="$1">{t("End Date")}</Text>
                  <TouchableOpacity
                    onPress={() => setShowEndPicker(true)}
                    style={{
                      borderWidth: 1,
                      borderColor: '#ddd',
                      borderRadius: 8,
                      padding: 12,
                    }}
                  >
                    <Text>
                      {tempEndDate ? tempEndDate.toLocaleDateString() : t("Select Date")}
                    </Text>
                  </TouchableOpacity>
                  {showEndPicker && (
                    <DateTimePicker
                      value={tempEndDate || new Date()}
                      mode="date"
                      minimumDate={tempStartDate || undefined}
                      display="default"
                      onChange={handleEndDateChange}
                    />
                  )}
                </YStack>
              </XStack>
              
              <XStack space="$2" justifyContent="space-between">
                <Button
                  theme="gray"
                  onPress={() => {
                    // Set to this month
                    const today = new Date();
                    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                    setTempStartDate(firstDayOfMonth);
                    setTempEndDate(today);
                  }}
                  flex={1}
                >
                  {t("This Month")}
                </Button>
                
                <Button
                  theme="gray"
                  onPress={() => {
                    // Set to this year
                    const today = new Date();
                    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
                    setTempStartDate(firstDayOfYear);
                    setTempEndDate(today);
                  }}
                  flex={1}
                >
                  {t("This Year")}
                </Button>
              </XStack>
              
              <Button 
                onPress={() => {
                  setTempStartDate(null);
                  setTempEndDate(null);
                }}
                theme="outline"
              >
                {t("Clear Dates")}
              </Button>
            </YStack>
            
            <Dialog.Close asChild>
              <Button theme="primary" marginTop="$2" onPress={applyDateRange}>
                {t("Apply")}
              </Button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </>
  );
};

export default FilterWithTotalExpense; 
import React, { useState } from "react";
import { 
  Calendar, 
  Filter, 
  ChevronDown, 
  X,
} from "lucide-react-native";
import {
  View,
  Text,
  Button,
  XStack,
  YStack,
  Sheet,
  ScrollView,
  Separator,
  Avatar,
  Select,
} from "tamagui";

import { EXPENSE_CATEGORIES, getCategoryIcon } from "@/constants/categories";

export type DateFilterType = "all" | "today" | "this_week" | "this_month" | "this_year" | "custom";
export type CategoryFilterType = "all" | string; // 使用类别ID

interface BillsFilterProps {
  onDateFilterChange: (filter: DateFilterType) => void;
  onCategoryFilterChange: (filter: CategoryFilterType) => void;
  dateFilter: DateFilterType;
  categoryFilter: CategoryFilterType;
}

// 日期筛选选项
const DATE_FILTER_OPTIONS = [
  { value: "all", label: "全部" },
  { value: "today", label: "今天" },
  { value: "this_week", label: "本周" },
  { value: "this_month", label: "本月" },
  { value: "this_year", label: "今年" },
  // 后续可以加入自定义日期范围
];

export const BillsFilter: React.FC<BillsFilterProps> = ({
  onDateFilterChange,
  onCategoryFilterChange,
  dateFilter,
  categoryFilter,
}) => {
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
  
  // 获取当前日期筛选的标签
  const getCurrentDateLabel = () => {
    const option = DATE_FILTER_OPTIONS.find(opt => opt.value === dateFilter);
    return option ? option.label : "全部";
  };
  
  // 获取当前类别筛选的标签
  const getCurrentCategoryLabel = () => {
    if (categoryFilter === "all") return "全部类别";
    const category = EXPENSE_CATEGORIES.find(cat => cat.id === categoryFilter);
    return category ? category.name : "全部类别";
  };
  
  return (
    <YStack width="100%">
      <XStack 
        paddingHorizontal="$2.5" 
        paddingVertical="$2" 
        justifyContent="space-between"
        backgroundColor="$background"
      >
        {/* 日期筛选下拉 */}
        <Select
          value={dateFilter}
          onValueChange={(value) => onDateFilterChange(value as DateFilterType)}
          disablePreventBodyScroll
        >
          <Select.Trigger width="42%" backgroundColor="$gray1" borderColor="$gray4" borderWidth={1}>
            <XStack alignItems="center" justifyContent="space-between" paddingLeft="$1.5" flex={1}>
              <XStack alignItems="center" space="$1.5">
                <Calendar size={16} color="#64748B" />
                <Select.Value fontSize="$3" fontWeight="$5">{getCurrentDateLabel()}</Select.Value>
              </XStack>
              <ChevronDown size={16} color="#64748B" />
            </XStack>
          </Select.Trigger>
          
          <Select.Content>
            <Select.ScrollUpButton />
            <Select.Viewport>
              <Select.Group>
                {DATE_FILTER_OPTIONS.map((option, index) => (
                  <Select.Item key={option.value} value={option.value} index={index}>
                    <Select.ItemText>{option.label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Group>
            </Select.Viewport>
            <Select.ScrollDownButton />
          </Select.Content>
        </Select>
        
        {/* 类别筛选按钮 */}
        <Button
          width="42%"
          backgroundColor="$gray1"
          borderColor="$gray4"
          borderWidth={1}
          onPress={() => setIsCategorySheetOpen(true)}
          pressStyle={{ opacity: 0.8 }}
        >
          <XStack alignItems="center" justifyContent="space-between" flex={1}>
            <XStack alignItems="center" space="$1.5">
              <Filter size={16} color="#64748B" />
              <Text fontSize="$3" fontWeight="$5" color="$gray12">
                {getCurrentCategoryLabel()}
              </Text>
            </XStack>
            <ChevronDown size={16} color="#64748B" />
          </XStack>
        </Button>
      </XStack>
      
      {/* 类别筛选弹出层 */}
      <Sheet
        modal
        open={isCategorySheetOpen}
        onOpenChange={setIsCategorySheetOpen}
        snapPoints={[50]}
        position={0}
        dismissOnSnapToBottom
      >
        <Sheet.Overlay />
        <Sheet.Handle />
        <Sheet.Frame padding="$4">
          <XStack justifyContent="space-between" alignItems="center" marginBottom="$3">
            <Text fontSize="$4" fontWeight="$6">选择类别</Text>
            <Button
              size="$2"
              circular
              onPress={() => setIsCategorySheetOpen(false)}
            >
              <X size={18} />
            </Button>
          </XStack>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            <YStack space="$3" paddingBottom="$8">
              {/* 全部类别选项 */}
              <Button
                backgroundColor={categoryFilter === "all" ? "$gray2" : "transparent"}
                borderColor={categoryFilter === "all" ? "$gray8" : "$gray4"}
                borderWidth={1}
                paddingVertical="$3"
                pressStyle={{ scale: 0.98, opacity: 0.9 }}
                onPress={() => {
                  onCategoryFilterChange("all");
                  setIsCategorySheetOpen(false);
                }}
              >
                <XStack alignItems="center" space="$3">
                  <Avatar circular size="$3.5" backgroundColor="$gray3">
                    <Filter size={18} color="#64748B" />
                  </Avatar>
                  <Text fontSize="$3.5" fontWeight="$6">全部类别</Text>
                </XStack>
              </Button>
              
              <Separator />
              
              {/* 各个类别选项 */}
              {EXPENSE_CATEGORIES.map((cat) => {
                const CategoryIcon = getCategoryIcon(cat.id);
                return (
                  <Button
                    key={cat.id}
                    backgroundColor={categoryFilter === cat.id ? cat.lightColor : "transparent"}
                    borderColor={categoryFilter === cat.id ? cat.color : "$gray4"}
                    borderWidth={1}
                    paddingVertical="$3"
                    pressStyle={{ scale: 0.98, opacity: 0.9 }}
                    onPress={() => {
                      onCategoryFilterChange(cat.id);
                      setIsCategorySheetOpen(false);
                    }}
                  >
                    <XStack alignItems="center" space="$3">
                      <Avatar circular size="$3.5" backgroundColor={`${cat.color}20`}>
                        <CategoryIcon size={18} color={cat.color} />
                      </Avatar>
                      <Text fontSize="$3.5" fontWeight="$6">{cat.name}</Text>
                    </XStack>
                  </Button>
                );
              })}
            </YStack>
          </ScrollView>
        </Sheet.Frame>
      </Sheet>
    </YStack>
  );
};

export default BillsFilter; 
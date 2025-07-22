import React from "react";
import { Calendar, ChevronDown, CreditCard, ReceiptTextIcon, Users, User } from "lucide-react-native";
import { Button, XStack, Text, ScrollView, Sheet, YStack, View, useTheme, Switch } from "tamagui";
import { useTranslation } from "react-i18next";
import { DatePeriodEnum, PeriodSelectorData } from "@/types/reports.types";
import { useViewStore } from "@/stores/viewStore";
import { useData } from "@/providers/DataProvider";

interface DateFilterProps {
  selectedPeriod: DatePeriodEnum;
  onPeriodChange: (period: DatePeriodEnum) => void;
  periodSelectors?: PeriodSelectorData[];
  selectedPeriodId?: string;
  onPeriodSelectorChange?: (periodId: string) => void;
  onBillsPress?: () => void;
  hasFamily?: boolean; // 是否有家庭
  onViewModeChange?: (isFamily: boolean) => void; // 视图模式变化回调
}

export const DateFilter: React.FC<DateFilterProps> = ({
  selectedPeriod,
  onPeriodChange,
  periodSelectors,
  selectedPeriodId,
  onPeriodSelectorChange,
  onBillsPress,
  hasFamily = false,
  onViewModeChange,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [periodSheetOpen, setPeriodSheetOpen] = React.useState(false);
  const { viewMode, setViewMode } = useViewStore();
  const {
    refreshFamilyBills,
    isFamilyBillsLoading,
  } = useData();

  // Get current selected period selector
  const selectedSelector =
    periodSelectors?.find((p) => p.id === selectedPeriodId) ||
    periodSelectors?.[0];

  // 处理视图模式切换
  const handleViewModeToggle = async (isFamily: boolean) => {
    const newMode = isFamily ? "family" : "personal";
    
    // 更新视图模式
    setViewMode(newMode);
    
    // 如果切换到家庭模式，获取家庭账单数据
    if (isFamily && hasFamily) {
      try {
        await refreshFamilyBills();
      } catch (error) {
        console.error("Failed to load family bills:", error);
      }
    }
    
    // 通知父组件视图模式变化
    onViewModeChange?.(isFamily);
  };

  return (
    <>
      <XStack width="100%" justifyContent="space-between" alignItems="center">
        {/* Period Type Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <XStack gap="$2" padding="$1.5">
            {Object.values(DatePeriodEnum).map((period) => (
              <Button
                key={period}
                backgroundColor={
                  selectedPeriod === period ? "$blue9" : "$card"
                }
                paddingHorizontal="$2"
                paddingVertical="$2"
                hoverStyle={{ opacity: 0.9 }}
                pressStyle={{ opacity: 0.8 }}
                onPress={() => onPeriodChange(period)}
                size="$2"
              >
                <XStack alignItems="center" gap="$1.5">
                  <Calendar
                    size={14}
                    color={selectedPeriod === period ? "white" : theme.color8?.get()}
                  />
                  <Text
                    color={selectedPeriod === period ? "white" : "$color10"}
                    fontWeight="$6"
                    fontSize="$3"
                  >
                    {t(period)}
                  </Text>
                </XStack>
              </Button>
            ))}
          </XStack>
        </ScrollView>

        {/* 右侧控制区域 */}
        <XStack alignItems="center" gap="$2">
          {/* 个人/家庭切换开关 */}
          {hasFamily && (
            <XStack alignItems="center" gap="$1.5" paddingHorizontal="$2">
              <Switch
                size="$2"
                checked={viewMode === "family"}
                onCheckedChange={handleViewModeToggle}
                backgroundColor={viewMode === "family" ? "$blue9" : "$gray5"}
                disabled={isFamilyBillsLoading}
                opacity={isFamilyBillsLoading ? 0.6 : 1}
              >
                <Switch.Thumb
                  backgroundColor="white"
                  scale={0.8}
                />
              </Switch>
              <Text fontSize="$3" opacity={isFamilyBillsLoading ? 0.6 : 1}>
                {t("Family")}
                {isFamilyBillsLoading && " (加载中...)"}
              </Text>
            </XStack>
          )}

          {/* 账单按钮 */}
          <Button
            onPress={onBillsPress}
            size="$2"
            marginRight="$1"
            paddingHorizontal="$1.5"
            paddingVertical="$2"
            backgroundColor="$blue9"
            chromeless
            pressStyle={{
              opacity: 0.8,
              backgroundColor: "$blue8",
              borderColor: "$blue8",
            }}
          >
            <ReceiptTextIcon size={18} color="white" />
          </Button>
        </XStack>

      </XStack>

      {/* Period Selector Sheet */}
      <Sheet
        modal
        open={periodSheetOpen}
        onOpenChange={setPeriodSheetOpen}
        snapPoints={[50]}
        dismissOnSnapToBottom
      >
        <Sheet.Overlay />
        <Sheet.Frame padding="$4">
          <Sheet.Handle />
          <YStack gap="$4">
            <Text fontSize="$4" fontWeight="$7" textAlign="center">
              {t("Select Period")}
            </Text>
            <View height={300}>
              <Sheet.ScrollView>
                <YStack gap="$2" paddingBottom="$4">
                  {periodSelectors?.map((period) => (
                    <Button
                      key={period.id}
                      backgroundColor={
                        period.id === selectedPeriodId ? "$blue2" : "white"
                      }
                      borderColor={
                        period.id === selectedPeriodId ? "$blue9" : "$gray4"
                      }
                      borderWidth={1}
                      paddingVertical="$3"
                      borderRadius="$4"
                      onPress={() => {
                        onPeriodSelectorChange?.(period.id);
                        setPeriodSheetOpen(false);
                      }}
                    >
                      <Text
                        fontWeight={
                          period.id === selectedPeriodId ? "$7" : "$5"
                        }
                        color={
                          period.id === selectedPeriodId ? "$blue9" : "$gray11"
                        }
                      >
                        {selectedPeriod === DatePeriodEnum.WEEK
                          ? `${t("Week of")} ${period.label}`
                          : period.label}
                      </Text>
                    </Button>
                  ))}
                </YStack>
              </Sheet.ScrollView>
            </View>
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </>
  );
};

export default DateFilter;

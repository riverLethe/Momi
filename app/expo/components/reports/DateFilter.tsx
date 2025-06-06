import React from "react";
import { Calendar, ChevronDown } from "lucide-react-native";
import { 
  Button, 
  XStack,
  Text,
  ScrollView,
  Sheet,
  YStack,
  View,
} from "tamagui";
import { useTranslation } from "react-i18next";
import { DatePeriodEnum, PeriodSelectorData } from "@/types/reports.types";

interface DateFilterProps {
  selectedPeriod: DatePeriodEnum;
  onPeriodChange: (period: DatePeriodEnum) => void;
  periodSelectors?: PeriodSelectorData[];
  selectedPeriodId?: string;
  onPeriodSelectorChange?: (periodId: string) => void;
}

export const DateFilter: React.FC<DateFilterProps> = ({
  selectedPeriod,
  onPeriodChange,
  periodSelectors,
  selectedPeriodId,
  onPeriodSelectorChange,
}) => {
  const { t } = useTranslation();
  const [periodSheetOpen, setPeriodSheetOpen] = React.useState(false);
  
  // Get current selected period selector
  const selectedSelector = periodSelectors?.find(p => p.id === selectedPeriodId) || periodSelectors?.[0];
  
  return (
    <>
      <YStack width="100%">
        {/* Period Type Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <XStack space="$2" padding="$1.5">
            {Object.values(DatePeriodEnum).map((period) => (
              <Button
                key={period}
                backgroundColor={selectedPeriod === period ? "$blue9" : "$gray1"}
                paddingHorizontal="$2"
                paddingVertical="$2"
                hoverStyle={{ opacity: 0.9 }}
                pressStyle={{ opacity: 0.8 }}
                onPress={() => onPeriodChange(period)}
                size="$2"
              >
                <XStack alignItems="center" space="$2">
                  <Calendar size={14} color={selectedPeriod === period ? "white" : "#6B7280"} />
                  <Text
                    color={selectedPeriod === period ? "white" : "$gray10"}
                    fontWeight="$6"
                    fontSize="$2.5"
                  >
                    {t(period)}
                  </Text>
                </XStack>
              </Button>
            ))}

          </XStack>

        </ScrollView>
        
        {/* Period Selector Button (if available) */}
        {periodSelectors && periodSelectors.length > 0 && (
          <Button
            alignSelf="center"
            backgroundColor="$blue4"
            size="$2"
            paddingHorizontal="$2"
            paddingVertical="$1"
            onPress={() => setPeriodSheetOpen(true)}
            position="absolute"
            right="$1"
            top="$1.5"
          >
            <XStack alignItems="center" space="$2">
              <Text fontWeight="$6" fontSize="$2.5" color="$gray11">
                {selectedPeriod === DatePeriodEnum.WEEK 
                  ? `${t("Week of")} ${selectedSelector?.label}` 
                  : selectedSelector?.label}
              </Text>
              <ChevronDown size={14} color="#64748B" />
            </XStack>
          </Button>
        )}
      </YStack>
      
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
          <YStack space="$4">
            <Text fontSize="$4" fontWeight="$7" textAlign="center">
              {t("Select Period")}
            </Text>
            <View height={300}>
              <ScrollView>
                <YStack space="$2" paddingBottom="$4">
                  {periodSelectors?.map((period) => (
                    <Button
                      key={period.id}
                      backgroundColor={period.id === selectedPeriodId ? "$blue2" : "white"}
                      borderColor={period.id === selectedPeriodId ? "$blue9" : "$gray4"}
                      borderWidth={1}
                      paddingVertical="$3"
                      borderRadius="$4"
                      onPress={() => {
                        onPeriodSelectorChange?.(period.id);
                        setPeriodSheetOpen(false);
                      }}
                    >
                      <Text 
                        fontWeight={period.id === selectedPeriodId ? "$7" : "$5"} 
                        color={period.id === selectedPeriodId ? "$blue9" : "$gray11"}
                      >
                        {selectedPeriod === DatePeriodEnum.WEEK 
                          ? `${t("Week of")} ${period.label}` 
                          : period.label}
                      </Text>
                    </Button>
                  ))}
                </YStack>
              </ScrollView>
            </View>
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </>
  );
};

export default DateFilter; 
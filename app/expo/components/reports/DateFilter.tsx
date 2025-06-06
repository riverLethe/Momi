import React from "react";
import { Calendar } from "lucide-react-native";
import { 
  Button, 
  XStack,
  Text,
  ScrollView,
} from "tamagui";

export type DatePeriod = "Week" | "Month" | "Quarter" | "Year";

interface DateFilterProps {
  selectedPeriod: DatePeriod;
  onPeriodChange: (period: DatePeriod) => void;
  periods?: DatePeriod[];
}

export const DateFilter: React.FC<DateFilterProps> = ({
  selectedPeriod,
  onPeriodChange,
  periods = ["Week", "Month", "Quarter", "Year"],
}) => {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <XStack space="$2" padding="$1.5">
        {periods.map((period) => (
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
                {period}
              </Text>
            </XStack>
          </Button>
        ))}
      </XStack>
    </ScrollView>
  );
};

export default DateFilter; 
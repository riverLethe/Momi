import React, { useRef } from "react";
import { Dimensions, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import { 
  Card, 
  XStack, 
  Text, 
  Button, 
  View 
} from "tamagui";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { LineChart } from "react-native-chart-kit";
import { TrendData } from "@/types/reports.types";

interface ExpenseTrendChartProps {
  data: TrendData[];
  averageSpending: number;
}

const ExpenseTrendChart: React.FC<ExpenseTrendChartProps> = ({
  data,
  averageSpending
}) => {
  const { t } = useTranslation();
  const scrollViewRef = useRef<ScrollView>(null);
  const screenWidth = Dimensions.get("window").width - 40;
  const chartWidth = Math.max(screenWidth, data.length * 60);
  
  // Calculate max and min values for chart scaling
  const dataMax = Math.max(...data.map(item => item.value));
  const dataMin = Math.min(...data.map(item => item.value));
  
  // Ensure we have at least 20% padding in the y-axis
  const maxValue = Math.max(dataMax, averageSpending) * 1.2;
  const minValue = Math.max(0, dataMin * 0.8);
  
  return (
    <Card 
      padding="$4" 
      borderRadius="$4" 
      backgroundColor="white"
      marginBottom="$4"
      shadowColor="rgba(0,0,0,0.05)"
      shadowRadius={2}
      shadowOffset={{ width: 0, height: 1 }}
      elevation={1}
    >
      {/* Chart title and legend */}
      <XStack justifyContent="space-between" alignItems="center" marginBottom="$3">
        <Text fontSize="$3.5" fontWeight="$7" color="$gray12">
          {t("Expense Trends")}
        </Text>
        <XStack space="$3" alignItems="center">
          <XStack space="$1" alignItems="center">
            <View style={{ width: 10, height: 2, backgroundColor: "#3B82F6", borderRadius: 1 }} />
            <Text fontSize="$2.5" color="$gray10">{t("Expenses")}</Text>
          </XStack>
          <XStack space="$1" alignItems="center">
            <View style={{ 
              width: 10, 
              height: 0, 
              borderWidth: 0.5, 
              borderColor: "#3B82F6",
              borderStyle: "dashed",
              borderRadius: 1 
            }} />
            <Text fontSize="$2.5" color="$gray10">
              {t("Average")}: ¥{averageSpending.toFixed(0)}
            </Text>
          </XStack>
        </XStack>
      </XStack>
      
      <XStack alignItems="center" justifyContent="center" marginBottom="$2">
        <Button 
          size="$2" 
          circular 
          backgroundColor="$gray2"
          onPress={() => {
            scrollViewRef.current?.scrollTo({ x: 0, animated: true });
          }}
        >
          <ChevronLeft size={16} color="#64748B" />
        </Button>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 10 }}
        >
          <LineChart
            data={{
              labels: data.map(item => item.label),
              datasets: [
                {
                  data: [minValue, ...data.map(item => item.value), maxValue]
                }
              ]
            }}
            width={chartWidth}
            height={220}
            withInnerLines={true}
            fromZero={false}
            chartConfig={{
              backgroundColor: "white",
              backgroundGradientFrom: "white",
              backgroundGradientTo: "white",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
              propsForDots: {
                r: "5",
                strokeWidth: "2",
                stroke: "#fff",
              },
              propsForBackgroundLines: {
                strokeDasharray: '',
                strokeWidth: 1,
                stroke: "rgba(230, 235, 245, 1)",
              },
              formatYLabel: (value: string) => {
                return `¥${value}`;
              },
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 8,
            }}
            renderDotContent={({ x, y, index, indexData }: { x: number; y: number; index: number; indexData: number }) => {
              if (index === 0 || index > data.length) return null;
              
              const dataIndex = index - 1;
              const value = data[dataIndex].value;
              const isHigherThanAvg = value > averageSpending;
              
              return (
                <View
                  key={`dot-label-${dataIndex}`}
                  style={{
                    position: 'absolute',
                    top: y - 24,
                    left: x - 18,
                  }}
                >
                  <Text
                    style={{
                      color: isHigherThanAvg ? '#EF4444' : '#10B981',
                      fontWeight: 'bold',
                      fontSize: 10,
                    }}
                  >
                    ¥{value}
                  </Text>
                </View>
              );
            }}
            decorator={() => {
              const chartHeight = 220;
              const valuePadding = (maxValue - minValue) * 0.1;
              const effectiveMin = minValue - valuePadding;
              const effectiveMax = maxValue + valuePadding;
              const valueRange = effectiveMax - effectiveMin;
              
              if (valueRange === 0) return null;

              const avgPercent = (effectiveMax - averageSpending) / valueRange;
              const avgPosition = avgPercent * chartHeight;
              
              return (
                <>
                  <View
                    style={{
                      position: 'absolute',
                      left: 40,
                      top: avgPosition,
                      right: 0,
                      height: 1,
                      borderWidth: 0.5,
                      borderColor: '#3B82F6',
                      borderStyle: 'dashed',
                      backgroundColor: 'transparent',
                      zIndex: 1000,
                    }}
                  />
                  
                  <View
                    style={{
                      position: 'absolute',
                      left: 5,
                      top: avgPosition - 10,
                      backgroundColor: '#EBF2FF',
                      paddingHorizontal: 3,
                      paddingVertical: 1,
                      borderRadius: 2,
                    }}
                  >
                    <Text
                      style={{
                        color: '#3B82F6',
                        fontSize: 8,
                        fontWeight: 'bold',
                      }}
                    >
                      ¥{averageSpending.toFixed(0)}
                    </Text>
                  </View>
                </>
              );
            }}
          />
        </ScrollView>
        <Button 
          size="$2" 
          circular 
          backgroundColor="$gray2"
          onPress={() => {
            scrollViewRef.current?.scrollTo({ x: chartWidth, animated: true });
          }}
        >
          <ChevronRight size={16} color="#64748B" />
        </Button>
      </XStack>
      
      <Text fontSize="$2.5" color="$gray10" textAlign="center">
        {t("Swipe to see more data")}
      </Text>
    </Card>
  );
};

export default ExpenseTrendChart; 
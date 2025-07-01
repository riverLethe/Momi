import React, { useRef, useEffect, useMemo, useCallback } from "react";
import { Dimensions, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import { Card, XStack, Text, Button, View, useTheme } from "tamagui";
import { ChartNoAxesCombinedIcon, ChevronLeft, ChevronRight } from "lucide-react-native";
import { LineChart } from "react-native-chart-kit";
import { TrendData } from "@/types/reports.types";
import { formatCurrency } from "@/utils/format";

interface ExpenseTrendChartProps {
  data: TrendData[];
  averageSpending: number;
}

const ExpenseTrendChart: React.FC<ExpenseTrendChartProps> = ({
  data,
  averageSpending,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);

  // 缓存屏幕宽度和图表配置
  const screenConfig = useMemo(() => {
    const screenWidth = Dimensions.get("window").width - 40;
    const chartWidth = Math.max(screenWidth, data.length * 60);
    return { screenWidth, chartWidth };
  }, [data.length]);

  // 缓存图表数据
  const chartData = useMemo(() => ({
    labels: data.map((item) => item.label),
    datasets: [
      {
        data: data.map((item) => Number(item.value.toFixed(2))),
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        strokeWidth: 2,
      },
      {
        data: Array(data.length).fill(averageSpending),
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity * 0.7})`,
        strokeWidth: 1,
        strokeDashArray: [5, 5],
        withDots: false,
      },
    ],
  }), [data, averageSpending]);

  // 缓存图表配置
  const chartConfig = useMemo(() => ({
    backgroundColor: theme.card?.get() || "white",
    backgroundGradientFrom: theme.card?.get() || "white",
    backgroundGradientTo: theme.card?.get() || "white",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => theme.color8?.get() || `rgba(100, 116, 139, ${opacity})`,
    propsForDots: {
      r: "5",
      strokeWidth: "2",
      stroke: theme.card?.get() || "#fff",
    },
    propsForBackgroundLines: {
      strokeDasharray: "",
      strokeWidth: 1,
      stroke: theme.borderColor?.get() || "rgba(230, 235, 245, 1)",
    },
    formatYLabel: (value: string) => {
      const num = parseFloat(value);
      const rounded = Math.round(num * 100) / 100;
      return formatCurrency(rounded);
    },
  }), [theme]);

  // 防抖滚动到末尾
  const scrollToEndDebounced = useCallback(() => {
    if (data.length > 0 && scrollViewRef.current) {
      // 减少延迟时间
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 50);
    }
  }, [data.length]);

  // 优化数据更新时的滚动
  useEffect(() => {
    scrollToEndDebounced();
  }, [scrollToEndDebounced]);

  // 优化滚动操作
  const scrollToStart = useCallback(() => {
    scrollViewRef.current?.scrollTo({ x: 0, animated: true });
  }, []);

  const scrollToEnd = useCallback(() => {
    scrollViewRef.current?.scrollTo({ x: screenConfig.chartWidth, animated: true });
  }, [screenConfig.chartWidth]);

  // 缓存渲染的点内容
  const renderDotContent = useCallback(({
    x,
    y,
    index,
  }: {
    x: number;
    y: number;
    index: number;
    indexData: number;
  }) => {
    if (index >= data.length || !data[index]) return null;

    const value = data[index].value;
    if (typeof value !== 'number' || isNaN(value)) return null;

    const roundedValue = Math.round(value * 100) / 100;
    const isHigherThanAvg = value > averageSpending;

    return (
      <View
        key={`dot-label-${index}`}
        style={{
          position: "absolute",
          top: y - 24,
          left: x - 18,
        }}
      >
        <Text
          style={{
            color: isHigherThanAvg ? theme.red9?.get() : theme.green9?.get(),
            fontWeight: "bold",
            fontSize: 10,
          }}
        >
          {formatCurrency(roundedValue)}
        </Text>
      </View>
    );
  }, [data, averageSpending, theme]);

  // 缓存平均支出格式化
  const formattedAverageSpending = useMemo(() =>
    formatCurrency(averageSpending),
    [averageSpending]
  );

  return (
    <Card
      backgroundColor="$card"
      marginHorizontal="$3"
      paddingVertical="$3"
      paddingHorizontal="$3"
    >
      {/* Chart title and legend */}
      <XStack
        justifyContent="space-between"
        alignItems="center"
        marginBottom="$3"
      >
        <XStack
          justifyContent="space-between"
          alignItems="center"
        >
          <XStack gap="$2" alignItems="center">
            <ChartNoAxesCombinedIcon size={24} color={theme.blue9?.get()} />
            <Text fontSize="$4" fontWeight="$8" color="$color">
              {t("Expense Trends")}
            </Text>
          </XStack>
        </XStack>
        <XStack gap="$3" alignItems="center">
          <XStack gap="$1" alignItems="center">
            <View
              style={{
                width: 10,
                height: 2,
                backgroundColor: theme.blue9?.get(),
                borderRadius: 1,
              }}
            />
            <Text fontSize="$2" color="$color10">
              {t("Expenses")}
            </Text>
          </XStack>
          <XStack gap="$1" alignItems="center">
            <View
              style={{
                width: 10,
                height: 0,
                borderWidth: 0.5,
                borderColor: theme.blue9?.get(),
                borderStyle: "dashed",
                borderRadius: 1,
              }}
            />
            <Text fontSize="$2" color="$color10">
              {t("Average")}: {formattedAverageSpending}
            </Text>
          </XStack>
        </XStack>
      </XStack>

      <XStack alignItems="center" justifyContent="center" marginBottom="$2">
        <Button
          size="$2"
          circular
          backgroundColor="$backgroundSoft"
          onPress={scrollToStart}
        >
          <ChevronLeft size={16} color={theme.color8?.get()} />
        </Button>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 10 }}
          removeClippedSubviews={true}
        >
          <LineChart
            data={chartData}
            width={screenConfig.chartWidth}
            height={220}
            withInnerLines={true}
            fromZero={false}
            chartConfig={chartConfig}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 8,
            }}
            renderDotContent={renderDotContent}
          />
        </ScrollView>
        <Button
          size="$2"
          circular
          backgroundColor="$backgroundSoft"
          onPress={scrollToEnd}
        >
          <ChevronRight size={16} color={theme.color8?.get()} />
        </Button>
      </XStack>
    </Card>
  );
};

export default React.memo(ExpenseTrendChart);

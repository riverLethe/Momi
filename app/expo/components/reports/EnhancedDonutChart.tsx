import React, { useState } from "react";
import { Dimensions } from "react-native";
import { useTranslation } from "react-i18next";
import { View, Text, Card, Button, XStack, YStack } from "tamagui";
import { ArrowDownRight, ArrowUpRight } from "lucide-react-native";
import Svg, { Circle as SvgCircle, Path } from "react-native-svg";
import { CategoryData, TopSpendingCategory } from "@/types/reports.types";
import { formatCurrency } from "@/utils/format";

interface EnhancedDonutChartProps {
  data: CategoryData[];
}

const EnhancedDonutChart: React.FC<EnhancedDonutChartProps> = ({
  data,
}) => {
  const { t } = useTranslation();
  const [showAllCategories, setShowAllCategories] = useState(false);
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);
  const screenWidth = Dimensions.get("window").width;
  const size = Math.min(screenWidth - 80, 220);

  // Filter categories to show only those above 5% or combine into "Other"
  const significantCategories = data.filter(
    (item) => (item.value / totalValue) * 100 >= 5
  );

  const otherCategories = data.filter(
    (item) => (item.value / totalValue) * 100 < 5
  );

  let processedData = [...significantCategories];

  if (otherCategories.length > 0) {
    const otherValue = otherCategories.reduce(
      (sum, item) => sum + item.value,
      0
    );
    if (otherValue > 0) {
      processedData.push({
        label: "Other",
        value: otherValue,
        color: "#94A3B8", // Gray color for "Other"
      });
    }
  }

  // Limit displayed categories in legend
  const displayedCategories = showAllCategories
    ? data.sort((a, b) => b.value - a.value)
    : data.sort((a, b) => b.value - a.value).slice(0, 5);
  const hasMoreCategories = data.length > 5;

  // SVG dimensions
  const strokeWidth = 15;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  const createArc = (startAngle: number, endAngle: number): string => {
    const x1 = center + radius * Math.cos(startAngle);
    const y1 = center + radius * Math.sin(startAngle);
    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center + radius * Math.sin(endAngle);

    const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

    return `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };

  let currentAngle = -Math.PI / 2;
  const segments = processedData.map((item) => {
    const angle = (item.value / totalValue) * (2 * Math.PI);
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;

    const path = createArc(startAngle, endAngle);
    currentAngle = endAngle;

    return { path, color: item.color, value: item.value };
  });

  if (data.length === 0 || totalValue === 0) {
    return null; // Don't render anything if there's no data
  }

  return (
    <Card

      backgroundColor="white"
      marginHorizontal="$3"
      paddingVertical="$3"
    >
      <YStack alignItems="center" justifyContent="center" paddingVertical="$3">
        <View style={{ width: size, height: size, position: "relative" }}>
          <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <SvgCircle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="#f1f5f9"
              strokeWidth={strokeWidth}
            />
            {segments.map((segment, i) => (
              <Path key={i} d={segment.path} fill={segment.color} />
            ))}
            <SvgCircle
              cx={center}
              cy={center}
              r={radius - strokeWidth}
              fill="white"
            />
          </Svg>
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text fontWeight="$8" fontSize="$6">
              {formatCurrency(totalValue)}
            </Text>
            <Text color="$gray10" fontSize="$2" marginTop="$1">
              {t("Total Expenses")}
            </Text>
          </View>
        </View>

      </YStack>
      <YStack paddingHorizontal="$3">
        {displayedCategories.map((item) => {
          // 直接从当前显示的类别中获取同比数据
          const yearOverYearChange =
            item.yearOverYearChange !== undefined ? item.yearOverYearChange : 0;
          const hasChange = yearOverYearChange !== 0;
          const isIncrease = yearOverYearChange > 0;
          const isDecrease = yearOverYearChange < 0;

          return (
            <YStack key={item.label} paddingVertical="$1.5">
              <XStack alignItems="center" justifyContent="space-between">
                <XStack alignItems="center" gap="$2">
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 3,
                      backgroundColor: item.color,
                    }}
                  />
                  <Text fontWeight="$5" fontSize="$3">
                    {t(item.label)}
                  </Text>

                  {hasChange && (
                    <XStack gap="$1" alignItems="center">
                      {isIncrease ? (
                        <>
                          <ArrowUpRight size={10} color="#EF4444" />
                          <Text fontSize="$2" color="#EF4444">
                            {yearOverYearChange}%
                          </Text>
                        </>
                      ) : isDecrease ? (
                        <>
                          <ArrowDownRight size={10} color="#10B981" />
                          <Text fontSize="$2" color="#10B981">
                            {Math.abs(yearOverYearChange)}%
                          </Text>
                        </>
                      ) : (
                        <Text fontSize="$2" color="$gray10">
                          -
                        </Text>
                      )}
                    </XStack>
                  )}
                </XStack>
                <XStack alignItems="baseline" gap="$1">
                  <Text fontWeight="$7" fontSize="$3">
                    {formatCurrency(item.value)}
                  </Text>
                  <Text color="$gray10" fontSize="$2">
                    ({((item.value / totalValue) * 100).toFixed(1)}%)
                  </Text>
                </XStack>
              </XStack>
            </YStack>
          );
        })}

        {hasMoreCategories && (
          <Button
            marginTop="$2"
            size="$1"
            variant="outlined"
            onPress={() => setShowAllCategories(!showAllCategories)}
            color="$gray9"
            borderWidth={0}
            pressStyle={{ opacity: 0.8 }}
          >
            {t(showAllCategories ? "Show Less" : "Show More Categories")}
          </Button>
        )}
      </YStack>
    </Card>
  );
};

export default EnhancedDonutChart;

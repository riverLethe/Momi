import React, { useState, useEffect, useRef } from "react";
import {
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Calendar, ChevronDown,  ArrowRight, TrendingUp, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle } from "lucide-react-native";
import { 
  View, 
  Text, 
  Card, 
  Button, 
  XStack, 
  YStack, 
  Circle,
  Separator,
  ScrollView as TamaguiScrollView,
} from "tamagui";
import { LinearGradient } from "tamagui/linear-gradient";
import { LineChart } from "react-native-chart-kit";
import Svg, { Circle as SvgCircle, Path, G } from 'react-native-svg';
import { useViewStore } from "@/stores/viewStore";
import { useAuth } from "@/providers/AuthProvider";
import AppHeader from "@/components/shared/AppHeader";
import DateFilter, { DatePeriod } from "@/components/reports/DateFilter";

// Enhanced donut chart component with "more" button for categories
const EnhancedDonutChart = ({
  data,
}: {
  data: { label: string; value: number; color: string }[];
}) => {
  const [showAllCategories, setShowAllCategories] = useState(false);
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);
  const screenWidth = Dimensions.get("window").width;
  const chartSize = Math.min(screenWidth - 80, 220);
  
  // Filter categories to show only those above 5% or combine into "Other"
  const significantCategories = data.filter(
    (item) => (item.value / totalValue) * 100 >= 5
  );
  
  const otherCategories = data.filter(
    (item) => (item.value / totalValue) * 100 < 5
  );
  
  let processedData = [...significantCategories];
  
  if (otherCategories.length > 0) {
    const otherValue = otherCategories.reduce((sum, item) => sum + item.value, 0);
    if (otherValue > 0) {
      processedData.push({
        label: "Other",
        value: otherValue,
        color: "#94A3B8", // Gray color for "Other"
      });
    }
  }
  
  // Limit displayed categories in legend
  const displayedCategories = showAllCategories ? data : processedData.slice(0, 5);
  const hasMoreCategories = data.length > 5;
  
  // SVG dimensions
  const size = chartSize;
  const strokeWidth = size * 0.15;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  
  // Calculate the arcs for the donut chart
  const createArc = (startAngle: number, endAngle: number): string => {
    const x1 = center + radius * Math.cos(startAngle);
    const y1 = center + radius * Math.sin(startAngle);
    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center + radius * Math.sin(endAngle);
    
    const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;
    
    return `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };
  
  // Create the donut segments
  let currentAngle = -Math.PI / 2; // Start from the top (90 degrees)
  const segments = processedData.map((item, i) => {
    const angle = (item.value / totalValue) * (2 * Math.PI);
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    
    const path = createArc(startAngle, endAngle);
    currentAngle = endAngle;
    
    return { path, color: item.color, value: item.value };
  });

  return (
    <YStack alignItems="center" justifyContent="center" paddingVertical="$3">
      <View style={{ width: size, height: size, position: 'relative' }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle */}
          <SvgCircle 
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          
          {/* Segments */}
          {segments.map((segment, i) => (
            <Path
              key={i}
              d={segment.path}
              fill={segment.color}
            />
          ))}
          
          {/* Inner circle */}
          <SvgCircle
            cx={center}
            cy={center}
            r={radius - strokeWidth}
            fill="white"
          />
        </Svg>
        
        {/* Total expenses in the center */}
        <View 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text fontWeight="$8" fontSize="$6">¥{totalValue.toFixed(0)}</Text>
          <Text color="$gray10" fontSize="$2.5" marginTop="$1">Total Expenses</Text>
        </View>
      </View>

      {/* Legend */}
      <Card width="100%" padding="$3.5" borderRadius="$4" marginTop="$3" backgroundColor="white" elevate>
        {displayedCategories.sort((a, b) => b.value - a.value).map((item) => (
          <XStack
            key={item.label}
            alignItems="center"
            justifyContent="space-between"
            marginBottom="$2.5"
          >
            <XStack alignItems="center" space="$2">
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  backgroundColor: item.color,
                }}
              />
              <Text fontWeight="$5" fontSize="$3">{item.label}</Text>
            </XStack>
            <XStack alignItems="baseline" space="$1">
              <Text fontWeight="$7" fontSize="$3">
                ¥{item.value.toFixed(0)}
              </Text>
              <Text color="$gray10" fontSize="$2">
                ({((item.value / totalValue) * 100).toFixed(1)}%)
              </Text>
            </XStack>
          </XStack>
        ))}
        
        {/* More button for additional categories */}
        {hasMoreCategories && (
          <Button
            marginTop="$2"
            size="$3"
            variant="outlined"
            onPress={() => setShowAllCategories(!showAllCategories)}
          >
            {showAllCategories ? "Show Less" : "Show More Categories"}
          </Button>
        )}
      </Card>
    </YStack>
  );
};

// Enhanced line chart for expense trends
const ExpenseTrendChart = ({
  data,
}: {
  data: { label: string; value: number }[];
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  // Calculate average value
  const avgValue = data.reduce((sum, item) => sum + item.value, 0) / data.length;
  const screenWidth = Dimensions.get("window").width - 40;
  const chartWidth = Math.max(screenWidth, data.length * 60);
  
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
        <Text fontSize="$3.5" fontWeight="$7" color="$gray12">Expense Trends</Text>
        <XStack space="$3" alignItems="center">
          <XStack space="$1" alignItems="center">
            <View style={{ width: 10, height: 2, backgroundColor: "#3B82F6", borderRadius: 1 }} />
            <Text fontSize="$2.5" color="$gray10">Expenses</Text>
          </XStack>
          <XStack space="$1" alignItems="center">
            <View style={{ width: 10, height: 2, backgroundColor: "#94A3B8", borderRadius: 1, borderStyle: 'dashed' }} />
            <Text fontSize="$2.5" color="$gray10">Average</Text>
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
                  data: data.map(item => item.value),
                }
              ]
            }}
            width={chartWidth}
            height={220}
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
              },
              formatYLabel: (value: string) => `¥${value}`,
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 8,
            }}
            renderDotContent={({ x, y, index, indexData }: { x: number; y: number; index: number; indexData: number }) => {
              const isHigherThanAvg = indexData > avgValue;
              return (
                <View
                  key={index}
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
                    ¥{indexData}
                  </Text>
                </View>
              );
            }}
            decorator={() => {
              return (
                <View
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 220 * (1 - avgValue / Math.max(...data.map(d => d.value))),
                    right: 0,
                    borderWidth: 1,
                    borderColor: '#94A3B8',
                    borderStyle: 'dashed',
                  }}
                />
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
      
      <Text fontSize="$2.5" color="$gray10" textAlign="center">Swipe to see more data</Text>
    </Card>
  );
};

// Mock data for charts
const MOCK_CATEGORY_DATA = [
  { label: "Food", value: 1250, color: "#3B82F6" },
  { label: "Transport", value: 850, color: "#10B981" },
  { label: "Shopping", value: 1500, color: "#EC4899" },
  { label: "Entertainment", value: 600, color: "#F59E0B" },
  { label: "Utilities", value: 400, color: "#8B5CF6" },
  { label: "Health", value: 150, color: "#06B6D4" },
  { label: "Education", value: 120, color: "#6366F1" },
  { label: "Gifts", value: 80, color: "#F43F5E" },
];

const MOCK_MONTHLY_DATA = [
  { label: "Jan", value: 2800 },
  { label: "Feb", value: 3200 },
  { label: "Mar", value: 2950 },
  { label: "Apr", value: 3800 },
  { label: "May", value: 2900 },
  { label: "Jun", value: 3100 },
  { label: "Jul", value: 3500 },
  { label: "Aug", value: 2800 },
  { label: "Sep", value: 3400 },
  { label: "Oct", value: 3000 },
  { label: "Nov", value: 3200 },
  { label: "Dec", value: 3900 },
];

export default function ReportsScreen() {
  const router = useRouter();
  const { viewMode, currentFamilySpace } = useViewStore();
  const { isLoggedIn } = useAuth();

  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState<DatePeriod>("Week");
  const [categoryData, setCategoryData] = useState(MOCK_CATEGORY_DATA);
  const [trendData, setTrendData] = useState(MOCK_MONTHLY_DATA);
  
  // Check if family mode is accessible
  useEffect(() => {
    if (viewMode === "family" && !isLoggedIn) {
      // If trying to view family reports but not logged in
      useViewStore.getState().setViewMode("personal");
    }
  }, [viewMode, isLoggedIn]);

  // Simulate loading data and update based on person/date change
  useEffect(() => {
    setLoading(true);
    
    // Simulate API fetch with different data based on filters
    setTimeout(() => {
      // Update data based on viewMode and periodFilter
      if (viewMode === "family") {
        // Family data would be different
        const familyMultiplier = 1.8;
        const updatedCategoryData = MOCK_CATEGORY_DATA.map(item => ({
          ...item,
          value: Math.round(item.value * familyMultiplier)
        }));
        
        setCategoryData(updatedCategoryData);
        
        if (periodFilter === "Month") {
          setTrendData(MOCK_MONTHLY_DATA.slice(0, 6).map(item => ({
            ...item,
            value: Math.round(item.value * familyMultiplier)
          })));
        } else if (periodFilter === "Quarter") {
          setTrendData(MOCK_MONTHLY_DATA.slice(0, 3).map(item => ({
            ...item,
            value: Math.round(item.value * familyMultiplier)
          })));
        } else if (periodFilter === "Year") {
          setTrendData(MOCK_MONTHLY_DATA.map(item => ({
            ...item,
            value: Math.round(item.value * familyMultiplier)
          })));
        } else { // This Week
          setTrendData([
            { label: "Mon", value: Math.round(800 * familyMultiplier) },
            { label: "Tue", value: Math.round(650 * familyMultiplier) },
            { label: "Wed", value: Math.round(720 * familyMultiplier) },
            { label: "Thu", value: Math.round(900 * familyMultiplier) },
            { label: "Fri", value: Math.round(1100 * familyMultiplier) },
            { label: "Sat", value: Math.round(1500 * familyMultiplier) },
            { label: "Sun", value: Math.round(900 * familyMultiplier) },
          ]);
        }
      } else {
        // Personal data
        setCategoryData(MOCK_CATEGORY_DATA);
        
        if (periodFilter === "Month") {
          setTrendData(MOCK_MONTHLY_DATA.slice(0, 6));
        } else if (periodFilter === "Quarter") {
          setTrendData(MOCK_MONTHLY_DATA.slice(0, 3));
        } else if (periodFilter === "Year") {
          setTrendData(MOCK_MONTHLY_DATA);
        } else { // This Week
          setTrendData([
            { label: "Mon", value: 800 },
            { label: "Tue", value: 650 },
            { label: "Wed", value: 720 },
            { label: "Thu", value: 900 },
            { label: "Fri", value: 1100 },
            { label: "Sat", value: 1500 },
            { label: "Sun", value: 900 },
          ]);
        }
      }
      
      setLoading(false);
    }, 1000);
  }, [viewMode, periodFilter]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <YStack flex={1}>
        {/* Header */}
        <AppHeader />

        {/* Date Filter */}
        <Card 
          marginHorizontal="$4" 
          marginTop="$3.5" 
          marginBottom="$3.5" 
          backgroundColor="white" 
          borderRadius="$4"
          elevate
          shadowColor="rgba(0,0,0,0.08)"
          shadowRadius={6}
          padding="$1"
          justifyContent="center"
          alignItems="center"
        >
          <DateFilter 
            selectedPeriod={periodFilter}
            onPeriodChange={setPeriodFilter}
          />
        </Card>

        {/* Content */}
        {loading ? (
          <YStack flex={1} justifyContent="center" alignItems="center">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text marginTop="$4" color="$gray10">Loading reports...</Text>
          </YStack>
        ) : (
          <ScrollView 
            style={{ flex: 1, paddingHorizontal: 16 }} 
            contentContainerStyle={{ paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          >
            <YStack paddingTop="$1">
              <EnhancedDonutChart data={categoryData} />
            </YStack>
          
            <YStack paddingTop="$1">
              <ExpenseTrendChart data={trendData} />
            </YStack>
            
            {/* Additional Financial Insights */}
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
              <Text fontSize="$3.5" fontWeight="$7" marginBottom="$3" color="$gray12">
                Financial Insights
              </Text>
              
              <YStack space="$3.5">
                <XStack space="$3" alignItems="center">
                  <Circle size="$3.5" backgroundColor="$blue2">
                    <TrendingUp size={16} color="#3B82F6" />
                  </Circle>
                  <YStack flex={1}>
                    <Text fontSize="$3" fontWeight="$6" color="$gray12">
                      Spending Pattern
                    </Text>
                    <Text fontSize="$2.5" color="$gray10">
                      {viewMode === "personal" 
                        ? "Your spending is 15% higher on weekends" 
                        : "Family spending is 22% higher on weekends"}
                    </Text>
                  </YStack>
                </XStack>
                
                <XStack space="$3" alignItems="center">
                  <Circle size="$3.5" backgroundColor="$green2">
                    <CheckCircle size={16} color="#10B981" />
                  </Circle>
                  <YStack flex={1}>
                    <Text fontSize="$3" fontWeight="$6" color="$gray12">
                      Savings Potential
                    </Text>
                    <Text fontSize="$2.5" color="$gray10">
                      You could save ¥{Math.round(categoryData[0].value * 0.15)} on Food by cooking more at home
                    </Text>
                  </YStack>
                </XStack>
                
                <XStack space="$3" alignItems="center">
                  <Circle size="$3.5" backgroundColor="$amber2">
                    <AlertTriangle size={16} color="#F59E0B" />
                  </Circle>
                  <YStack flex={1}>
                    <Text fontSize="$3" fontWeight="$6" color="$gray12">
                      Budget Alert
                    </Text>
                    <Text fontSize="$2.5" color="$gray10">
                      Shopping expenses exceed budget by 15%
                    </Text>
                  </YStack>
                </XStack>
              </YStack>
            </Card>
            
            {/* Financial Health Score */}
            <Card 
              padding="$4" 
              borderRadius="$4" 
              backgroundColor="white" 
              elevate
              shadowColor="rgba(0,0,0,0.08)"
              shadowRadius={4}
            >
              <Text fontSize="$3.5" fontWeight="$7" marginBottom="$3" color="$gray12">
                Financial Health Score
              </Text>
              
              <YStack alignItems="center" marginBottom="$3">
                <Circle 
                  size="$9" 
                  backgroundColor="$blue1"
                  borderWidth={8}
                  borderColor="$blue9"
                >
                  <Text fontSize="$6" fontWeight="$8" color="$blue9">
                    {viewMode === "personal" ? "78" : "72"}
                  </Text>
                </Circle>
                <Text fontSize="$3" fontWeight="$6" color="$gray11" marginTop="$2">
                  {viewMode === "personal" ? "Good" : "Fair"}
                </Text>
              </YStack>
              
              <YStack space="$2">
                <XStack justifyContent="space-between" alignItems="center">
                  <Text fontSize="$3" color="$gray11">Spending Discipline</Text>
                  <Text fontWeight="$6" fontSize="$3" color="$blue9">
                    {viewMode === "personal" ? "Good" : "Fair"}
                  </Text>
                </XStack>
                
                <XStack justifyContent="space-between" alignItems="center">
                  <Text fontSize="$3" color="$gray11">Budget Adherence</Text>
                  <Text fontWeight="$6" fontSize="$3" color={viewMode === "personal" ? "$green9" : "$amber9"}>
                    {viewMode === "personal" ? "Excellent" : "Needs Improvement"}
                  </Text>
                </XStack>
                
                <XStack justifyContent="space-between" alignItems="center">
                  <Text fontSize="$3" color="$gray11">Savings Rate</Text>
                  <Text fontWeight="$6" fontSize="$3" color="$blue9">
                    {viewMode === "personal" ? "15%" : "8%"}
                  </Text>
                </XStack>
              </YStack>
              
              <Button
                backgroundColor="$blue9"
                color="white"
                borderRadius="$3"
                paddingVertical="$2"
                marginTop="$3"
                hoverStyle={{ opacity: 0.9 }}
                pressStyle={{ opacity: 0.8 }}
                onPress={() => alert("Financial health details coming soon")}
              >
                <Text color="white" fontWeight="$6">
                  Improve Your Score
                </Text>
              </Button>
            </Card>
          </ScrollView>
        )}
      </YStack>
    </SafeAreaView>
  );
}

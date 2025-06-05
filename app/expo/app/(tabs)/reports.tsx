import React, { useState, useEffect } from "react";
import {
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Calendar, ChevronDown, BarChart2, PieChart, ArrowRight } from "lucide-react-native";
import { 
  View, 
  Text, 
  Card, 
  Button, 
  XStack, 
  YStack, 
  Circle,
  Sheet,
  Separator
} from "tamagui";
import { LinearGradient } from "tamagui/linear-gradient";

import { useViewStore } from "@/stores/viewStore";
import { useAuth } from "@/providers/AuthProvider";

// Enhanced donut chart component - consider replacing with Victory Pie
const EnhancedPieChart = ({
  data,
}: {
  data: { label: string; value: number; color: string }[];
}) => {
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);
  const screenWidth = Dimensions.get("window").width;
  const chartSize = Math.min(screenWidth - 80, 220);

  return (
    <YStack alignItems="center" justifyContent="center" paddingVertical="$3">
      <YStack
        style={{
          position: "relative",
          width: chartSize,
          height: chartSize,
          borderRadius: chartSize / 2,
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        {/* Chart background */}
        <View
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            borderRadius: chartSize / 2,
            backgroundColor: "#f3f4f6",
          }}
        />
        
        {/* Chart sectors */}
        {data.map((item, index) => {
          const startAngle =
            data
              .slice(0, index)
              .reduce((sum, curr) => sum + curr.value / totalValue, 0) * 360;
          const endAngle = startAngle + (item.value / totalValue) * 360;

          return (
            <View
              key={item.label}
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                backgroundColor: item.color,
                borderRadius: chartSize / 2,
                transform: [{ rotate: `${startAngle}deg` }],
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  width: "100%",
                  height: "100%",
                  transform: [{ rotate: `${endAngle - startAngle}deg` }],
                  backgroundColor: "#f3f4f6",
                }}
              />
            </View>
          );
        })}
        
        {/* Center circle */}
        <View
          style={{
            width: chartSize * 0.6,
            height: chartSize * 0.6,
            borderRadius: chartSize * 0.3,
            backgroundColor: "white",
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "rgba(0,0,0,0.1)",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.5,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <Text fontWeight="$8" fontSize="$6">¥{totalValue.toFixed(0)}</Text>
          <Text color="$gray10" fontSize="$2.5" marginTop="$1">Total Expenses</Text>
        </View>
      </YStack>

      {/* Legend */}
      <Card width="100%" padding="$3.5" borderRadius="$4" marginTop="$3" backgroundColor="white" elevate>
        {data.map((item) => (
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
      </Card>
    </YStack>
  );
};

// Victory Charts implementation for bar chart
const VictoryBarChart = ({
  data,
}: {
  data: { label: string; value: number }[];
}) => {
  // Calculate average value
  const avgValue = data.reduce((sum, item) => sum + item.value, 0) / data.length;
  
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
        <Text fontSize="$3.5" fontWeight="$7" color="$gray12">Monthly Comparison</Text>
        <XStack space="$3" alignItems="center">
          <XStack space="$1" alignItems="center">
            <View style={{ width: 10, height: 10, backgroundColor: "#4285F4", borderRadius: 2 }} />
            <Text fontSize="$2.5" color="$gray10">Monthly</Text>
          </XStack>
          <XStack space="$1" alignItems="center">
            <View style={{ width: 10, height: 2, backgroundColor: "#94A3B8", borderRadius: 1 }} />
            <Text fontSize="$2.5" color="$gray10">Average</Text>
          </XStack>
        </XStack>
      </XStack>
      
      <View style={{ height: 300, paddingBottom: 20 }}>
        {/* 简单的条形图实现 */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', height: 250, alignItems: 'flex-end', paddingHorizontal: 10 }}>
          {data.map((item, index) => {
            const barHeight = (item.value / Math.max(...data.map(d => d.value))) * 200;
            
            return (
              <View key={item.label} style={{ alignItems: 'center', width: `${100 / data.length - 5}%` }}>
                {/* 显示金额 */}
                <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 5 }}>
                  ¥{item.value}
                </Text>
                
                {/* 条形 */}
                <View 
                  style={{ 
                    width: 35, 
                    height: barHeight, 
                    backgroundColor: '#4285F4',
                    borderTopLeftRadius: 4,
                    borderTopRightRadius: 4
                  }}
                />
                
                {/* 标签 */}
                <Text style={{ fontSize: 10, marginTop: 8, color: '#64748B', fontWeight: 'bold' }}>
                  {item.label}
                </Text>
              </View>
            );
          })}
        </View>
        
        {/* 平均线 */}
        <View 
          style={{ 
            position: 'absolute', 
            left: 10, 
            right: 10, 
            top: 250 - (avgValue / Math.max(...data.map(d => d.value))) * 200,
            borderBottomWidth: 1,
            borderBottomColor: '#94A3B8',
            borderStyle: 'dashed'
          }}
        />
      </View>
      
      {/* Chart footer */}
      <XStack justifyContent="space-between" paddingTop="$2" alignItems="center">
        <Text fontSize="$2.5" color="$gray10">Period: Last 6 Months</Text>
        <Button 
          chromeless 
          onPress={() => alert("Full report feature coming soon")}
          pressStyle={{ opacity: 0.7 }}
          size="$2"
        >
          <XStack alignItems="center" space="$1">
            <Text fontSize="$2.5" color="$blue9">View Full Report</Text>
            <ArrowRight size={12} color="#3B82F6" />
          </XStack>
        </Button>
      </XStack>
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
];

const MOCK_MONTHLY_DATA = [
  { label: "Jan", value: 2800 },
  { label: "Feb", value: 3200 },
  { label: "Mar", value: 2950 },
  { label: "Apr", value: 3800 },
  { label: "May", value: 2900 },
  { label: "Jun", value: 3100 },
];

export default function ReportsScreen() {
  const router = useRouter();
  const { viewMode, currentFamilySpace } = useViewStore();
  const { isLoggedIn } = useAuth();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("categories");
  const [periodFilter, setPeriodFilter] = useState("This Week");
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Check if family mode is accessible
  useEffect(() => {
    if (viewMode === "family" && !isLoggedIn) {
      // If trying to view family reports but not logged in
      useViewStore.getState().setViewMode("personal");
    }
  }, [viewMode, isLoggedIn]);

  // Simulate loading data
  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const toggleViewMode = () => {
    if (viewMode === "personal") {
      if (!isLoggedIn) {
        router.push("/auth/login");
        return;
      }
      useViewStore.getState().setViewMode("family");
    } else {
      useViewStore.getState().setViewMode("personal");
    }
  };

  const periods = ["This Week", "This Month", "This Quarter", "This Year"];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <YStack flex={1}>
        {/* Gradient Header */}
        <LinearGradient
          colors={["$blue9", "$blue8"]}
          start={[0, 0]}
          end={[1, 0]}
          padding="$3.5"
          borderBottomLeftRadius="$4"
          borderBottomRightRadius="$4"
        >
          <YStack>            
            <Button
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between"
              backgroundColor="rgba(255,255,255,0.2)"
              paddingHorizontal="$3.5"
              paddingVertical="$2"
              borderRadius="$4"
              hoverStyle={{ backgroundColor: "rgba(255,255,255,0.3)" }}
              pressStyle={{ backgroundColor: "rgba(255,255,255,0.4)" }}
              onPress={toggleViewMode}
            >
              <Text color="white" fontWeight="$6" fontSize="$3.5">
                {viewMode === "personal"
                  ? "Personal" 
                  : currentFamilySpace?.name || "Family"}
              </Text>
              <ChevronDown size={14} color="white" />
            </Button>
          </YStack>
        </LinearGradient>

        {/* Date Filter */}
        <Card 
          padding="$3.5" 
          marginHorizontal="$4" 
          marginTop="-$3.5" 
          marginBottom="$3.5" 
          backgroundColor="white" 
          borderRadius="$4"
          elevate
          shadowColor="rgba(0,0,0,0.08)"
          shadowRadius={6}
        >
          <Button
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
            chromeless
            onPress={() => setIsSheetOpen(true)}
          >
            <XStack alignItems="center" space="$2">
              <Calendar size={16} color="#6B7280" />
              <Text fontWeight="$6" fontSize="$3.5">{periodFilter}</Text>
            </XStack>
            <ChevronDown size={14} color="#6B7280" />
          </Button>
        </Card>

        {/* Categories/Trends Toggle */}
        <XStack 
          backgroundColor="white" 
          marginHorizontal="$4" 
          marginBottom="$3.5" 
          borderRadius="$4"
          shadowColor="rgba(0,0,0,0.06)"
          shadowRadius={4}
          shadowOffset={{ width: 0, height: 1 }}
          elevation={1}
          height={44}
          overflow="hidden"
        >
          <Button
            flex={1}
            backgroundColor={activeTab === "categories" ? "$blue9" : "transparent"}
            paddingVertical="$2"
            borderRadius={0}
            hoverStyle={{ opacity: 0.9 }}
            pressStyle={{ opacity: 0.8 }}
            onPress={() => setActiveTab("categories")}
          >
            <XStack alignItems="center" justifyContent="center" space="$2">
              <PieChart size={16} color={activeTab === "categories" ? "white" : "#6B7280"} />
              <Text
                textAlign="center"
                color={activeTab === "categories" ? "white" : "$gray10"}
                fontWeight="$6"
                fontSize="$3"
              >
                Categories
              </Text>
            </XStack>
          </Button>

          <Button
            flex={1}
            backgroundColor={activeTab === "trend" ? "$blue9" : "transparent"}
            paddingVertical="$2"
            borderRadius={0}
            hoverStyle={{ opacity: 0.9 }}
            pressStyle={{ opacity: 0.8 }}
            onPress={() => setActiveTab("trend")}
          >
            <XStack alignItems="center" justifyContent="center" space="$2">
              <BarChart2 size={16} color={activeTab === "trend" ? "white" : "#6B7280"} />
              <Text
                textAlign="center"
                color={activeTab === "trend" ? "white" : "$gray10"}
                fontWeight="$6"
                fontSize="$3"
              >
                Trends
              </Text>
            </XStack>
          </Button>
        </XStack>

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
            {activeTab === "categories" ? (
              <YStack>
                <EnhancedPieChart data={MOCK_CATEGORY_DATA} />
              </YStack>
            ) : (
              <YStack paddingTop="$1">
                <VictoryBarChart data={MOCK_MONTHLY_DATA} />
              </YStack>
            )}

            {/* Summary Card */}
            <Card 
              padding="$4" 
              borderRadius="$4" 
              backgroundColor="white" 
              elevate
              shadowColor="rgba(0,0,0,0.08)"
              shadowRadius={4}
            >
              <Text fontSize="$3.5" fontWeight="$7" marginBottom="$3" color="$gray12">
                Spending Summary
              </Text>
              
              <YStack space="$3">
                <XStack justifyContent="space-between" alignItems="center">
                  <Text fontSize="$3" color="$gray11">Total Expenses</Text>
                  <Text fontWeight="$7" fontSize="$4.5">¥4,600</Text>
                </XStack>
                
                <XStack justifyContent="space-between" alignItems="center">
                  <Text fontSize="$3" color="$gray11">Largest Category</Text>
                  <XStack alignItems="center" space="$1.5">
                    <Circle size="$2.5" backgroundColor="#EC4899" />
                    <Text fontWeight="$7" fontSize="$3.5">Shopping (33%)</Text>
                  </XStack>
                </XStack>
                
                <XStack justifyContent="space-between" alignItems="center">
                  <Text fontSize="$3" color="$gray11">Daily Average</Text>
                  <Text fontWeight="$7" fontSize="$3.5">¥153.33</Text>
                </XStack>
                
                <Separator marginVertical="$2" />
                
                <Button
                  backgroundColor="$gray1"
                  borderRadius="$3"
                  paddingVertical="$2"
                  hoverStyle={{ backgroundColor: "$gray2" }}
                  pressStyle={{ backgroundColor: "$gray3" }}
                  onPress={() => alert("Budget management feature coming soon")}
                >
                  <XStack justifyContent="space-between" alignItems="center" width="100%">
                    <Text fontWeight="$6" fontSize="$3">
                      {viewMode === "personal" ? "My Budget" : "Family Budget"}
                    </Text>
                    <XStack alignItems="center" space="$1">
                      <Text fontWeight="$7" fontSize="$3.5" color="$green9">¥2,400 left</Text>
                      <ArrowRight size={14} color="#10B981" />
                    </XStack>
                  </XStack>
                </Button>
              </YStack>
            </Card>
          </ScrollView>
        )}
      </YStack>
      
      {/* Time Filter Sheet */}
      <Sheet
        modal
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        snapPoints={[40]}
        position={40}
        dismissOnSnapToBottom
      >
        <Sheet.Overlay 
          backgroundColor="rgba(0,0,0,0.4)" 
          animation="lazy" 
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <Sheet.Frame padding="$4">
          <Sheet.Handle />
          <YStack>
            <Text fontSize="$4" fontWeight="$7" marginBottom="$3" color="$gray12">
              Select Time Period
            </Text>
            <YStack space="$2">
              {periods.map((period) => (
                <Button 
                  key={period}
                  backgroundColor={periodFilter === period ? "$blue2" : "transparent"}
                  paddingVertical="$3"
                  borderRadius="$3"
                  pressStyle={{ opacity: 0.7 }}
                  onPress={() => {
                    setPeriodFilter(period);
                    setIsSheetOpen(false);
                  }}
                >
                  <XStack justifyContent="space-between" alignItems="center" width="100%">
                    <Text 
                      fontSize="$3.5" 
                      fontWeight={periodFilter === period ? "$7" : "$5"}
                      color={periodFilter === period ? "$blue9" : "$gray11"}
                    >
                      {period}
                    </Text>
                    {periodFilter === period && (
                      <Circle size="$2.5" backgroundColor="$blue9" />
                    )}
                  </XStack>
                </Button>
              ))}
            </YStack>
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </SafeAreaView>
  );
}

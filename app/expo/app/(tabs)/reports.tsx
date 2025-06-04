import React, { useState, useEffect } from "react";
import {
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Calendar, ChevronDown } from "lucide-react-native";
import { 
  View, 
  Text, 
  Card, 
  Button, 
  XStack, 
  YStack, 
  Tabs,
  Circle,
  Sheet,
  H2,
  Separator
} from "tamagui";

import { useViewStore } from "@/stores/viewStore";
import { useAuth } from "@/providers/AuthProvider";

// In a real app, you would use a proper chart library like react-native-chart-kit
// This is a simple mock visualization for demo purposes
const SimplePieChart = ({
  data,
}: {
  data: { label: string; value: number; color: string }[];
}) => {
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <YStack alignItems="center" justifyContent="center" paddingVertical="$4">
      <View
        style={{
          position: "relative",
          width: 192,
          height: 192,
          borderRadius: 96,
          overflow: "hidden",
          borderWidth: 2,
          borderColor: "white"
        }}
      >
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
                transform: [{ rotate: `${startAngle}deg` }, { scale: 1 }],
                opacity: 1,
                zIndex: index,
              }}
            />
          );
        })}
      </View>

      <YStack marginTop="$6" width="100%">
        {data.map((item) => (
          <XStack
            key={item.label}
            alignItems="center"
            justifyContent="space-between"
            marginBottom="$2"
          >
            <XStack alignItems="center">
              <View
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  backgroundColor: item.color,
                  marginRight: 8
                }}
              />
              <Text>{item.label}</Text>
            </XStack>
            <XStack>
              <Text fontWeight="$6" marginRight="$2">
                ¥{item.value.toFixed(2)}
              </Text>
              <Text color="$gray10">
                ({((item.value / totalValue) * 100).toFixed(1)}%)
              </Text>
            </XStack>
          </XStack>
        ))}
      </YStack>
    </YStack>
  );
};

const SimpleBarChart = ({
  data,
}: {
  data: { label: string; value: number }[];
}) => {
  const maxValue = Math.max(...data.map((item) => item.value));
  const screenWidth = Dimensions.get("window").width - 40; // Account for padding

  return (
    <YStack marginTop="$4">
      {data.map((item) => (
        <YStack key={item.label} marginBottom="$4">
          <XStack justifyContent="space-between" marginBottom="$1">
            <Text fontSize="$2">{item.label}</Text>
            <Text fontSize="$2" fontWeight="$6">
              ¥{item.value.toFixed(2)}
            </Text>
          </XStack>
          <View 
            style={{
              height: 24, 
              backgroundColor: "#f3f4f6", 
              borderRadius: 9999,
              overflow: "hidden"
            }}
          >
            <View
              style={{
                height: "100%", 
                backgroundColor: "#3B82F6",
                borderRadius: 9999,
                width: `${(item.value / maxValue) * 100}%`
              }}
            />
          </View>
        </YStack>
      ))}
    </YStack>
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
  const [periodFilter, setPeriodFilter] = useState("This Month");

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <YStack flex={1}>
        <YStack padding="$4" borderBottomWidth={1} borderBottomColor="$gray4">
          <H2 marginBottom="$2">Reports</H2>

          <Button
            flexDirection="row"
            alignItems="center"
            backgroundColor="$gray3"
            paddingHorizontal="$4"
            paddingVertical="$2"
            borderRadius="$10"
            onPress={toggleViewMode}
          >
            <Text fontWeight="$6" marginRight="$1">
              {viewMode === "personal"
                ? "Personal"
                : currentFamilySpace?.name || "Family"}
            </Text>
            <ChevronDown size={16} color="#6B7280" />
          </Button>
        </YStack>

        <Card padding="$4" backgroundColor="$background">
          <Button
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
            chromeless
          >
            <XStack alignItems="center">
              <Calendar size={18} color="#6B7280" style={{ marginRight: 8 }} />
              <Text fontWeight="$6">{periodFilter}</Text>
            </XStack>
            <ChevronDown size={16} color="#6B7280" />
          </Button>
        </Card>

        <Tabs 
          defaultValue="categories"
          orientation="horizontal"
          flexDirection="column"
          flex={1}
          borderBottomWidth={1}
          borderBottomColor="$gray4"
        >
          <Tabs.List>
            <Tabs.Tab
              value="categories"
              flex={1}
              paddingVertical="$3"
              borderBottomWidth={activeTab === "categories" ? 2 : 0}
              borderBottomColor="$blue9"
              onPress={() => setActiveTab("categories")}
            >
              <Text
                textAlign="center"
                color={activeTab === "categories" ? "$blue9" : "$gray10"}
                fontWeight={activeTab === "categories" ? "$6" : "$4"}
              >
                Categories
              </Text>
            </Tabs.Tab>

            <Tabs.Tab
              value="trend"
              flex={1}
              paddingVertical="$3"
              borderBottomWidth={activeTab === "trend" ? 2 : 0}
              borderBottomColor="$blue9"
              onPress={() => setActiveTab("trend")}
            >
              <Text
                textAlign="center"
                color={activeTab === "trend" ? "$blue9" : "$gray10"}
                fontWeight={activeTab === "trend" ? "$6" : "$4"}
              >
                Trend
              </Text>
            </Tabs.Tab>
          </Tabs.List>

          {loading ? (
            <YStack flex={1} justifyContent="center" alignItems="center">
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text marginTop="$4" color="$gray10">Loading reports...</Text>
            </YStack>
          ) : (
            <ScrollView style={{ flex: 1 }}>
              {activeTab === "categories" ? (
                <YStack padding="$4">
                  <Text fontSize="$5" fontWeight="$6" marginBottom="$2">
                    Spending by Category
                  </Text>
                  <SimplePieChart data={MOCK_CATEGORY_DATA} />
                </YStack>
              ) : (
                <YStack padding="$4">
                  <Text fontSize="$5" fontWeight="$6" marginBottom="$2">
                    Monthly Spending Trend
                  </Text>
                  <SimpleBarChart data={MOCK_MONTHLY_DATA} />
                </YStack>
              )}

              <Card marginHorizontal="$4" padding="$4" marginTop="$2" marginBottom="$8">
                <Text fontSize="$5" fontWeight="$6" marginBottom="$4">
                  Summary
                </Text>
                <YStack space="$2">
                  <XStack justifyContent="space-between">
                    <Text>Total Spending</Text>
                    <Text fontWeight="$6">¥4,600</Text>
                  </XStack>
                  <XStack justifyContent="space-between">
                    <Text>Largest Category</Text>
                    <Text fontWeight="$6">Shopping (33%)</Text>
                  </XStack>
                  <XStack justifyContent="space-between">
                    <Text>Average Daily</Text>
                    <Text fontWeight="$6">¥153.33</Text>
                  </XStack>
                  <Separator marginVertical="$2" />
                  <XStack justifyContent="space-between">
                    <Text fontWeight="$6">
                      {viewMode === "personal" ? "My Budget" : "Family Budget"}
                    </Text>
                    <Text fontWeight="$6" color="$green9">¥2,400 left</Text>
                  </XStack>
                </YStack>
              </Card>
            </ScrollView>
          )}
        </Tabs>
      </YStack>
    </SafeAreaView>
  );
}

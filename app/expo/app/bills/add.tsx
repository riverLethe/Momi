import React, { useState, useEffect } from "react";
import {
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Calendar, Check } from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  View,
  Text,
  Button,
  XStack,
  YStack,
  Input,
  Label,
  Card,
  H4,
  Circle,
} from "tamagui";

import { useViewStore } from "@/stores/viewStore";
import { useAuth } from "@/providers/AuthProvider";

// Mock categories
const CATEGORIES = [
  { id: "1", name: "Food", icon: "🍔" },
  { id: "2", name: "Transport", icon: "🚗" },
  { id: "3", name: "Shopping", icon: "🛍️" },
  { id: "4", name: "Entertainment", icon: "🎬" },
  { id: "5", name: "Health", icon: "💊" },
  { id: "6", name: "Housing", icon: "🏠" },
  { id: "7", name: "Other", icon: "📦" },
];

// Mock accounts
const ACCOUNTS = [
  { id: "1", name: "Cash", icon: "💵" },
  { id: "2", name: "Credit Card", icon: "💳" },
  { id: "3", name: "Debit Card", icon: "💲" },
  { id: "4", name: "WeChat Pay", icon: "📱" },
  { id: "5", name: "Alipay", icon: "📱" },
];

export default function AddBillScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { viewMode, currentFamilySpace } = useViewStore();
  const { isLoggedIn, user } = useAuth();

  // Check if family mode is accessible
  useEffect(() => {
    if (viewMode === "family" && !isLoggedIn) {
      Alert.alert(
        "Login Required",
        "You need to login to record family bills.",
        [
          { text: "Continue as personal", onPress: () => router.back() },
          { text: "Login", onPress: () => router.push("/auth/login") },
        ]
      );
    }
  }, [viewMode, isLoggedIn]);

  // Form state
  const [amount, setAmount] = useState(params.amount?.toString() || "");
  const [selectedCategory, setSelectedCategory] = useState(
    params.category?.toString() || ""
  );
  const [selectedAccount, setSelectedAccount] = useState("");
  const [merchant, setMerchant] = useState(params.merchant?.toString() || "");
  const [notes, setNotes] = useState(params.notes?.toString() || "");
  const [date, setDate] = useState(
    params.date ? new Date(params.date.toString()) : new Date()
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSave = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    if (!selectedCategory) {
      Alert.alert("Error", "Please select a category");
      return;
    }

    // Here you would typically save the bill to your backend
    // For now, we'll just show a success message
    Alert.alert("Success", "Bill saved successfully!", [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === "ios");
    setDate(currentDate);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <XStack 
        alignItems="center" 
        justifyContent="space-between" 
        padding="$4" 
        borderBottomWidth={1} 
        borderBottomColor="$gray4"
      >
        <Button 
          chromeless
          padding="$0"
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1F2937" />
        </Button>

        <H4>
          {viewMode === "family"
            ? `Add Bill for ${currentFamilySpace?.name || "Family"}`
            : "Add Personal Bill"}
        </H4>

        <Button 
          chromeless
          padding="$0" 
          onPress={handleSave}
        >
          <Check size={24} color="#3B82F6" />
        </Button>
      </XStack>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {/* Amount Input */}
        <YStack marginBottom="$6">
          <Label color="$gray10" marginBottom="$2">Amount</Label>
          <XStack 
            alignItems="center" 
            backgroundColor="$background" 
            borderRadius="$4" 
            padding="$4" 
            borderWidth={1} 
            borderColor="$gray4"
          >
            <Text fontSize="$5" marginRight="$2">¥</Text>
            <Input
              flex={1}
              fontSize="$5"
              keyboardType="numeric"
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
              borderWidth={0}
              paddingLeft="$0"
              backgroundColor="transparent"
            />
          </XStack>
        </YStack>

        {/* Category Selector */}
        <YStack marginBottom="$6">
          <Label color="$gray10" marginBottom="$2">Category</Label>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 8 }}
          >
            {CATEGORIES.map((category) => (
              <Button
                key={category.id}
                marginRight="$3"
                alignItems="center"
                opacity={selectedCategory === category.name ? 1 : 0.5}
                onPress={() => setSelectedCategory(category.name)}
                backgroundColor="transparent"
                padding="$0"
              >
                <Circle
                  size="$7"
                  marginBottom="$1"
                  backgroundColor={selectedCategory === category.name ? "$blue9" : "$gray3"}
                >
                  <Text fontSize="$7">{category.icon}</Text>
                </Circle>
                <Text
                  fontSize="$2"
                  color={selectedCategory === category.name ? "$blue9" : "$gray10"}
                  fontWeight={selectedCategory === category.name ? "$6" : "$4"}
                >
                  {category.name}
                </Text>
              </Button>
            ))}
          </ScrollView>
        </YStack>

        {/* Account Selector (only for personal bills) */}
        {viewMode === "personal" && (
          <YStack marginBottom="$6">
            <Label color="$gray10" marginBottom="$2">Account</Label>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 8 }}
            >
              {ACCOUNTS.map((account) => (
                <Button
                  key={account.id}
                  marginRight="$3"
                  alignItems="center"
                  opacity={selectedAccount === account.name ? 1 : 0.5}
                  onPress={() => setSelectedAccount(account.name)}
                  backgroundColor="transparent"
                  padding="$0"
                >
                  <Circle
                    size="$6"
                    marginBottom="$1"
                    backgroundColor={selectedAccount === account.name ? "$purple9" : "$gray3"}
                  >
                    <Text fontSize="$5">{account.icon}</Text>
                  </Circle>
                  <Text
                    fontSize="$1"
                    color={selectedAccount === account.name ? "$purple9" : "$gray10"}
                    fontWeight={selectedAccount === account.name ? "$6" : "$4"}
                  >
                    {account.name}
                  </Text>
                </Button>
              ))}
            </ScrollView>
          </YStack>
        )}

        {/* Date Picker */}
        <YStack marginBottom="$6">
          <Label color="$gray10" marginBottom="$2">Date</Label>
          <Button
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
            backgroundColor="$background"
            borderRadius="$4"
            padding="$4"
            borderWidth={1}
            borderColor="$gray4"
            onPress={() => setShowDatePicker(true)}
          >
            <Text>{date.toLocaleDateString()}</Text>
            <Calendar size={20} color="#6B7280" />
          </Button>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={onDateChange}
            />
          )}
        </YStack>

        {/* Merchant Input */}
        <YStack marginBottom="$6">
          <Label color="$gray10" marginBottom="$2">Merchant (Optional)</Label>
          <Input
            backgroundColor="$background"
            borderRadius="$4"
            padding="$4"
            borderWidth={1}
            borderColor="$gray4"
            placeholder="Enter merchant name"
            value={merchant}
            onChangeText={setMerchant}
          />
        </YStack>

        {/* Notes Input */}
        <YStack marginBottom="$6">
          <Label color="$gray10" marginBottom="$2">Notes (Optional)</Label>
          <Input
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            backgroundColor="$background"
            borderRadius="$4"
            padding="$4"
            borderWidth={1}
            borderColor="$gray4"
            placeholder="Add additional notes"
            value={notes}
            onChangeText={setNotes}
            height={100}
          />
        </YStack>

        {/* Save Button */}
        <Button
          backgroundColor="$blue9"
          borderRadius="$4"
          padding="$4"
          marginTop="$4"
          marginBottom="$10"
          onPress={handleSave}
        >
          <Text color="white" fontWeight="$6" fontSize="$5" textAlign="center">
            Save Bill
          </Text>
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

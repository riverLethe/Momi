import React, { useState, useEffect, useCallback } from "react";
import { Platform, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { YStack, XStack, Button, Text, Input, ScrollView } from "tamagui";
import {
  Calendar as CalendarIcon,
  Delete as DeleteIcon,
  ChevronLeft as ChevronLeftIcon,
  Camera as CameraIcon,
  Plus as PlusIcon,
  Minus as MinusIcon,
  Equal as EqualIcon,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import DateTimePicker from "@react-native-community/datetimepicker";

import { useAuth } from "@/providers/AuthProvider";
import { useData } from "@/providers/DataProvider";
import { useViewStore } from "@/stores/viewStore";
import { saveBill, getBills, updateBill } from "@/utils/bills.utils";
import {
  EXPENSE_CATEGORIES,
  getCategoryIcon,
} from "@/constants/categories";

// Memoised category icon to avoid re-renders
const CategoryIcon = React.memo(({ categoryId }: { categoryId: string }) => {
  const IconComponent = getCategoryIcon(categoryId);
  return <IconComponent size={24} color="#333" />;
});

// Category item extracted for render-level memoization
interface CategoryItemProps {
  category: {
    id: string;
    name: string;
    color: string;
    lightColor: string;
  };
  label: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const CategoryItem: React.FC<CategoryItemProps> = React.memo(
  ({ category, label, isSelected, onSelect }) => {
    const handlePress = useCallback(() => onSelect(category.id), [onSelect, category.id]);

    return (
      <YStack
        ai="center"
        gap="$2"
        p="$2"
        w="25%"
        onPress={handlePress}
      >
        <YStack
          ai="center"
          jc="center"
          w={56}
          h={56}
          borderRadius="$10"
          bg={isSelected ? category.lightColor : "$gray5"}
          borderWidth={1}
          borderColor={isSelected ? category.color : "transparent"}
        >
          <CategoryIcon categoryId={category.id} />
        </YStack>
        <Text fontSize="$2" ta="center">
          {label}
        </Text>
      </YStack>
    );
  },
  (prev, next) => prev.isSelected === next.isSelected // Re-render only if selection state changes
);

export default function AddBillScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const billId = typeof params.id === "string" ? params.id : "";
  const { refreshData } = useData();
  const { user } = useAuth();
  const { viewMode, currentFamilySpace } = useViewStore();

  const [amount, setAmount] = useState("0");
  const [notes, setNotes] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(
    EXPENSE_CATEGORIES[0]?.id || ""
  );
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Calculator state
  const [firstOperand, setFirstOperand] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [shouldResetDisplay, setShouldResetDisplay] = useState(false);

  // Load bill data if editing
  useEffect(() => {
    if (!billId) return;
    setIsEditing(true);
    const loadBillData = async () => {
      try {
        const bills = await getBills();
        const bill = bills.find((b) => b.id === billId);
        if (bill) {
          setAmount(bill.amount.toString());
          setSelectedCategory(bill.category);
          setNotes(bill.notes || "");
          setSelectedDate(new Date(bill.date));
        }
      } catch (error) {
        console.error("Failed to load bill for editing:", error);
      }
    };
    loadBillData();
  }, [billId]);

  const handleDateChange = (_event: any, date?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (date) setSelectedDate(date);
  };

  // Calculator helpers
  const calculate = (first: number, second: number, op: string): number => {
    switch (op) {
      case "+":
        return first + second;
      case "-":
        return first - second;
      default:
        return second;
    }
  };

  const handleKeypadPress = (key: string) => {
    if (amount.length >= 8 && !shouldResetDisplay) return;

    if (shouldResetDisplay) {
      setAmount(key === "." ? "0." : key);
      setShouldResetDisplay(false);
      return;
    }

    if (key === ".") {
      if (!amount.includes(".")) setAmount(amount + ".");
      return;
    }

    if (amount.includes(".") && amount.split(".")[1].length >= 2) return;
    if (amount === "0") setAmount(key);
    else setAmount(amount + key);
  };

  const handleDeletePress = () => {
    if (shouldResetDisplay && operator) {
      setOperator(null);
      setShouldResetDisplay(false);
      return;
    }

    if (operator && !shouldResetDisplay) {
      if (amount.length > 1) {
        setAmount(amount.slice(0, -1));
      } else {
        setShouldResetDisplay(true);
        if (firstOperand !== null) {
          setAmount(String(firstOperand));
        }
      }
      return;
    }

    setAmount(amount.length > 1 ? amount.slice(0, -1) : "0");
    if (shouldResetDisplay) {
      setShouldResetDisplay(false);
    }
  };

  const handleOperatorPress = (op: string) => {
    if (firstOperand !== null && operator && !shouldResetDisplay) {
      const currentResult = calculate(firstOperand, parseFloat(amount), operator);
      setFirstOperand(currentResult);
      setAmount(String(currentResult));
    } else {
      setFirstOperand(parseFloat(amount));
    }
    setOperator(op);
    setShouldResetDisplay(true);
  };

  const handleCalculate = () => {
    if (firstOperand === null || operator === null || shouldResetDisplay) return;
    const result = calculate(firstOperand, parseFloat(amount), operator);
    setAmount(String(result.toFixed(2)));
    setFirstOperand(null);
    setOperator(null);
    setShouldResetDisplay(true);
  };

  // Placeholder for future receipt scanning
  const handleScanReceipt = () => { };

  const handleSave = async () => {
    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      alert(t("Please enter a valid amount."));
      return;
    }

    setIsSaving(true);
    try {
      const billData = {
        amount: numericAmount,
        category: selectedCategory,
        date: selectedDate,
        merchant: "",
        notes: notes,
        account: "Default",
        isFamilyBill: viewMode === "family",
        familyId: viewMode === "family" ? currentFamilySpace?.id : undefined,
        familyName: viewMode === "family" ? currentFamilySpace?.name : undefined,
      } as const;

      if (isEditing) await updateBill(billId, billData);
      else await saveBill(billData, user || { id: "local-user", name: "Local User" });

      // Refresh data asynchronously to keep UI responsive
      setTimeout(async () => {
        try {
          await refreshData();
        } catch (err) {
          console.warn("Background data refresh failed:", err);
        }
      }, 50);

      router.back();
    } catch (error) {
      console.error("Failed to save bill:", error);
      alert(t("Failed to save bill. Please try again."));
    } finally {
      setIsSaving(false);
    }
  };

  // Helpers for UI
  const getDisplayString = () => {
    if (operator && firstOperand !== null) {
      if (shouldResetDisplay) return `${firstOperand} ${operator}`;
      return `${firstOperand} ${operator} ${amount}`;
    }
    return amount;
  };
  const displayString = getDisplayString();
  const showEquals = operator && !shouldResetDisplay;

  const getFontSize = (text: string) => {
    if (text.length > 15) return "$5";
    if (text.length > 10) return "$6";
    return "$7";
  };

  // Render keypad - memoised for performance
  const renderKeypad = useCallback(
    () => (
      <XStack p="$2" gap="$2">
        <YStack f={3} gap="$2">
          <XStack gap="$2">
            {["1", "2", "3"].map((k) => (
              <Button key={k} f={1} onPress={() => handleKeypadPress(k)} size="$5">
                <Text fontSize="$6">{k}</Text>
              </Button>
            ))}
          </XStack>
          <XStack gap="$2">
            {["4", "5", "6"].map((k) => (
              <Button key={k} f={1} onPress={() => handleKeypadPress(k)} size="$5">
                <Text fontSize="$6">{k}</Text>
              </Button>
            ))}
          </XStack>
          <XStack gap="$2">
            {["7", "8", "9"].map((k) => (
              <Button key={k} f={1} onPress={() => handleKeypadPress(k)} size="$5">
                <Text fontSize="$6">{k}</Text>
              </Button>
            ))}
          </XStack>
          <XStack gap="$2">
            <Button f={1} onPress={() => handleKeypadPress(".")} size="$5">
              <Text fontSize="$6">.</Text>
            </Button>
            <Button f={1} onPress={() => handleKeypadPress("0")} size="$5">
              <Text fontSize="$6">0</Text>
            </Button>
            <Button f={1} icon={<DeleteIcon size={24} color="#333" />} onPress={handleDeletePress} size="$5" />
          </XStack>
        </YStack>
        <YStack f={1} gap="$2">
          <Button f={1} icon={<CalendarIcon size={24} color="#333" />} onPress={() => setShowDatePicker(true)} size="$5" />
          <Button f={1} icon={<PlusIcon size={24} color="#333" />} onPress={() => handleOperatorPress("+")} size="$5" />
          <Button f={1} icon={<MinusIcon size={24} color="#333" />} onPress={() => handleOperatorPress("-")} size="$5" />
          <Button f={1} theme="active" onPress={showEquals ? handleCalculate : handleSave} disabled={isSaving} size="$5" bg="$blue10">
            {showEquals ? <EqualIcon size={24} color="white" /> : <Text color="white" fontWeight="bold">{t("Done")}</Text>}
          </Button>
        </YStack>
      </XStack>
    ),
    [amount, shouldResetDisplay, operator, firstOperand, isSaving]
  );

  // Stable callback for category selection
  const handleSelect = useCallback((id: string) => {
    setSelectedCategory(id);
  }, []);

  return (
    <YStack f={1} bg="$background">
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={{ flex: 1 }}>
        <YStack f={1}>
          {/* Header */}
          <XStack p="$3">
            <Button chromeless icon={<ChevronLeftIcon size={24} color="#333" />} onPress={() => router.back()} />
          </XStack>

          {/* Category selector */}
          <ScrollView>
            <YStack gap="$3" p="$3">
              <XStack flexWrap="wrap" jc="flex-start" ai="center">
                {EXPENSE_CATEGORIES.map((category) => (
                  <CategoryItem
                    key={category.id}
                    category={category}
                    label={t(category.name)}
                    isSelected={selectedCategory === category.id}
                    onSelect={handleSelect}
                  />
                ))}
              </XStack>
            </YStack>
          </ScrollView>

          {/* Amount & notes + keypad */}
          <YStack p="$2" bg="white">
            <YStack p="$2" gap="$3">
              <Text fontSize={getFontSize(displayString)} fontWeight="bold" textAlign="right">
                {displayString}
              </Text>
              <XStack gap="$2" ai="center">
                <Input
                  f={1}
                  placeholder={t("Notes")}
                  value={notes}
                  onChangeText={setNotes}
                  size="$4"
                  bg="$gray5"
                />
                <Button icon={<CameraIcon size={24} color="#333" />} onPress={handleScanReceipt} />
              </XStack>
            </YStack>
            {renderKeypad()}
          </YStack>
        </YStack>

        {/* Date picker */}
        {Platform.OS === "ios" && (
          <Modal transparent visible={showDatePicker} animationType="slide">
            <YStack f={1} jc="flex-end">
              <YStack bg="$background" btrr="$6" btlr="$6" p="$4" space>
                <XStack jc="flex-end">
                  <Button onPress={() => setShowDatePicker(false)}>{t("Done")}</Button>
                </XStack>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                />
              </YStack>
            </YStack>
          </Modal>
        )}
        {Platform.OS === "android" && showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}
      </SafeAreaView>
    </YStack>
  );
}

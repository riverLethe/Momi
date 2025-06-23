import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Alert,
  ActivityIndicator,
  Pressable,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { ChevronLeft, Trash2 } from "lucide-react-native";
import {
  Text,
  Button,
  XStack,
  YStack,
  Card,
  Separator,
  ScrollView,
  Avatar,
  Input,
  Sheet,
} from "tamagui";
import { useTranslation } from "react-i18next";

import { Bill } from "@/types/bills.types";
import { getCategoryById, getCategoryIcon } from "@/constants/categories";
import { getBills } from "@/utils/bills.utils";
import { useLocale } from "@/i18n/useLocale";
import CategorySelectSheet from "@/components/ui/CategorySelectSheet";
import AmountInputSheet from "@/components/ui/AmountInputSheet";
import DatePickerSheet from "@/components/ui/DatePickerSheet";
import { useBillActions } from "@/hooks/useBillActions";
import { formatCurrency } from "@/utils/format";
import { useData } from "@/providers/DataProvider";

export default function BillDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id } = params;
  const { t } = useTranslation();
  const { locale } = useLocale();

  const [activeSheet, setActiveSheet] = useState<
    "date" | "category" | "amount" | null
  >(null);
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState(false);
  const [merchantText, setMerchantText] = useState("");
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState("");
  const { confirmDeleteBill, updateBillField } = useBillActions();
  const { refreshData } = useData();

  // Track whether any field has been modified so we refresh once on exit
  const hasChangesRef = useRef(false);

  // long-press handlers
  const onMerchantLongPress = () => setEditingMerchant(true);
  const onNotesLongPress = () => setEditingNotes(true);
  const [changeUuid, setChangeUuid] = useState(0);

  // 从本地存储加载账单详情
  useEffect(() => {
    const loadBill = async () => {
      try {
        setLoading(true);
        const bills = await getBills();
        const foundBill = bills.find((b) => b.id === id);

        if (foundBill) {
          setBill(foundBill);
        } else {
          // 如果找不到账单，返回上一页
          Alert.alert(t("Error"), t("Bill not found"));
          router.back();
        }
      } catch (error) {
        console.error("Failed to load bill:", error);
        Alert.alert(t("Error"), t("Failed to load bill"));
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadBill();
    }
  }, [id, t]);

  useEffect(() => {
    if (bill) {
      setMerchantText(bill.merchant || "");
      setNotesText(bill.notes || "");
    }
  }, [bill]);

  const handleDeletePress = () => {
    if (!bill) return;

    setUpdating(true);
    confirmDeleteBill(bill, {
      onSuccess: () => {
        hasChangesRef.current = true; // deletion changes list too
        setUpdating(false);
        router.back();
      },
      onError: () => {
        setUpdating(false);
        Alert.alert(t("Error"), t("Failed to delete bill"));
      },
      ignoreRefresh: true,
    });
  };

  const handleCategoryChange = async (categoryId: string) => {
    if (!bill) return;
    // 只有当分类实际变化时才更新
    if (bill.category === categoryId) {
      setActiveSheet(null);
      return;
    }
    setUpdating(true);
    updateBillField(bill, "category", categoryId, {
      onSuccess: (updated) => {
        setBill(updated);
        setUpdating(false);
        setChangeUuid(prev => prev + 1);
        hasChangesRef.current = true;
      },
      onError: () => setUpdating(false),
      ignoreRefresh: true,
    });
  };

  const handleUpdateField = async (field: keyof Bill, value: any) => {
    if (!bill) return;
    // 只有当值实际变化时才更新
    if (bill[field] === value) {
      return;
    }
    setUpdating(true);
    updateBillField(bill, field, value, {
      onSuccess: (updated) => {
        setBill(updated);
        setUpdating(false);
        setChangeUuid(prev => prev + 1);
        hasChangesRef.current = true;
      },
      onError: () => setUpdating(false),
      ignoreRefresh: true,
    });
  };

  // Memoize derived values to avoid recalculations on every render
  const category = useMemo(() => (bill ? getCategoryById(bill!.category) : null), [bill]);
  const CategoryIcon = useMemo(() => (bill ? getCategoryIcon(bill!.category) : () => null), [bill]);
  const formattedAmount = useMemo(() => (bill ? formatCurrency(bill!.amount) : ""), [bill]);

  // On unmount, refresh global data once if needed
  useEffect(() => {
    return () => {
      if (hasChangesRef.current) {
        refreshData().catch(() => { });
      }
    };
  }, []);

  if (loading) {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
          <Stack.Screen options={{ headerShown: false }} />
          <YStack flex={1} justifyContent="center" alignItems="center">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text marginTop="$4" color="$gray10">
              {t("Loading bill information...")}
            </Text>
          </YStack>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    );
  }

  if (!bill) {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
          <Stack.Screen options={{ headerShown: false }} />
          <YStack
            flex={1}
            justifyContent="center"
            alignItems="center"
            padding="$4"
          >
            <Text fontSize="$5" fontWeight="$6" textAlign="center">
              {t("Bill does not exist or has been deleted")}
            </Text>
            <Button marginTop="$4" onPress={() => router.back()}>
              {t("Return to Bills List")}
            </Button>
          </YStack>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />

        <YStack flex={1}>
          {/* 自定义标题栏 */}
          <XStack
            height="$5"
            paddingHorizontal="$4"
            alignItems="center"
            justifyContent="space-between"
            backgroundColor="white"
            borderBottomWidth={1}
            borderBottomColor="$gray4"
          >
            <Button size="$3" circular chromeless onPress={() => router.back()}>
              <ChevronLeft size={20} color="#64748B" />
            </Button>

            <Text fontSize="$4" fontWeight="$6">
              {t("Bill Details")}
            </Text>

            <XStack gap="$2">
              <Button
                size="$3"
                circular
                chromeless
                onPress={handleDeletePress}
                disabled={updating}
              >
                <Trash2 size={20} color={updating ? "#FCA5A5" : "#ef4444"} />
              </Button>
            </XStack>
          </XStack>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior="padding"
            keyboardVerticalOffset={60}
          >
            <ScrollView flex={1} contentContainerStyle={{ padding: 16 }}>
              {/* 金额卡片 */}
              <Card
                padding="$5"
                marginTop="$2"
                marginBottom="$4"
                backgroundColor={category!.color}
                elevate
              >
                <Text
                  fontSize="$3"
                  fontWeight="$5"
                  color="white"
                  opacity={0.85}
                >
                  {t("Expense Amount")}
                </Text>
                <Button
                  chromeless
                  padding="$0"
                  backgroundColor="transparent"
                  onPress={() => setActiveSheet("amount")}
                  disabled={updating}
                  pressStyle={{
                    backgroundColor: "transparent",
                    borderColor: "transparent",
                    opacity: 0.5,
                  }}
                  hitSlop={10}
                  justifyContent="flex-start"
                  height="auto"

                >
                  <Text
                    fontSize="$10"
                    fontWeight="$8"
                    color="white"
                    marginTop="$2"
                  >
                    {formattedAmount}
                  </Text>
                </Button>
                <XStack justifyContent="space-between" marginTop="$4">
                  <Text
                    fontSize="$3"
                    fontWeight="$5"
                    color="white"
                    opacity={0.85}
                  >
                    {bill.merchant || t("-")}
                  </Text>
                  <Text
                    fontSize="$3"
                    fontWeight="$5"
                    color="white"
                    opacity={0.85}
                  >
                    {new Date(bill.updatedAt).toLocaleString(locale, {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </XStack>
              </Card>

              {/* 详细信息 */}
              <Card backgroundColor="white" elevate>
                <YStack padding="$4" gap="$4">
                  <XStack justifyContent="space-between" alignItems="center">
                    <Text color="$gray10" fontSize="$3">
                      {t("Category")}
                    </Text>
                    <Button
                      chromeless
                      padding="$0"
                      backgroundColor="transparent"
                      onPress={() => setActiveSheet("category")}
                      disabled={updating}
                      pressStyle={{
                        backgroundColor: "transparent",
                        borderColor: "transparent",
                        opacity: 0.5,
                      }}
                    >
                      <XStack alignItems="center" gap="$2">
                        <Avatar
                          circular
                          size="$3"
                          backgroundColor={`${category!.color}20`}
                        >
                          <CategoryIcon size={14} color={category!.color} />
                        </Avatar>
                        <Text fontSize="$3" fontWeight="$6">
                          {t(category!.name)}
                        </Text>
                      </XStack>
                    </Button>
                  </XStack>

                  <Separator />

                  <XStack
                    justifyContent="space-between"
                    alignItems="center"
                    gap="$3"
                    height="$1"
                  >
                    <Text color="$gray10" fontSize="$3">
                      {t("Merchant")}
                    </Text>
                    {editingMerchant ? (
                      <XStack f={1} position="absolute" right="$0">
                        <Input
                          autoFocus
                          f={1}
                          value={merchantText}
                          onChangeText={setMerchantText}
                          onBlur={() => {
                            setEditingMerchant(false);
                            handleUpdateField("merchant", merchantText);
                          }}
                          size="$3"
                          placeholder={t("Enter merchant name")}
                          width="$15"
                        />
                      </XStack>
                    ) : (
                      <Pressable onPress={onMerchantLongPress}>
                        <Text
                          fontSize="$3"
                          fontWeight="$6"
                          color={!bill.merchant ? "$gray6" : "$gray800"}
                        >
                          {bill.merchant || t("No content")}
                        </Text>
                      </Pressable>
                    )}
                  </XStack>

                  <Separator />

                  {/* Record Time (editable) */}
                  <XStack justifyContent="space-between" alignItems="center">
                    <Text color="$gray10" fontSize="$3">
                      {t("Record Time")}
                    </Text>
                    <Button
                      chromeless
                      padding="$0"
                      backgroundColor="transparent"
                      onPress={() => setActiveSheet("date")}
                      disabled={updating}
                      pressStyle={{
                        backgroundColor: "transparent",
                        borderColor: "transparent",
                        opacity: 0.5,
                      }}
                    > <Text fontSize="$3" fontWeight="$6">
                        {new Date(bill.date).toLocaleDateString(locale, {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        })}
                      </Text></Button>
                  </XStack>

                  <Separator />

                  <YStack gap="$2">
                    <Text color="$gray10" fontSize="$3">
                      {t("Notes")}
                    </Text>
                    {editingNotes ? (
                      <Input
                        autoFocus
                        multiline={false}
                        value={notesText}
                        onChangeText={setNotesText}
                        onBlur={() => {
                          setEditingNotes(false);
                          handleUpdateField("notes", notesText);
                        }}
                        size="$3"
                        placeholder={t("Enter notes...")}
                      />
                    ) : (
                      <Pressable onPress={onNotesLongPress}>
                        <Text
                          fontSize="$3"
                          color={!bill.notes ? "$gray6" : "$gray800"}
                          height="$3"
                          lineHeight="$6"
                        >
                          {bill.notes || t("No content")}
                        </Text>
                      </Pressable>
                    )}
                  </YStack>
                </YStack>
              </Card>
            </ScrollView>
          </KeyboardAvoidingView>
        </YStack>


        <DatePickerSheet
          open={activeSheet === "date"}
          onOpenChange={(open: boolean) => {
            if (!open) setActiveSheet(null);
          }}
          initialDate={new Date(bill.date)}
          onConfirm={(date) => handleUpdateField("date", date)}
          key={`date-${changeUuid}`}
        />
        <CategorySelectSheet
          isOpen={activeSheet === "category"}
          setIsOpen={(open: boolean) => {
            if (!open) setActiveSheet(null);
          }}
          selectedCategory={bill.category}
          onCategoryChange={handleCategoryChange}
          key={`category-${changeUuid}`}
        />

        <AmountInputSheet
          open={activeSheet === "amount"}
          onOpenChange={(open: boolean) => {
            if (!open) setActiveSheet(null);
          }}
          initialAmount={bill.amount}
          onSubmit={(val) => handleUpdateField("amount", val)}
          key={`amount-${changeUuid}`}
        />
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

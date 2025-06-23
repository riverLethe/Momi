import React, { useState, useEffect, useRef } from "react";
import {
  Alert,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { Text, Button, YStack } from "tamagui";
import { useTranslation } from "react-i18next";

import { Bill } from "@/types/bills.types";
import { getBills } from "@/utils/bills.utils";
import { useLocale } from "@/i18n/useLocale";
import { useBillActions } from "@/hooks/useBillActions";
import { useData } from "@/providers/DataProvider";

// 导入拆分的组件
import BillDetailHeader from "@/components/bills/details/BillDetailHeader";
import BillAmountCard from "@/components/bills/details/BillAmountCard";
import BillDetailsCard from "@/components/bills/details/BillDetailsCard";
import CategorySelectSheet from "@/components/ui/CategorySelectSheet";
import AmountInputSheet from "@/components/ui/AmountInputSheet";
import DatePickerSheet from "@/components/ui/DatePickerSheet";

export default function BillDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id } = params;
  const { t } = useTranslation();
  const { locale } = useLocale();

  // 状态管理
  const [activeSheet, setActiveSheet] = useState<
    "date" | "category" | "amount" | null
  >(null);
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [changeUuid, setChangeUuid] = useState(0);

  // 工具函数
  const { confirmDeleteBill, updateBillField } = useBillActions();
  const { refreshData } = useData();

  // Track whether any field has been modified so we refresh once on exit
  const hasChangesRef = useRef(false);

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

  // 删除账单处理
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

  // 更新分类处理
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

  // 更新字段通用处理
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

  // On unmount, refresh global data once if needed
  useEffect(() => {
    return () => {
      if (hasChangesRef.current) {
        refreshData().catch(() => { });
      }
    };
  }, []);

  // Sheet打开处理器
  const handleOpenCategorySheet = () => setActiveSheet("category");
  const handleOpenDateSheet = () => setActiveSheet("date");
  const handleOpenAmountSheet = () => setActiveSheet("amount");

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
        <Stack.Screen options={{ headerShown: false }} />

        <YStack flex={1}>
          {/* 标题栏 */}
          <BillDetailHeader
            onBack={() => router.back()}
            onDelete={handleDeletePress}
            updating={updating}
          />

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior="padding"
            keyboardVerticalOffset={60}
          >
            {/* 内容区域 */}
            <YStack flex={1} padding="$4">
              {/* 金额卡片 */}
              <BillAmountCard
                bill={bill}
                updating={updating}
                onUpdateField={handleUpdateField}
                onOpenAmountSheet={handleOpenAmountSheet}
                locale={locale}
                changeUuid={changeUuid}
              />

              {/* 详情卡片 */}
              <BillDetailsCard
                bill={bill}
                updating={updating}
                onUpdateField={handleUpdateField}
                onOpenCategorySheet={handleOpenCategorySheet}
                onOpenDateSheet={handleOpenDateSheet}
                locale={locale}
                changeUuid={changeUuid}
              />
            </YStack>
          </KeyboardAvoidingView>
        </YStack>

        {/* 底部弹窗 */}
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

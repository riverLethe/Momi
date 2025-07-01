import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Alert,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, Stack, useFocusEffect } from "expo-router";
import { Text, Button, YStack, useTheme } from "tamagui";
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

// 账单详情缓存 - 优化缓存策略
const billDetailsCache: Record<string, {
  bill: Bill;
  timestamp: number;
}> = {};

// 缓存有效期设置为5分钟
const CACHE_DURATION = 5 * 60 * 1000;

export default function BillDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id } = params;
  const { t } = useTranslation();
  const { locale } = useLocale();
  const theme = useTheme();

  // 状态管理
  const [activeSheet, setActiveSheet] = useState<
    "date" | "category" | "amount" | null
  >(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [updating, setUpdating] = useState(false);
  const [changeUuid, setChangeUuid] = useState(0);
  const [bill, setBill] = useState<Bill | null>(null);

  // 工具函数
  const { confirmDeleteBill, updateBillField } = useBillActions();
  const { refreshData, bills } = useData();

  // Track whether any field has been modified so we refresh once on exit
  const hasChangesRef = useRef(false);
  const isMounted = useRef(true);

  // 优化数据加载逻辑
  useFocusEffect(
    React.useCallback(() => {
      const loadBillDetails = async () => {
        if (!id) return;

        // 优先从全局状态中查找账单 - 最快的方式
        if (bills.length > 0) {
          const foundBill = bills.find((b) => b.id === id);
          if (foundBill) {
            // 当本地 bill 不存在或全局 bill 更新更晚时才覆盖
            const localUpdatedAt = bill ? new Date(bill.updatedAt).getTime() : 0;
            const globalUpdatedAt = foundBill.updatedAt
              ? new Date(foundBill.updatedAt).getTime()
              : 0;

            if (!bill || globalUpdatedAt >= localUpdatedAt) {
              setBill(foundBill);
              // 更新缓存
              billDetailsCache[id as string] = {
                bill: foundBill,
                timestamp: Date.now(),
              };
            }
            return;
          }
        }

        // 检查缓存是否有效
        const cachedBill = billDetailsCache[id as string];
        if (cachedBill && Date.now() - cachedBill.timestamp < CACHE_DURATION) {
          setBill(cachedBill.bill);
          return;
        }

        // 只在没有数据时显示loading
        if (!bill) {
          setLoading(true);
        }

        try {
          // 从存储中查找
          const allBills = await getBills();
          const foundBill = allBills.find((b) => b.id === id);
          if (foundBill) {
            setBill(foundBill);
            // 更新缓存
            billDetailsCache[id as string] = {
              bill: foundBill,
              timestamp: Date.now()
            };
          } else {
            setBill(null);
          }
        } catch (error) {
          console.error("Failed to fetch bill:", error);
        } finally {
          if (isMounted.current) {
            setLoading(false);
          }
        }
      };

      loadBillDetails();

      return () => {
        // 页面失去焦点时更新缓存时间戳
        if (bill && id) {
          billDetailsCache[id as string] = {
            bill,
            timestamp: Date.now()
          };
        }
      };
    }, [id, bills])
  );

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (hasChangesRef.current) {
        // 延迟刷新以避免阻塞导航
        setTimeout(() => {
          refreshData().catch(() => { });
        }, 100);
      }
    };
  }, [refreshData]);

  // 删除账单处理 - 优化删除操作
  const handleDeletePress = useCallback(() => {
    if (!bill) return;

    setUpdating(true);
    confirmDeleteBill(bill, {
      onSuccess: () => {
        hasChangesRef.current = true;
        setUpdating(false);
        // 删除缓存
        if (id) delete billDetailsCache[id as string];
        router.back();
      },
      onError: () => {
        setUpdating(false);
        Alert.alert(t("Error"), t("Failed to delete bill"));
      },
      ignoreRefresh: true,
    });
  }, [bill, confirmDeleteBill, id, router, t]);

  // 更新分类处理 - 优化更新操作
  const handleCategoryChange = useCallback(async (categoryId: string) => {
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
        // 更新缓存
        if (id) {
          billDetailsCache[id as string] = {
            bill: updated,
            timestamp: Date.now()
          };
        }
        setUpdating(false);
        setChangeUuid(prev => prev + 1);
        hasChangesRef.current = true;
      },
      onError: () => setUpdating(false),
      ignoreRefresh: true,
    });
  }, [bill, updateBillField, id]);

  // 更新字段通用处理 - 优化字段更新
  const handleUpdateField = useCallback(async (field: keyof Bill, value: any) => {
    if (!bill) return;
    // 只有当值实际变化时才更新
    if (bill[field] === value) {
      return;
    }
    setUpdating(true);
    updateBillField(bill, field, value, {
      onSuccess: (updated) => {
        setBill(updated);
        // 更新缓存
        if (id) {
          billDetailsCache[id as string] = {
            bill: updated,
            timestamp: Date.now()
          };
        }
        setUpdating(false);
        setChangeUuid(prev => prev + 1);
        hasChangesRef.current = true;
      },
      onError: () => setUpdating(false),
      ignoreRefresh: true,
    });
  }, [bill, updateBillField, id]);

  // Sheet打开处理器
  const handleOpenCategorySheet = useCallback(() => setActiveSheet("category"), []);
  const handleOpenDateSheet = useCallback(() => setActiveSheet("date"), []);
  const handleOpenAmountSheet = useCallback(() => setActiveSheet("amount"), []);

  if (loading) {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <Stack.Screen options={{ headerShown: false }} />
          <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background">
            <ActivityIndicator size="small" color={theme.blue9?.get()} />
            <Text marginTop="$3" color="$color10" fontSize="$3">
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
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <YStack
            flex={1}
            justifyContent="center"
            alignItems="center"
            padding="$4"
            backgroundColor="$background"
          >
            <Text fontSize="$5" fontWeight="$6" textAlign="center" color="$color">
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
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <YStack flex={1} backgroundColor="$background">
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
            <ScrollView
              contentContainerStyle={{ padding: 16 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <YStack gap="$4">
                {/* 金额卡片 */}
                <BillAmountCard
                  bill={bill}
                  updating={updating}
                  onUpdateField={handleUpdateField}
                  onOpenAmountSheet={handleOpenAmountSheet}
                  locale={locale}
                />

                {/* 详情卡片 */}
                <BillDetailsCard
                  bill={bill}
                  updating={updating}
                  onUpdateField={handleUpdateField}
                  onOpenCategorySheet={handleOpenCategorySheet}
                  onOpenDateSheet={handleOpenDateSheet}
                  locale={locale}
                />
              </YStack>
            </ScrollView>
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

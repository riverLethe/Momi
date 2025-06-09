import React, { useState, useEffect } from "react";
import { Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { ArrowLeft, Edit2, Trash2, X } from "lucide-react-native";
import {
  View,
  Text,
  Button,
  XStack,
  YStack,
  Card,
  Separator,
  Sheet,
  ScrollView,
  Avatar,
} from "tamagui";
import { useTranslation } from "react-i18next";

import { Bill } from "@/types/bills.types";
import { 
  EXPENSE_CATEGORIES, 
  getCategoryById, 
  getCategoryIcon 
} from "@/constants/categories";
import { getBills, updateBill, deleteBill } from "@/utils/bills.utils";
import { useData } from "@/providers/DataProvider";
import { useLocale } from "@/i18n/useLocale";

export default function BillDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id } = params;
  const { refreshData } = useData();
  const { t, i18n } = useTranslation();
  const { locale } = useLocale();
  
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // 从本地存储加载账单详情
  useEffect(() => {
    const loadBill = async () => {
      try {
        setLoading(true);
        const bills = await getBills();
        const foundBill = bills.find(b => b.id === id);
        
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
  
  const handleEditPress = () => {
    if (bill) {
      router.push({
        pathname: "/bills/add",
        params: { id: bill.id }
      });
    }
  };
  
  const handleDeletePress = () => {
    if (!bill) return;
    
    Alert.alert(
      t("Delete Bill"),
      t("Are you sure you want to delete this bill? This action cannot be undone."),
      [
        {
          text: t("Cancel"),
          style: "cancel"
        },
        {
          text: t("Delete"),
          style: "destructive",
          onPress: async () => {
            try {
              setUpdating(true);
              // 删除账单
              const success = await deleteBill(bill.id);
              
              if (success) {
                // 刷新数据提供者中的数据
                await refreshData();
                router.back();
              } else {
                Alert.alert(t("Error"), t("Failed to delete bill"));
              }
            } catch (error) {
              console.error("Failed to delete bill:", error);
              Alert.alert(t("Error"), t("Failed to delete bill"));
            } finally {
              setUpdating(false);
            }
          }
        }
      ]
    );
  };
  
  const handleCategoryChange = async (categoryId: string) => {
    if (!bill) return;
    
    try {
      setUpdating(true);
      // 更新账单分类
      const updatedBill = await updateBill(bill.id, {
        ...bill,
        category: categoryId
      });
      
      if (updatedBill) {
        setBill(updatedBill);
        // 刷新数据提供者中的数据
        await refreshData();
      } else {
        Alert.alert(t("Error"), t("Failed to update bill category"));
      }
    } catch (error) {
      console.error("Failed to update bill category:", error);
      Alert.alert(t("Error"), t("Failed to update bill category"));
    } finally {
      setUpdating(false);
      setIsCategorySheetOpen(false);
    }
  };
  
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
        <Stack.Screen options={{ headerShown: false }} />
        <YStack flex={1} justifyContent="center" alignItems="center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text marginTop="$4" color="$gray10">{t("Loading bill information...")}</Text>
        </YStack>
      </SafeAreaView>
    );
  }
  
  if (!bill) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
        <Stack.Screen options={{ headerShown: false }} />
        <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
          <Text fontSize="$5" fontWeight="$6" textAlign="center">{t("Bill does not exist or has been deleted")}</Text>
          <Button marginTop="$4" onPress={() => router.back()}>
            {t("Return to Bills List")}
          </Button>
        </YStack>
      </SafeAreaView>
    );
  }
  
  const category = getCategoryById(bill.category);
  const CategoryIcon = getCategoryIcon(bill.category);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
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
          <Button
            size="$3"
            circular
            chromeless
            onPress={() => router.back()}
          >
            <ArrowLeft size={20} color="#64748B" />
          </Button>
          
          <Text fontSize="$4" fontWeight="$6">{t("Bill Details")}</Text>
          
          <XStack space="$2">
            <Button
              size="$3"
              circular
              chromeless
              onPress={handleEditPress}
              disabled={updating}
            >
              <Edit2 size={20} color={updating ? "#CBD5E1" : "#64748B"} />
            </Button>
            
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
        
        <ScrollView flex={1} contentContainerStyle={{ padding: 16 }}>
          {/* 金额卡片 */}
          <Card
            padding="$5"
            marginTop="$2"
            marginBottom="$4"
            backgroundColor={category.color}
            elevate
          >
            <Text fontSize="$3" fontWeight="$5" color="white" opacity={0.85}>{t("Expense Amount")}</Text>
            <Text fontSize="$10" fontWeight="$8" color="white" marginTop="$2">
              ¥{bill.amount.toFixed(2)}
            </Text>
            <XStack justifyContent="space-between" marginTop="$4">
              <Text fontSize="$3" fontWeight="$5" color="white" opacity={0.85}>
                {new Date(bill.date).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" })}
              </Text>
              <Text fontSize="$3" fontWeight="$5" color="white" opacity={0.85}>
                {bill.account || t("Cash")}
              </Text>
            </XStack>
          </Card>
          
          {/* 详细信息 */}
          <Card backgroundColor="white" elevate>
            <YStack padding="$4" space="$4">
              <XStack justifyContent="space-between" alignItems="center">
                <Text color="$gray10" fontSize="$3">{t("Category")}</Text>
                <Button 
                  chromeless 
                  padding="$0" 
                  backgroundColor="transparent"
                  onPress={() => setIsCategorySheetOpen(true)}
                  disabled={updating}
                >
                  <XStack alignItems="center" space="$2">
                    <Avatar circular size="$3" backgroundColor={`${category.color}20`}>
                      <CategoryIcon size={14} color={category.color} />
                    </Avatar>
                    <Text fontSize="$3.5" fontWeight="$6">{t(category.name)}</Text>
                  </XStack>
                </Button>
              </XStack>
              
              <Separator />
              
              <XStack justifyContent="space-between" alignItems="center">
                <Text color="$gray10" fontSize="$3">{t("Merchant")}</Text>
                <Text fontSize="$3.5" fontWeight="$6">{bill.merchant || t("Not Specified")}</Text>
              </XStack>
              
              <Separator />
              
              <XStack justifyContent="space-between" alignItems="center">
                <Text color="$gray10" fontSize="$3">{t("Payment Method")}</Text>
                <Text fontSize="$3.5" fontWeight="$6">{bill.account || t("Cash")}</Text>
              </XStack>
              
              <Separator />
              
              <XStack justifyContent="space-between" alignItems="center">
                <Text color="$gray10" fontSize="$3">{t("Record Time")}</Text>
                <Text fontSize="$3.5" fontWeight="$6">
                  {new Date(bill.createdAt).toLocaleString(locale, {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </Text>
              </XStack>
              
              <Separator />
              
              <YStack space="$2">
                <Text color="$gray10" fontSize="$3">{t("Notes")}</Text>
                <Card backgroundColor="$gray1" padding="$3" borderRadius="$3">
                  <Text fontSize="$3.5">
                    {bill.notes || t("No notes")}
                  </Text>
                </Card>
              </YStack>
            </YStack>
          </Card>
        </ScrollView>
      </YStack>
      
      {/* 类别选择弹出层 */}
      <Sheet
        modal
        open={isCategorySheetOpen}
        onOpenChange={setIsCategorySheetOpen}
        snapPoints={[60]}
        position={0}
        dismissOnSnapToBottom
      >
        <Sheet.Overlay />
        <Sheet.Handle />
        <Sheet.Frame padding="$4">
          <XStack justifyContent="space-between" alignItems="center" marginBottom="$3">
            <Text fontSize="$4" fontWeight="$6">{t("Select Category")}</Text>
            <Button
              size="$2"
              circular
              onPress={() => setIsCategorySheetOpen(false)}
            >
              <X size={18} />
            </Button>
          </XStack>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            <YStack space="$3" paddingBottom="$10">
              {EXPENSE_CATEGORIES.map((cat) => (
                <Button
                  key={cat.id}
                  backgroundColor={cat.id === bill.category ? cat.lightColor : "transparent"}
                  borderColor={cat.id === bill.category ? cat.color : "$gray4"}
                  borderWidth={1}
                  paddingVertical="$3"
                  pressStyle={{ scale: 0.98, opacity: 0.9 }}
                  onPress={() => handleCategoryChange(cat.id)}
                  disabled={updating}
                >
                  <XStack alignItems="center" space="$3">
                    <Avatar circular size="$3.5" backgroundColor={`${cat.color}20`}>
                      {React.createElement(getCategoryIcon(cat.id), { 
                        size: 18, 
                        color: cat.color 
                      })}
                    </Avatar>
                    <Text fontSize="$3.5" fontWeight="$6">{t(cat.name)}</Text>
                  </XStack>
                </Button>
              ))}
            </YStack>
          </ScrollView>
        </Sheet.Frame>
      </Sheet>
    </SafeAreaView>
  );
} 
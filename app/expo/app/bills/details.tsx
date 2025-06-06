import React, { useState } from "react";
import { Alert } from "react-native";
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

import { Bill } from "@/types/bills.types";
import { 
  EXPENSE_CATEGORIES, 
  getCategoryById, 
  getCategoryIcon 
} from "@/constants/categories";

export default function BillDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id } = params;
  
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
  
  // 模拟从数据库获取账单详情
  // 实际应用中，这里应该从API或存储中获取真实数据
  const mockBill: Bill = {
    id: id as string,
    amount: 108.5,
    category: "food",
    account: "现金",
    date: new Date(),
    merchant: "星巴克",
    notes: "与朋友共享下午茶，讨论新项目。",
    createdBy: "user_1",
    creatorName: "Guest",
    isFamilyBill: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  const [bill, setBill] = useState<Bill>(mockBill);
  
  const handleEditPress = () => {
    router.push({
      pathname: "/bills/add",
      params: { id: bill.id }
    });
  };
  
  const handleDeletePress = () => {
    Alert.alert(
      "删除账单",
      "确定要删除此账单记录吗？此操作无法撤销。",
      [
        {
          text: "取消",
          style: "cancel"
        },
        {
          text: "删除",
          style: "destructive",
          onPress: () => {
            // 实际应用中，这里应该调用删除API
            router.back();
          }
        }
      ]
    );
  };
  
  const handleCategoryChange = (categoryId: string) => {
    setBill(prev => ({
      ...prev,
      category: categoryId
    }));
    setIsCategorySheetOpen(false);
    
    // 实际应用中，这里应该调用更新API
  };
  
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
          
          <Text fontSize="$4" fontWeight="$6">账单详情</Text>
          
          <XStack space="$2">
            <Button
              size="$3"
              circular
              chromeless
              onPress={handleEditPress}
            >
              <Edit2 size={20} color="#64748B" />
            </Button>
            
            <Button
              size="$3"
              circular
              chromeless
              onPress={handleDeletePress}
            >
              <Trash2 size={20} color="#ef4444" />
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
            <Text fontSize="$3" fontWeight="$5" color="white" opacity={0.85}>支出金额</Text>
            <Text fontSize="$10" fontWeight="$8" color="white" marginTop="$2">
              ¥{bill.amount.toFixed(2)}
            </Text>
            <XStack justifyContent="space-between" marginTop="$4">
              <Text fontSize="$3" fontWeight="$5" color="white" opacity={0.85}>
                {new Date(bill.date).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}
              </Text>
              <Text fontSize="$3" fontWeight="$5" color="white" opacity={0.85}>
                {bill.account}
              </Text>
            </XStack>
          </Card>
          
          {/* 详细信息 */}
          <Card backgroundColor="white" elevate>
            <YStack padding="$4" space="$4">
              <XStack justifyContent="space-between" alignItems="center">
                <Text color="$gray10" fontSize="$3">类别</Text>
                <Button 
                  chromeless 
                  padding="$0" 
                  backgroundColor="transparent"
                  onPress={() => setIsCategorySheetOpen(true)}
                >
                  <XStack alignItems="center" space="$2">
                    <Avatar circular size="$3" backgroundColor={`${category.color}20`}>
                      <CategoryIcon size={14} color={category.color} />
                    </Avatar>
                    <Text fontSize="$3.5" fontWeight="$6">{category.name}</Text>
                  </XStack>
                </Button>
              </XStack>
              
              <Separator />
              
              <XStack justifyContent="space-between" alignItems="center">
                <Text color="$gray10" fontSize="$3">收款方</Text>
                <Text fontSize="$3.5" fontWeight="$6">{bill.merchant || "未指定"}</Text>
              </XStack>
              
              <Separator />
              
              <XStack justifyContent="space-between" alignItems="center">
                <Text color="$gray10" fontSize="$3">支付方式</Text>
                <Text fontSize="$3.5" fontWeight="$6">{bill.account}</Text>
              </XStack>
              
              <Separator />
              
              <XStack justifyContent="space-between" alignItems="center">
                <Text color="$gray10" fontSize="$3">记录时间</Text>
                <Text fontSize="$3.5" fontWeight="$6">
                  {new Date(bill.createdAt).toLocaleString("zh-CN", {
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
                <Text color="$gray10" fontSize="$3">备注</Text>
                <Card backgroundColor="$gray1" padding="$3" borderRadius="$3">
                  <Text fontSize="$3.5">
                    {bill.notes || "暂无备注"}
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
            <Text fontSize="$4" fontWeight="$6">选择类别</Text>
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
                >
                  <XStack alignItems="center" space="$3">
                    <Avatar circular size="$3.5" backgroundColor={`${cat.color}20`}>
                      {React.createElement(getCategoryIcon(cat.id), { 
                        size: 18, 
                        color: cat.color 
                      })}
                    </Avatar>
                    <Text fontSize="$3.5" fontWeight="$6">{cat.name}</Text>
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
import React from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { YStack, XStack, Button, Text } from "tamagui";
import { ArrowLeft, Edit } from "lucide-react-native";
import { Card } from "@/components/ui";

export default function TransactionDetailPage() {
  const { id } = useLocalSearchParams();

  // TODO: 根据id获取账单详情
  const transaction = {
    id: id as string,
    amount: -58.5,
    description: "超市买菜",
    category: "餐饮",
    merchant: "永辉超市",
    date: "2024-01-15",
    creator: "我的小家",
  };

  const handleEdit = () => {
    router.push("/transactions/add");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
      {/* Header */}
      <XStack
        alignItems="center"
        justifyContent="space-between"
        padding="$4"
        backgroundColor="white"
      >
        <Button
          backgroundColor="transparent"
          size="$3"
          onPress={() => router.back()}
          icon={ArrowLeft}
        />

        <Text fontSize="$5" fontWeight="600">
          账单详情
        </Text>

        <Button
          backgroundColor="transparent"
          size="$3"
          onPress={handleEdit}
          icon={Edit}
        />
      </XStack>

      <ScrollView style={{ flex: 1 }}>
        <YStack padding="$4" space="$4">
          <Card>
            <YStack space="$4">
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$2" color="$gray10">
                  金额
                </Text>
                <Text
                  fontSize="$6"
                  fontWeight="600"
                  color={transaction.amount >= 0 ? "$green10" : "$red10"}
                >
                  ¥{Math.abs(transaction.amount).toFixed(2)}
                </Text>
              </XStack>

              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$2" color="$gray10">
                  描述
                </Text>
                <Text fontSize="$3">{transaction.description}</Text>
              </XStack>

              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$2" color="$gray10">
                  类别
                </Text>
                <Text fontSize="$3">{transaction.category}</Text>
              </XStack>

              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$2" color="$gray10">
                  商户
                </Text>
                <Text fontSize="$3">{transaction.merchant}</Text>
              </XStack>

              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$2" color="$gray10">
                  日期
                </Text>
                <Text fontSize="$3">{transaction.date}</Text>
              </XStack>

              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$2" color="$gray10">
                  记录人
                </Text>
                <Text fontSize="$3">{transaction.creator}</Text>
              </XStack>
            </YStack>
          </Card>

          <Button
            backgroundColor="$red10"
            onPress={() => {
              // TODO: 实现删除逻辑
              console.log("删除账单:", transaction.id);
              router.back();
            }}
          >
            <Text color="white" fontWeight="500">
              删除账单
            </Text>
          </Button>
        </YStack>
      </ScrollView>
    </SafeAreaView>
  );
}

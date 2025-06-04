import React, { useState } from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { YStack, XStack, Button, Input, Text, Select } from "tamagui";
import { ArrowLeft, Save } from "lucide-react-native";
import { Card } from "@/components/ui";

export default function AddTransactionPage() {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [merchant, setMerchant] = useState("");

  const handleSave = () => {
    // TODO: 实现保存逻辑
    console.log("保存账单:", { amount, description, category, merchant });
    router.back();
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
          添加账单
        </Text>

        <Button
          size="$3"
          onPress={handleSave}
          disabled={!amount || !description}
          backgroundColor="$blue10"
        >
          <Text color="white" fontWeight="500">
            保存
          </Text>
        </Button>
      </XStack>

      <ScrollView style={{ flex: 1 }}>
        <YStack padding="$4" space="$4">
          <Card>
            <YStack space="$4">
              <YStack space="$2">
                <Text fontSize="$3" fontWeight="500">
                  金额 *
                </Text>
                <Input
                  placeholder="请输入金额"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  size="$4"
                />
              </YStack>

              <YStack space="$2">
                <Text fontSize="$3" fontWeight="500">
                  描述 *
                </Text>
                <Input
                  placeholder="请输入描述"
                  value={description}
                  onChangeText={setDescription}
                  size="$4"
                />
              </YStack>

              <YStack space="$2">
                <Text fontSize="$3" fontWeight="500">
                  类别
                </Text>
                <Input
                  placeholder="请选择类别"
                  value={category}
                  onChangeText={setCategory}
                  size="$4"
                />
              </YStack>

              <YStack space="$2">
                <Text fontSize="$3" fontWeight="500">
                  商户
                </Text>
                <Input
                  placeholder="请输入商户名称"
                  value={merchant}
                  onChangeText={setMerchant}
                  size="$4"
                />
              </YStack>
            </YStack>
          </Card>
        </YStack>
      </ScrollView>
    </SafeAreaView>
  );
}

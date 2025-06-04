import React, { useState, useMemo } from "react";
import { ScrollView, TouchableOpacity, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { YStack, XStack, Button, Text } from "tamagui";
import {
  Bell,
  Plus,
  Edit3,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from "lucide-react-native";
import { Card, ViewToggle } from "@/components/ui";
import { useAppStore, useTransactionStore } from "@/hooks/useStore";
import { useLanguage } from "@/hooks/useLanguage";
import { formatCurrency, formatRelativeTime } from "@/utils";
import { Transaction, ViewType } from "@/types";

export default function HomePage() {
  const { currentView, currentFamilySpace, setCurrentView } = useAppStore();
  const { transactions } = useTransactionStore();
  const { t } = useLanguage();

  // 根据当前视图筛选交易记录
  const filteredTransactions = useMemo(() => {
    if (currentView === "personal") {
      // 个人视图：显示用户创建的所有账单
      return transactions.filter((t) => t.creatorId === "current-user-id"); // 实际应用中应该使用真实的用户ID
    } else {
      // 家庭视图：显示当前家庭空间的所有账单
      return transactions.filter(
        (t) => t.familySpaceId === currentFamilySpace?.id
      );
    }
  }, [transactions, currentView, currentFamilySpace]);

  // 计算财务概览数据
  const financialSummary = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyTransactions = filteredTransactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return (
        transactionDate.getMonth() === currentMonth &&
        transactionDate.getFullYear() === currentYear
      );
    });

    const totalExpense = monthlyTransactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const totalIncome = monthlyTransactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalExpense,
      totalIncome,
      balance: totalIncome - totalExpense,
    };
  }, [filteredTransactions]);

  // 最近账单（最多显示5条）
  const recentTransactions = useMemo(() => {
    return filteredTransactions
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 5);
  }, [filteredTransactions]);

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
  };

  const handleAddTransaction = () => {
    router.push("/chat");
  };

  const handleManualAdd = () => {
    router.push("/transactions/add");
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      onPress={() => router.push(`/transactions/${item.id}`)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
      }}
    >
      <XStack flex={1} className="items-center" gap="$3">
        <XStack
          width={40}
          height={40}
          bg="$blue2"
          className="items-center rounded-lg justify-center"
        >
          <Text color="$blue10" fontWeight="600">
            {t(item.category).charAt(0)}
          </Text>
        </XStack>

        <YStack flex={1}>
          <Text fontWeight="500" color="$gray12" numberOfLines={1}>
            {item.description}
          </Text>
          <Text fontSize="$2" color="$gray10">
            {item.merchant} • {formatRelativeTime(new Date(item.createdAt), t)}
          </Text>
          {currentView === "family" && item.creator && (
            <Text fontSize="$1" color="$gray8">
              {t("Recorded by")}: {item.creator.nickname}
            </Text>
          )}
        </YStack>

        <Text fontWeight="600" color={item.amount >= 0 ? "$green10" : "$red10"}>
          {formatCurrency(item.amount)}
        </Text>
      </XStack>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
      {/* Header */}
      <XStack className="items-center justify-between" p="$4" bg="white">
        <XStack className="items-center" gap="$3">
          <XStack
            width={32}
            height={32}
            bg="$blue10"
            className="items-center rounded-lg justify-center"
          >
            <Text color="white" fontWeight="600">
              M
            </Text>
          </XStack>
          <Text fontSize="$5" fontWeight="600" color="$gray12">
            {t("Momi")}
          </Text>
        </XStack>

        <ViewToggle
          currentView={currentView}
          familySpaceName={currentFamilySpace?.name}
          onViewChange={handleViewChange}
        />

        <TouchableOpacity style={{ padding: 8 }}>
          <Bell size={24} color="#6b7280" />
        </TouchableOpacity>
      </XStack>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* 财务概览卡片 */}
        <YStack p="$4">
          <Card>
            <YStack className="items-center" gap="$4">
              <YStack className="items-center" gap="$1">
                <Text fontSize="$2" color="$gray10">
                  {t("Monthly Balance")} (
                  {currentView === "personal"
                    ? t("Personal")
                    : currentFamilySpace?.name || t("Family")}
                  )
                </Text>
                <Text fontSize="$8" fontWeight="700" color="$gray12">
                  {formatCurrency(financialSummary.balance)}
                </Text>
              </YStack>

              <XStack className="justify-between" width="100%">
                <YStack flex={1} className="items-center">
                  <XStack className="items-center" gap="$1" mb="$1">
                    <TrendingUp size={16} color="#10b981" />
                    <Text fontSize="$2" color="$gray10">
                      {t("Income")}
                    </Text>
                  </XStack>
                  <Text fontWeight="600" color="$green10">
                    {formatCurrency(financialSummary.totalIncome)}
                  </Text>
                </YStack>

                <YStack width={1} bg="$gray5" mx="$4" />

                <YStack flex={1} className="items-center">
                  <XStack className="items-center" gap="$1" mb="$1">
                    <TrendingDown size={16} color="#ef4444" />
                    <Text fontSize="$2" color="$gray10">
                      {t("Expense")}
                    </Text>
                  </XStack>
                  <Text fontWeight="600" color="$red10">
                    {formatCurrency(financialSummary.totalExpense)}
                  </Text>
                </YStack>
              </XStack>
            </YStack>
          </Card>
        </YStack>

        {/* 快捷操作 */}
        <XStack p="$4" gap="$3">
          <Button
            flex={1}
            bg="$blue10"
            onPress={handleAddTransaction}
            height="$5"
          >
            <XStack className="items-center" gap="$2">
              <Plus size={24} color="#ffffff" />
              <Text color="white" fontWeight="500">
                {t("AI Assistant")}
              </Text>
            </XStack>
          </Button>

          <Button flex={1} bg="white" onPress={handleManualAdd} height="$5">
            <XStack className="items-center" gap="$2">
              <Edit3 size={24} color="#6b7280" />
              <Text color="$gray11" fontWeight="500">
                {t("Manual Entry")}
              </Text>
            </XStack>
          </Button>
        </XStack>

        {/* 最近账单 */}
        <YStack p="$4">
          <Card>
            <YStack gap="$4">
              <XStack className="items-center justify-between">
                <Text fontSize="$5" fontWeight="600" color="$gray12">
                  {t("Recent Transactions")} (
                  {currentView === "personal"
                    ? t("Personal")
                    : currentFamilySpace?.name || t("Family")}
                  )
                </Text>
                <TouchableOpacity onPress={() => router.push("/transactions")}>
                  <XStack className="items-center" gap="$1">
                    <Text color="$blue10" fontSize="$2">
                      {t("View All")}
                    </Text>
                    <ArrowRight size={16} color="#0ea5e9" />
                  </XStack>
                </TouchableOpacity>
              </XStack>

              {recentTransactions.length > 0 ? (
                <FlatList
                  data={recentTransactions}
                  renderItem={renderTransactionItem}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />
              ) : (
                <YStack py="$8" className="items-center">
                  <Text color="$gray10">{t("No transactions yet")}</Text>
                  <Text fontSize="$2" color="$gray8" mt="$1">
                    {currentView === "personal"
                      ? t("Start recording your first transaction")
                      : t("Family members haven't added any transactions yet")}
                  </Text>
                </YStack>
              )}
            </YStack>
          </Card>
        </YStack>
      </ScrollView>

      {/* 悬浮记账按钮 */}
      <TouchableOpacity
        onPress={handleAddTransaction}
        style={{
          position: "absolute",
          bottom: 80,
          right: 16,
          width: 56,
          height: 56,
          backgroundColor: "#0ea5e9",
          borderRadius: 28,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        }}
      >
        <Plus size={28} color="#ffffff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

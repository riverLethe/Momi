import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, Filter, Search, Plus, Trash2 } from "lucide-react-native";
import { Card, ViewToggle } from "@/components/ui";
import { useAppStore, useTransactionStore } from "@/hooks/useStore";
import { useLanguage } from "@/hooks/useLanguage";
import { formatCurrency, formatDate, formatRelativeTime } from "@/utils";
import { Transaction, ViewType } from "@/types";

export default function TransactionsPage() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const { currentView, currentFamilySpace, setCurrentView, user } =
    useAppStore();
  const { transactions, deleteTransaction } = useTransactionStore();
  const { t } = useLanguage();

  // 根据当前视图筛选交易记录
  const filteredTransactions = useMemo(() => {
    if (currentView === "personal") {
      return transactions.filter(
        (t) => t.creatorId === user?.id || t.creatorId === "current-user-id"
      );
    } else {
      return transactions.filter(
        (t) => t.familySpaceId === currentFamilySpace?.id
      );
    }
  }, [transactions, currentView, currentFamilySpace, user]);

  // 按日期分组
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {};

    filteredTransactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .forEach((transaction) => {
        const dateKey = formatDate(new Date(transaction.date));
        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }
        groups[dateKey].push(transaction);
      });

    return Object.entries(groups).map(([date, transactions]) => ({
      date,
      transactions,
      totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
    }));
  }, [filteredTransactions]);

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
    setSelectedItems([]);
    setIsSelectionMode(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // 这里应该调用API刷新数据
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleTransactionPress = (transaction: Transaction) => {
    if (isSelectionMode) {
      toggleSelection(transaction.id);
    } else {
      router.push(`/transactions/${transaction.id}`);
    }
  };

  const handleTransactionLongPress = (transaction: Transaction) => {
    // 只有创建者可以进入选择模式
    if (
      transaction.creatorId === user?.id ||
      transaction.creatorId === "current-user-id"
    ) {
      setIsSelectionMode(true);
      setSelectedItems([transaction.id]);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    selectedItems.forEach((id) => {
      deleteTransaction(id);
    });
    setSelectedItems([]);
    setIsSelectionMode(false);
  };

  const canDeleteTransaction = (transaction: Transaction) => {
    return (
      transaction.creatorId === user?.id ||
      transaction.creatorId === "current-user-id"
    );
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const isSelected = selectedItems.includes(item.id);
    const canDelete = canDeleteTransaction(item);

    return (
      <TouchableOpacity
        onPress={() => handleTransactionPress(item)}
        onLongPress={() => handleTransactionLongPress(item)}
        className={`
          flex-row items-center py-4 px-4 border-b border-gray-100
          ${isSelected ? "bg-primary-50" : "bg-white"}
          ${!canDelete && currentView === "family" ? "opacity-80" : ""}
        `}
      >
        <View className="w-12 h-12 bg-primary-100 rounded-full items-center justify-center mr-3">
          <Text className="text-primary-600 font-semibold text-lg">
            {t(item.category).charAt(0)}
          </Text>
        </View>

        <View className="flex-1">
          <Text className="font-medium text-gray-900 mb-1" numberOfLines={1}>
            {item.description}
          </Text>
          <Text className="text-sm text-gray-500">
            {item.merchant && `${item.merchant} • `}
            {t(item.paymentAccount)}
          </Text>
          {currentView === "family" && item.creator && (
            <Text className="text-xs text-gray-400 mt-1">
              {t("Recorded by")}: {item.creator.nickname}
            </Text>
          )}
          {item.notes && (
            <Text className="text-xs text-gray-500 mt-1" numberOfLines={1}>
              {t("Note")}: {item.notes}
            </Text>
          )}
        </View>

        <View className="items-end">
          <Text
            className={`font-semibold text-lg ${
              item.amount >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {formatCurrency(item.amount)}
          </Text>
          <Text className="text-xs text-gray-400 mt-1">
            {formatRelativeTime(new Date(item.createdAt), t)}
          </Text>
        </View>

        {isSelectionMode && (
          <View className="ml-3">
            <View
              className={`
                w-6 h-6 rounded-full border-2 items-center justify-center
                ${isSelected ? "bg-primary-500 border-primary-500" : "border-gray-300"}
              `}
            >
              {isSelected && <Text className="text-white text-xs">✓</Text>}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderDateGroup = ({
    item,
  }: {
    item: { date: string; transactions: Transaction[]; totalAmount: number };
  }) => (
    <View className="mb-4">
      <View className="flex-row items-center justify-between px-4 py-2 bg-gray-50">
        <Text className="font-medium text-gray-700">{item.date}</Text>
        <Text
          className={`font-medium ${item.totalAmount >= 0 ? "text-green-600" : "text-red-600"}`}
        >
          {item.totalAmount >= 0 ? "+" : ""}
          {formatCurrency(item.totalAmount)}
        </Text>
      </View>
      <FlatList
        data={item.transactions}
        renderItem={renderTransactionItem}
        keyExtractor={(transaction) => transaction.id}
        scrollEnabled={false}
      />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200">
        <View className="flex-row items-center justify-between px-4 py-3">
          <View className="flex-row items-center">
            <Text className="text-lg font-semibold text-gray-900 mr-4">
              {t("Transactions")}
            </Text>
            <ViewToggle
              currentView={currentView}
              familySpaceName={currentFamilySpace?.name}
              onViewChange={handleViewChange}
            />
          </View>

          <View className="flex-row items-center">
            <TouchableOpacity className="p-2 mr-2">
              <Search size={24} color="#6b7280" />
            </TouchableOpacity>
            <TouchableOpacity className="p-2">
              <Filter size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 选择模式工具栏 */}
        {isSelectionMode && (
          <View className="flex-row items-center justify-between px-4 py-3 bg-primary-50 border-t border-primary-100">
            <Text className="text-primary-700 font-medium">
              {t("Selected")} {selectedItems.length} {t("items")}
            </Text>
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => {
                  setIsSelectionMode(false);
                  setSelectedItems([]);
                }}
                className="px-3 py-1 mr-3"
              >
                <Text className="text-gray-600">{t("Cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteSelected}
                disabled={selectedItems.length === 0}
                className={`
                  flex-row items-center px-3 py-1 rounded
                  ${selectedItems.length > 0 ? "bg-red-500" : "bg-gray-300"}
                `}
              >
                <Trash2 size={16} color="#ffffff" />
                <Text className="text-white ml-1">{t("Delete")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* 账单列表 */}
      {groupedTransactions.length > 0 ? (
        <FlatList
          data={groupedTransactions}
          renderItem={renderDateGroup}
          keyExtractor={(item) => item.date}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#0ea5e9"
            />
          }
          contentContainerStyle={{ paddingVertical: 16 }}
        />
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500 text-lg mb-2">
            {t("No transactions yet")}
          </Text>
          <Text className="text-gray-400 text-sm mb-6">
            {currentView === "personal"
              ? t("Start recording your first transaction")
              : t("Family members haven't added any transactions yet")}
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/chat")}
            className="bg-primary-500 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-medium">
              {t("Start Recording")}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 悬浮添加按钮 */}
      {!isSelectionMode && (
        <TouchableOpacity
          onPress={() => router.push("/chat")}
          className="absolute bottom-6 right-4 w-14 h-14 bg-primary-500 rounded-full items-center justify-center shadow-lg"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}
        >
          <Plus size={28} color="#ffffff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

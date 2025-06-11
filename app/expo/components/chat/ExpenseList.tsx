import React from "react";
import { FlatList } from "react-native";
import { XStack, YStack, Text, View } from "tamagui";
import { Expense } from "@/utils/api";
import { ExpenseItem } from "./ExpenseItem";
import { formatCurrency } from "@/utils/format";

interface ExpenseListProps {
  expenses: Expense[];
  title?: string;
  compact?: boolean;
}

export const ExpenseList: React.FC<ExpenseListProps> = React.memo(
  ({ expenses, title, compact = false }) => {
    // Calculate total expenses
    const totalAmount = expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    return (
      <YStack marginVertical="$2">
        {title && (
          <XStack
            justifyContent="space-between"
            alignItems="center"
            marginBottom="$2"
            paddingHorizontal="$1"
          >
            <Text fontSize={16} fontWeight="600" color="$gray700">
              {title}
            </Text>
            <Text fontSize={16} fontWeight="600" color="$blue500">
              {formatCurrency(totalAmount)}
            </Text>
          </XStack>
        )}

        {expenses.length === 0 ? (
          <View
            padding="$4"
            backgroundColor="$gray50"
            borderRadius={8}
            alignItems="center"
          >
            <Text fontSize={14} color="$gray400">
              No expense records
            </Text>
          </View>
        ) : (
          <FlatList
            data={expenses}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ExpenseItem expense={item} compact={compact} />
            )}
            contentContainerStyle={{ paddingBottom: 8 }}
          />
        )}
      </YStack>
    );
  }
);

ExpenseList.displayName = "ExpenseList";

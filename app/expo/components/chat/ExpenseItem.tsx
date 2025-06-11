import React from "react";
import { TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { XStack, YStack, Text, View, Avatar, Card } from "tamagui";
import { Expense } from "@/utils/api";
import { formatCurrency } from "@/utils/format";
import { getCategoryById, getCategoryIcon } from "@/constants/categories";

interface ExpenseItemProps {
  expense: Expense;
  compact?: boolean;
}

export const ExpenseItem: React.FC<ExpenseItemProps> = React.memo(
  ({ expense, compact = false }) => {
    const router = useRouter();

    const handlePress = () => {
      router.push({
        pathname: "/bills/details",
        params: { id: expense.id },
      });
    };

    const formattedDate = new Date(expense.date).toLocaleDateString();

    const category = getCategoryById(expense.category);
    const CategoryIcon = getCategoryIcon(expense.category);

    if (compact) {
      return (
        <TouchableOpacity activeOpacity={0.8} onPress={handlePress} style={{ marginVertical: 4 }}>
          <Card
            backgroundColor="$gray50"
            borderColor="$gray200"
            borderWidth={1}
            borderRadius={10}
            paddingVertical={6}
            paddingHorizontal={10}
            elevation={0.5}
          >
            <XStack alignItems="center" justifyContent="space-between">
              <XStack alignItems="center" space="$2">
                <Avatar circular size="$2" backgroundColor={category.lightColor}>
                  <CategoryIcon size={14} color={category.color} />
                </Avatar>
                <Text fontSize={14} color="$gray700">
                  {category.name}
                </Text>
              </XStack>
              <Text fontSize={14} fontWeight="600" color="$gray800">
                {formatCurrency(expense.amount)}
              </Text>
            </XStack>
          </Card>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={{
          backgroundColor: "white",
          borderRadius: 12,
          marginVertical: 6,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
          overflow: "hidden"
        }}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View
          backgroundColor="$gray100"
          paddingVertical="$1.5"
          paddingHorizontal="$3"
        >
          <Text fontSize={12} color="$gray500">
            {formattedDate}
          </Text>
        </View>

        <XStack padding="$3">
          <YStack flex={1}>
            <Text
              fontSize={16}
              fontWeight="600"
              color="$gray800"
              marginBottom="$1"
            >
              {expense.category}
            </Text>
            <Text fontSize={14} color="$gray500">
              {expense.note}
            </Text>
          </YStack>

          <YStack alignItems="flex-end">
            <Text
              fontSize={16}
              fontWeight="600"
              color="$gray800"
              marginBottom="$1"
            >
              {formatCurrency(expense.amount)}
            </Text>
            <Text fontSize={12} color="$gray500">
              {expense.paymentMethod}
            </Text>
          </YStack>
        </XStack>
      </TouchableOpacity>
    );
  }
);

ExpenseItem.displayName = "ExpenseItem";

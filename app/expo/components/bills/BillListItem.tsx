import { Bill } from "@/types/bills.types";
import {
  getCategoryById,
  getCategoryIcon,
  useTranslatedCategoryName,
} from "@/constants/categories";
import { useRouter } from "expo-router";
import React from "react";
import { TouchableOpacity } from "react-native";
import { Avatar, Text, XStack, YStack } from "tamagui";

interface BillListItemProps {
  item: Bill;
}

export const BillListItem: React.FC<BillListItemProps> = ({ item }) => {
  const router = useRouter();
  
  const category = getCategoryById(item.category);
  const CategoryIcon = getCategoryIcon(item.category);
  const categoryName = useTranslatedCategoryName(item.category);

  const handlePress = () => {
    router.push({
      pathname: "/bills/details",
      params: { id: item.id },
    });
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.6} 
      onPress={handlePress}
      style={{ paddingVertical: 4, paddingHorizontal: 10 }}
    >
      <XStack alignItems="center" justifyContent="space-between" width="100%">
        <XStack alignItems="center" space="$3">
          <Avatar circular size="$3" backgroundColor={category.lightColor}>
            <CategoryIcon size={18} color={category.color} />
          </Avatar>

          <YStack>
            <Text fontSize="$3" fontWeight="500" lineHeight={22}>
              {categoryName}
            </Text>
            <Text fontSize="$2" color="$gray9" lineHeight={16}>
              {new Date(item.date).toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
              {item.merchant && ` | ${item.merchant}`}
            </Text>
          </YStack>
        </XStack>

        <YStack alignItems="flex-end">
          <Text fontSize="$3" fontWeight="500" color="$red10">
            -¥{item.amount.toFixed(2)}
          </Text>
        </YStack>
      </XStack>
    </TouchableOpacity>
  );
}; 
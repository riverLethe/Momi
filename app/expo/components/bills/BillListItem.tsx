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
import { useLocale } from "@/i18n/useLocale";
import { SwipeableRow } from "../ui/SwipeableRow";

interface BillListItemProps {
  item: Bill;
  /**
   * When true the list item is rendered in a disabled state and is not clickable.
   */
  disabled?: boolean;
  /**
   * Callback fired when the user confirms the deletion of the bill.
   */
  onDelete?: (bill: Bill) => void;
  /** Whether the swipeable row is currently open */
  isOpen?: boolean;
  /** Callback when the row has been opened */
  onSwipeOpen?: () => void;
  /** Callback when the row has been closed */
  onSwipeClose?: () => void;
  /** Callback when swipe gesture starts */
  onSwipeStart?: () => void;
}

export const BillListItem: React.FC<BillListItemProps> = ({
  item,
  disabled = false,
  onDelete,
  isOpen = false,
  onSwipeOpen,
  onSwipeClose,
  onSwipeStart,
}) => {
  const router = useRouter();
  const { locale } = useLocale();

  const category = getCategoryById(item.category);
  const CategoryIcon = getCategoryIcon(item.category);
  const categoryName = useTranslatedCategoryName(item.category);

  const handlePress = () => {
    onSwipeClose?.();
    router.push({
      pathname: "/bills/details",
      params: { id: item.id },
    });
  };

  return (
    <SwipeableRow
      disabled={disabled}
      onDelete={onDelete ? () => onDelete(item) : undefined}
      isOpen={isOpen}
      onSwipeOpen={onSwipeOpen}
      onSwipeClose={onSwipeClose}
      onSwipeStart={onSwipeStart}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={handlePress}
        disabled={disabled}
        style={{
          paddingVertical: 8,
          paddingHorizontal: 16,
          opacity: disabled ? 0.4 : 1,
          backgroundColor: "white",
        }}
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
                {new Date(item.date).toLocaleTimeString(locale, {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
                {item.merchant && ` | ${item.merchant}`}
              </Text>
            </YStack>
          </XStack>

          <YStack alignItems="flex-end">
            <Text
              fontSize="$3"
              fontWeight="500"
              color={disabled ? "$gray9" : "$red10"}
            >
              -¥{item.amount.toFixed(2)}
            </Text>
          </YStack>
        </XStack>
      </TouchableOpacity>
    </SwipeableRow>
  );
};

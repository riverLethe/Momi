import { Bill } from "@/types/bills.types";
import {
  getCategoryById,
  getCategoryIcon,
  useTranslatedCategoryName,
} from "@/constants/categories";
import { useRouter } from "expo-router";
import React, { useMemo, useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { Avatar, Text, XStack, YStack, useTheme } from "tamagui";
import { useLocale } from "@/i18n/useLocale";
import { SwipeableRow } from "../ui/SwipeableRow";
import { formatCurrency } from "@/utils/format";
import { useTranslation } from "react-i18next";

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

const BillListItemComponent: React.FC<BillListItemProps> = ({
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
  const theme = useTheme();
  const { t } = useTranslation();
  // 检查是否为只读账单
  const isReadOnly = item.isReadOnly || false;
  const isDisabled = disabled || isReadOnly;

  // 使用useMemo缓存计算结果
  const categoryInfo = useMemo(() => {
    const category = getCategoryById(item.category);
    const CategoryIcon = getCategoryIcon(item.category);
    return { category, CategoryIcon };
  }, [item.category]);

  const categoryName = useTranslatedCategoryName(item.category);

  // 缓存日期格式化结果
  const formattedDateTime = useMemo(() => {
    return new Date(item.date).toLocaleTimeString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }, [item.date, locale]);

  // 缓存格式化金额
  const formattedAmount = useMemo(() => {
    return formatCurrency(item.amount);
  }, [item.amount]);

  const handlePress = useCallback(() => {
    onSwipeClose?.();
    router.push({
      pathname: "/bills/details",
      params: { id: item.id },
    });
  }, [onSwipeClose, router, item.id]);

  const handleDelete = useCallback(() => {
    if (onDelete) {
      onDelete(item);
    }
  }, [onDelete, item]);

  const { category, CategoryIcon } = categoryInfo;

  return (
    <SwipeableRow
      disabled={isDisabled}
      onDelete={isReadOnly ? undefined : handleDelete} // 只读账单不允许删除
      isOpen={isOpen}
      onSwipeOpen={onSwipeOpen}
      onSwipeClose={onSwipeClose}
      onSwipeStart={onSwipeStart}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handlePress}
        disabled={isDisabled}
        style={{
          paddingVertical: 8,
          paddingHorizontal: 16,
          opacity: isDisabled ? 0.4 : 1,
          backgroundColor: theme.card?.get(),
        }}
      >
        <XStack alignItems="center" justifyContent="space-between" width="100%">
          <XStack alignItems="center" space="$3">
            <Avatar circular size="$3" backgroundColor={category.lightColor}>
              <CategoryIcon size={18} color={category.color} />
            </Avatar>

            <YStack>
              <XStack alignItems="center" gap="$1.5">
                <Text fontSize="$3" fontWeight="500" lineHeight={22} color="$color">
                  {categoryName}
                </Text>
                {item.isFamilyBill && (
                  <Text fontSize="$1" color="$blue9" fontWeight="600">
                    {t("Family")}
                  </Text>
                )}
                {isReadOnly && (
                  <Text fontSize="$1" color="$gray9" fontWeight="600">
                    {t("Read Only")}
                  </Text>
                )}
              </XStack>
              <Text fontSize="$2" color="$color9" lineHeight={16}>
                {formattedDateTime}
                {item.merchant && ` | ${item.merchant}`}
                {item.isFamilyBill && item.creatorName && ` | ${item.creatorName}`}
              </Text>
            </YStack>
          </XStack>

          <YStack alignItems="flex-end">
            <Text
              fontSize="$3"
              fontWeight="500"
              color={isDisabled ? "$color9" : "$red10"}
            >
              -{formattedAmount}
            </Text>
          </YStack>
        </XStack>
      </TouchableOpacity>
    </SwipeableRow>
  );
};

// 优化memo比较函数，只比较必要的属性
export const BillListItem = React.memo(
  BillListItemComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.item.amount === nextProps.item.amount &&
      prevProps.item.category === nextProps.item.category &&
      prevProps.item.date === nextProps.item.date &&
      prevProps.item.merchant === nextProps.item.merchant &&
      prevProps.item.isFamilyBill === nextProps.item.isFamilyBill &&
      prevProps.item.isReadOnly === nextProps.item.isReadOnly &&
      prevProps.item.creatorName === nextProps.item.creatorName &&
      prevProps.isOpen === nextProps.isOpen &&
      prevProps.disabled === nextProps.disabled
    );
  }
);

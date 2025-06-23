import React, { useState, useEffect } from "react";
import { Check, X } from "lucide-react-native";
import {
  Button,
  XStack,
  YStack,
  Sheet,
  Text,
  Avatar,
} from "tamagui";
import { useTranslation } from "react-i18next";

import { EXPENSE_CATEGORIES, getCategoryIcon } from "@/constants/categories";

export interface CategorySelectSheetProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  useAvatarStyle?: boolean;
  multiSelect?: boolean;
  selectedCategories?: string[];
  onCategoriesChange?: (categories: string[]) => void;
  onlyContent?: boolean;
  key?: string;
}

export const CategorySelectSheet: React.FC<CategorySelectSheetProps> = ({
  isOpen,
  setIsOpen,
  selectedCategory,
  onCategoryChange,
  useAvatarStyle = false,
  multiSelect = false,
  selectedCategories = [],
  onCategoriesChange,
  onlyContent = false,
  key,
}) => {
  const { t } = useTranslation();

  const [localSelected, setLocalSelected] =
    useState<string[]>(selectedCategories);

  useEffect(() => {
    if (multiSelect) {
      setLocalSelected(selectedCategories);
    }
  }, [selectedCategories.join(","), multiSelect]);


  const renderContent = () => (
    <YStack flex={1}>
      <Sheet.ScrollView showsVerticalScrollIndicator={false} flex={1}>
        <YStack gap="$2" paddingBottom="$6">
          {EXPENSE_CATEGORIES.map((cat) => {
            const CategoryIcon = getCategoryIcon(cat.id);
            const selected = multiSelect
              ? localSelected.includes(cat.id)
              : selectedCategory === cat.id;
            return (
              <Button
                key={cat.id}
                backgroundColor={selected ? cat.lightColor : "white"}
                paddingHorizontal="$2"
                justifyContent="flex-start"
                onPress={() => {
                  if (multiSelect) {
                    setLocalSelected((prev) =>
                      prev.includes(cat.id)
                        ? prev.filter((c) => c !== cat.id)
                        : [...prev, cat.id]
                    );
                  } else {
                    onCategoryChange?.(cat.id);
                    setIsOpen(false);
                  }
                }}
              >
                <XStack alignItems="center" gap="$2">
                  <Avatar circular size="$2" backgroundColor={`${cat.color}20`}>
                    <CategoryIcon size={16} color={cat.color} />
                  </Avatar>
                  <Text fontSize="$3" color="$gray11" flex={1}>
                    {t(cat.name)}
                  </Text>
                  {selected && <Check size={16} color={cat.color} />}
                </XStack>
              </Button>
            );
          })}
        </YStack>
      </Sheet.ScrollView>
    </YStack>
  );
  return onlyContent ? renderContent() : (
    <Sheet
      modal
      key={key}
      open={isOpen}
      onOpenChange={(open: boolean) => {
        if (!open && multiSelect && onCategoriesChange) {
          onCategoriesChange(localSelected);
        }
        setIsOpen(open);
      }}
      snapPoints={[useAvatarStyle ? 60 : 50]}
      dismissOnSnapToBottom
    >
      <Sheet.Overlay />
      <Sheet.Handle />
      <Sheet.Frame padding="$4" paddingBottom="$6">
        {renderContent()}
      </Sheet.Frame>
    </Sheet>
  );
};

// Export a memoized version to improve rendering performance
export default React.memo(CategorySelectSheet);

import React, { useState, useEffect } from "react";
import { Check, X } from "lucide-react-native";
import {
  Button,
  XStack,
  YStack,
  Sheet,
  ListItem,
  Separator,
  Text,
  Paragraph,
  Avatar,
} from "tamagui";
import { useTranslation } from "react-i18next";

import { EXPENSE_CATEGORIES, getCategoryIcon } from "@/constants/categories";

export interface CategorySelectSheetProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  title?: string;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  showAllOption?: boolean;
  allCategoryLabel?: string;
  useAvatarStyle?: boolean;
  multiSelect?: boolean;
  selectedCategories?: string[];
  onCategoriesChange?: (categories: string[]) => void;
}

export const CategorySelectSheet: React.FC<CategorySelectSheetProps> = ({
  isOpen,
  setIsOpen,
  title,
  selectedCategory,
  onCategoryChange,
  showAllOption = true,
  allCategoryLabel,
  useAvatarStyle = false,
  multiSelect = false,
  selectedCategories = [],
  onCategoriesChange,
}) => {
  const { t } = useTranslation();

  const [localSelected, setLocalSelected] =
    useState<string[]>(selectedCategories);

  useEffect(() => {
    if (multiSelect) {
      setLocalSelected(selectedCategories);
    }
  }, [selectedCategories.join(","), multiSelect]);

  const defaultTitle = t("Select Category");
  const defaultAllCategoryLabel = t("All Categories");

  return (
    <Sheet
      modal
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
        <YStack flex={1}>
          <XStack
            justifyContent="space-between"
            alignItems="center"
            marginBottom="$3"
          >
            <Paragraph fontSize={18} fontWeight="700">
              {title || defaultTitle}
            </Paragraph>
            <Button
              size="$3"
              circular
              onPress={() => setIsOpen(false)}
              icon={X}
            />
          </XStack>

          <Sheet.ScrollView
            showsVerticalScrollIndicator={false}
            flex={1}
            borderRadius="$4"
          >
            {showAllOption && !multiSelect && (
              <>
                <ListItem
                  title={allCategoryLabel || defaultAllCategoryLabel}
                  iconAfter={
                    selectedCategory === "all" ? <Check size={16} /> : undefined
                  }
                  onPress={() => {
                    onCategoryChange?.("all");
                    setIsOpen(false);
                  }}
                  pressTheme
                />
                <Separator />
              </>
            )}

            {useAvatarStyle ? (
              <YStack space="$3" paddingBottom="$10">
                {EXPENSE_CATEGORIES.map((cat) => {
                  const CategoryIcon = getCategoryIcon(cat.id);
                  const selected = multiSelect
                    ? localSelected.includes(cat.id)
                    : cat.id === selectedCategory;
                  return (
                    <Button
                      key={cat.id}
                      backgroundColor={
                        selected ? cat.lightColor : "transparent"
                      }
                      borderColor={selected ? cat.color : "$gray4"}
                      borderWidth={1}
                      paddingVertical="$3"
                      pressStyle={{ scale: 0.98, opacity: 0.9 }}
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
                      <XStack alignItems="center" space="$3">
                        <Avatar
                          circular
                          size="$3.5"
                          backgroundColor={`${cat.color}20`}
                        >
                          <CategoryIcon size={18} color={cat.color} />
                        </Avatar>
                        <Text fontSize="$3" fontWeight="$6">
                          {t(cat.name)}
                        </Text>
                        {multiSelect && selected && <Check size={16} />}
                      </XStack>
                    </Button>
                  );
                })}
              </YStack>
            ) : (
              EXPENSE_CATEGORIES.map((cat) => {
                const CategoryIcon = getCategoryIcon(cat.id);
                const selected = multiSelect
                  ? localSelected.includes(cat.id)
                  : selectedCategory === cat.id;
                return (
                  <ListItem
                    key={cat.id}
                    title={t(cat.name)}
                    icon={<CategoryIcon size={18} color={cat.color} />}
                    iconAfter={selected ? <Check size={16} /> : undefined}
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
                    pressTheme
                  />
                );
              })
            )}
          </Sheet.ScrollView>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
};

export default CategorySelectSheet;

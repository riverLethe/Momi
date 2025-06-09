import React from "react";
import { Check, X } from "lucide-react-native";
import {
  Button,
  XStack,
  YStack,
  Sheet,
  ScrollView,
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
}) => {
  const { t } = useTranslation();
  
  const defaultTitle = t("Select Category");
  const defaultAllCategoryLabel = t("All Categories");

  return (
    <Sheet
      modal
      open={isOpen}
      onOpenChange={setIsOpen}
      snapPoints={[useAvatarStyle ? 60 : 50]}
      dismissOnSnapToBottom
    >
      <Sheet.Overlay />
      <Sheet.Handle />
      <Sheet.Frame padding="$4">
        <YStack>
          <XStack justifyContent="space-between" alignItems="center" marginBottom="$3">
            <Paragraph fontSize={18} fontWeight="700">{title || defaultTitle}</Paragraph>
            <Button size="$3" circular onPress={() => setIsOpen(false)} icon={X} />
          </XStack>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            {showAllOption && (
              <>
                <ListItem
                  title={allCategoryLabel || defaultAllCategoryLabel}
                  iconAfter={selectedCategory === "all" ? <Check size={16} /> : undefined}
                  onPress={() => {
                    onCategoryChange("all");
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
                  return (
                    <Button
                      key={cat.id}
                      backgroundColor={cat.id === selectedCategory ? cat.lightColor : "transparent"}
                      borderColor={cat.id === selectedCategory ? cat.color : "$gray4"}
                      borderWidth={1}
                      paddingVertical="$3"
                      pressStyle={{ scale: 0.98, opacity: 0.9 }}
                      onPress={() => {
                        onCategoryChange(cat.id);
                        setIsOpen(false);
                      }}
                    >
                      <XStack alignItems="center" space="$3">
                        <Avatar circular size="$3.5" backgroundColor={`${cat.color}20`}>
                          <CategoryIcon size={18} color={cat.color} />
                        </Avatar>
                        <Text fontSize="$3.5" fontWeight="$6">{t(cat.name)}</Text>
                      </XStack>
                    </Button>
                  );
                })}
              </YStack>
            ) : (
              EXPENSE_CATEGORIES.map((cat) => {
                const CategoryIcon = getCategoryIcon(cat.id);
                return (
                  <ListItem
                    key={cat.id}
                    title={t(cat.name)}
                    icon={<CategoryIcon size={18} color={cat.color} />}
                    iconAfter={selectedCategory === cat.id ? <Check size={16} /> : undefined}
                    onPress={() => {
                      onCategoryChange(cat.id);
                      setIsOpen(false);
                    }}
                    pressTheme
                  />
                );
              })
            )}
          </ScrollView>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
};

export default CategorySelectSheet; 
import React, { useMemo, useState } from "react";
import { Pressable } from "react-native";
import { Avatar, Button, Card, Input, Separator, Text, XStack, YStack } from "tamagui";
import { useTranslation } from "react-i18next";
import { getCategoryById, getCategoryIcon } from "@/constants/categories";
import { BillDetailsCardProps } from "./types";

export const BillDetailsCard: React.FC<BillDetailsCardProps> = React.memo(({
    bill,
    updating,
    onUpdateField,
    onOpenCategorySheet,
    onOpenDateSheet,
    locale
}) => {
    const { t } = useTranslation();

    // 编辑状态
    const [editingMerchant, setEditingMerchant] = useState(false);
    const [merchantText, setMerchantText] = useState(bill.merchant || "");
    const [editingNotes, setEditingNotes] = useState(false);
    const [notesText, setNotesText] = useState(bill.notes || "");

    // 长按处理
    const onMerchantLongPress = () => setEditingMerchant(true);
    const onNotesLongPress = () => setEditingNotes(true);

    // Memoize derived values
    const category = useMemo(() => getCategoryById(bill.category), [bill.category]);
    const CategoryIcon = useMemo(() => getCategoryIcon(bill.category), [bill.category]);

    return (
        <Card backgroundColor="white" elevate>
            <YStack padding="$4" gap="$4">
                <XStack justifyContent="space-between" alignItems="center">
                    <Text color="$gray10" fontSize="$3">
                        {t("Category")}
                    </Text>
                    <Button
                        chromeless
                        padding="$0"
                        backgroundColor="transparent"
                        onPress={onOpenCategorySheet}
                        disabled={updating}
                        pressStyle={{
                            backgroundColor: "transparent",
                            borderColor: "transparent",
                            opacity: 0.5,
                        }}
                    >
                        <XStack alignItems="center" gap="$2">
                            <Avatar
                                circular
                                size="$3"
                                backgroundColor={`${category.color}20`}
                            >
                                <CategoryIcon size={14} color={category.color} />
                            </Avatar>
                            <Text fontSize="$3" fontWeight="$6">
                                {t(category.name)}
                            </Text>
                        </XStack>
                    </Button>
                </XStack>

                <Separator />

                <XStack
                    justifyContent="space-between"
                    alignItems="center"
                    gap="$3"
                    height="$1"
                >
                    <Text color="$gray10" fontSize="$3">
                        {t("Merchant")}
                    </Text>
                    {editingMerchant ? (
                        <XStack f={1} position="absolute" right="$0">
                            <Input
                                autoFocus
                                f={1}
                                value={merchantText}
                                onChangeText={setMerchantText}
                                onBlur={() => {
                                    setEditingMerchant(false);
                                    onUpdateField("merchant", merchantText);
                                }}
                                size="$3"
                                placeholder={t("Enter merchant name")}
                                width="$15"
                            />
                        </XStack>
                    ) : (
                        <Pressable onPress={onMerchantLongPress}>
                            <Text
                                fontSize="$3"
                                fontWeight="$6"
                                color={!bill.merchant ? "$gray6" : "$gray800"}
                            >
                                {bill.merchant || t("No content")}
                            </Text>
                        </Pressable>
                    )}
                </XStack>

                <Separator />

                <XStack justifyContent="space-between" alignItems="center">
                    <Text color="$gray10" fontSize="$3">
                        {t("Record Time")}
                    </Text>
                    <Button
                        chromeless
                        padding="$0"
                        backgroundColor="transparent"
                        onPress={onOpenDateSheet}
                        disabled={updating}
                        pressStyle={{
                            backgroundColor: "transparent",
                            borderColor: "transparent",
                            opacity: 0.5,
                        }}
                    > <Text fontSize="$3" fontWeight="$6">
                            {new Date(bill.date).toLocaleDateString(locale, {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                            })}
                        </Text>
                    </Button>
                </XStack>

                <Separator />

                <YStack gap="$2">
                    <Text color="$gray10" fontSize="$3">
                        {t("Notes")}
                    </Text>
                    {editingNotes ? (
                        <Input
                            autoFocus
                            multiline={false}
                            value={notesText}
                            onChangeText={setNotesText}
                            onBlur={() => {
                                setEditingNotes(false);
                                onUpdateField("notes", notesText);
                            }}
                            size="$3"
                            placeholder={t("Enter notes...")}
                        />
                    ) : (
                        <Pressable onPress={onNotesLongPress}>
                            <Text
                                fontSize="$3"
                                color={!bill.notes ? "$gray6" : "$gray800"}
                                height="$3"
                                lineHeight="$6"
                            >
                                {bill.notes || t("No content")}
                            </Text>
                        </Pressable>
                    )}
                </YStack>
            </YStack>
        </Card>
    );
});

BillDetailsCard.displayName = "BillDetailsCard";

export default BillDetailsCard; 
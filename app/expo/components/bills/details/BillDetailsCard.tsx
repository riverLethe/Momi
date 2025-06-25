import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { Pressable } from "react-native";
import { Avatar, Button, Card, Input, Separator, Text, XStack, YStack } from "tamagui";
import { useTranslation } from "react-i18next";
import { getCategoryById, getCategoryIcon } from "@/constants/categories";
import { BillDetailsCardProps } from "./types";

// Constants to avoid recreating objects on each render
const DATE_FORMAT_OPTIONS = {
    year: "numeric" as const,
    month: "2-digit" as const,
    day: "2-digit" as const,
};

const BUTTON_PRESS_STYLE = {
    backgroundColor: "transparent",
    borderColor: "transparent",
    opacity: 0.5,
};

export const BillDetailsCard: React.FC<BillDetailsCardProps> = React.memo(({
    bill,
    updating,
    onUpdateField,
    onOpenCategorySheet,
    onOpenDateSheet,
    locale
}) => {
    const { t } = useTranslation();

    // 编辑状态 - 使用懒初始化避免每次渲染时重新计算
    const [editingMerchant, setEditingMerchant] = useState(false);
    const [merchantText, setMerchantText] = useState(() => bill.merchant || "");
    const [editingNotes, setEditingNotes] = useState(false);
    const [notesText, setNotesText] = useState(() => bill.notes || "");

    // 使用 ref 缓存上一次的 bill 值，避免不必要的状态更新
    const prevBillRef = useRef(bill);

    // 当 bill 数据变化时，同步更新本地状态
    useEffect(() => {
        if (prevBillRef.current.merchant !== bill.merchant) {
            setMerchantText(bill.merchant || "");
        }
        if (prevBillRef.current.notes !== bill.notes) {
            setNotesText(bill.notes || "");
        }
        prevBillRef.current = bill;
    }, [bill.merchant, bill.notes]);

    // Memoize derived values - 优化依赖数组
    const category = useMemo(() => getCategoryById(bill.category), [bill.category]);
    const CategoryIcon = useMemo(() => getCategoryIcon(bill.category), [bill.category]);

    // 缓存分类名称翻译
    const categoryName = useMemo(() => {
        if (!category) return bill.category;
        return t(category.name);
    }, [category, t, bill.category]);

    // 缓存格式化的日期 - 使用模块级常量避免重复创建
    const formattedDate = useMemo(() => {
        try {
            return new Date(bill.date).toLocaleDateString(locale, DATE_FORMAT_OPTIONS);
        } catch {
            return bill.date; // fallback
        }
    }, [bill.date, locale]);

    // 优化事件处理函数 - 使用稳定的回调
    const onMerchantLongPress = useCallback(() => {
        setEditingMerchant(true);
    }, []);

    const onNotesLongPress = useCallback(() => {
        setEditingNotes(true);
    }, []);

    // 处理商户名称更新
    const handleMerchantBlur = useCallback(() => {
        setEditingMerchant(false);
        const currentMerchant = bill.merchant || "";
        if (merchantText !== currentMerchant) {
            onUpdateField("merchant", merchantText);
        }
    }, [merchantText, bill.merchant, onUpdateField]);

    // 处理备注更新
    const handleNotesBlur = useCallback(() => {
        setEditingNotes(false);
        const currentNotes = bill.notes || "";
        if (notesText !== currentNotes) {
            onUpdateField("notes", notesText);
        }
    }, [notesText, bill.notes, onUpdateField]);

    // 缓存商户文本更新函数
    const handleMerchantTextChange = useCallback((text: string) => {
        setMerchantText(text);
    }, []);

    // 缓存备注文本更新函数
    const handleNotesTextChange = useCallback((text: string) => {
        setNotesText(text);
    }, []);

    // 复用常量样式对象
    const buttonPressStyle = BUTTON_PRESS_STYLE;

    const avatarBackgroundColor = useMemo(() =>
        category?.lightColor || `${category?.color || "#64748B"}20`
        , [category?.lightColor, category?.color]);

    const iconColor = useMemo(() =>
        category?.color || "#64748B"
        , [category?.color]);

    return (
        <Card backgroundColor="white" elevate>
            <YStack padding="$4" gap="$4">
                {/* Category */}
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
                        pressStyle={buttonPressStyle}
                    >
                        <XStack alignItems="center" gap="$2">
                            <Avatar
                                circular
                                size="$3"
                                backgroundColor={avatarBackgroundColor}
                            >
                                <CategoryIcon size={14} color={iconColor} />
                            </Avatar>
                            <Text fontSize="$3" fontWeight="$6">
                                {categoryName}
                            </Text>
                        </XStack>
                    </Button>
                </XStack>

                <Separator />

                {/* Merchant */}
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
                                onChangeText={handleMerchantTextChange}
                                onBlur={handleMerchantBlur}
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

                {/* Date */}
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
                        pressStyle={buttonPressStyle}
                    >
                        <Text fontSize="$3" fontWeight="$6">
                            {formattedDate}
                        </Text>
                    </Button>
                </XStack>

                <Separator />

                {/* Notes */}
                <YStack gap="$2">
                    <Text color="$gray10" fontSize="$3">
                        {t("Notes")}
                    </Text>
                    {editingNotes ? (
                        <Input
                            autoFocus
                            multiline={false}
                            value={notesText}
                            onChangeText={handleNotesTextChange}
                            onBlur={handleNotesBlur}
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

BillDetailsCard.displayName = 'BillDetailsCard';

export default BillDetailsCard; 
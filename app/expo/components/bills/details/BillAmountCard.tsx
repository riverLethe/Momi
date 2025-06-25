import React, { useMemo } from "react";
import { Button, Card, Text, XStack } from "tamagui";
import { useTranslation } from "react-i18next";
import { getCategoryById } from "@/constants/categories";
import { formatCurrency } from "@/utils/format";
import { BillAmountCardProps } from "./types";

export const BillAmountCard: React.FC<BillAmountCardProps> = React.memo(({
    bill,
    updating,
    onOpenAmountSheet,
    locale
}) => {
    const { t } = useTranslation();

    // Memoize derived values to avoid recalculations on every render
    const category = useMemo(() => getCategoryById(bill.category), [bill.category]);
    const formattedAmount = useMemo(() => formatCurrency(bill.amount), [bill.amount]);

    // 缓存格式化的更新时间
    const formattedUpdateTime = useMemo(() => {
        return new Date(bill.updatedAt).toLocaleString(locale, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    }, [bill.updatedAt, locale]);

    return (
        <Card
            padding="$5"
            marginTop="$2"
            marginBottom="$4"
            backgroundColor={category.color}
            elevate
        >
            <Text
                fontSize="$3"
                fontWeight="$5"
                color="white"
                opacity={0.85}
            >
                {t("Expense Amount")}
            </Text>
            <Button
                chromeless
                padding="$0"
                backgroundColor="transparent"
                onPress={onOpenAmountSheet}
                disabled={updating}
                pressStyle={{
                    backgroundColor: "transparent",
                    borderColor: "transparent",
                    opacity: 0.5,
                }}
                hitSlop={10}
                justifyContent="flex-start"
                height="auto"
            >
                <Text
                    fontSize="$10"
                    fontWeight="$8"
                    color="white"
                    marginTop="$2"
                >
                    {formattedAmount}
                </Text>
            </Button>
            <XStack justifyContent="space-between" marginTop="$4">
                <Text
                    fontSize="$3"
                    fontWeight="$5"
                    color="white"
                    opacity={0.85}
                >
                    {bill.merchant || t("-")}
                </Text>
                <Text
                    fontSize="$3"
                    fontWeight="$5"
                    color="white"
                    opacity={0.85}
                >
                    {formattedUpdateTime}
                </Text>
            </XStack>
        </Card>
    );
});

BillAmountCard.displayName = "BillAmountCard";

export default BillAmountCard; 
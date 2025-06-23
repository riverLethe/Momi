import React from "react";
import { Button, Text, XStack } from "tamagui";
import { ChevronLeft, Trash2 } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { BillDetailHeaderProps } from "./types";

export const BillDetailHeader: React.FC<BillDetailHeaderProps> = React.memo(({
    onBack,
    onDelete,
    updating
}) => {
    const { t } = useTranslation();

    return (
        <XStack
            height="$5"
            paddingHorizontal="$4"
            alignItems="center"
            justifyContent="space-between"
            backgroundColor="white"
            borderBottomWidth={1}
            borderBottomColor="$gray4"
        >
            <Button size="$3" circular chromeless onPress={onBack}>
                <ChevronLeft size={20} color="#64748B" />
            </Button>

            <Text fontSize="$4" fontWeight="$6">
                {t("Bill Details")}
            </Text>

            <XStack gap="$2">
                <Button
                    size="$3"
                    circular
                    chromeless
                    onPress={onDelete}
                    disabled={updating}
                >
                    <Trash2 size={20} color={updating ? "#FCA5A5" : "#ef4444"} />
                </Button>
            </XStack>
        </XStack>
    );
});

BillDetailHeader.displayName = "BillDetailHeader";

export default BillDetailHeader; 
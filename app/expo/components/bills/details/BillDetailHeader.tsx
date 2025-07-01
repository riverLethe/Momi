import React from "react";
import { Button, Text, XStack, useTheme } from "tamagui";
import { ChevronLeft, Trash2 } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { BillDetailHeaderProps } from "./types";

export const BillDetailHeader: React.FC<BillDetailHeaderProps> = React.memo(({
    onBack,
    onDelete,
    updating
}) => {
    const { t } = useTranslation();
    const theme = useTheme();

    return (
        <XStack
            height="$5"
            paddingHorizontal="$4"
            alignItems="center"
            justifyContent="space-between"
            backgroundColor="$background"
            borderBottomWidth={1}
            borderBottomColor="$borderColor"
        >
            <Button size="$3" circular chromeless onPress={onBack}>
                <ChevronLeft size={20} color={theme.color?.get()} />
            </Button>

            <Text fontSize="$4" fontWeight="$6" color="$color">
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
                    <Trash2 size={20} color={updating ? theme.color8?.get() : theme.red9?.get()} />
                </Button>
            </XStack>
        </XStack>
    );
});

BillDetailHeader.displayName = "BillDetailHeader";

export default BillDetailHeader; 
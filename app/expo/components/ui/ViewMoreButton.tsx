import React from "react";
import { Button, Text, XStack } from "tamagui";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { useTranslation } from "react-i18next";

interface ViewMoreButtonProps {
    moreCount: number;
    // Query object passed from message.data.query – we assume keys are primitive string/date.
    query?: {
        startDate?: string | Date;
        endDate?: string | Date;
        category?: string;
        categories?: string[];
        keyword?: string;
        keywords?: string[];
        minAmount?: number;
        maxAmount?: number;
        dateField?: string;
        dateRanges?: { startDate?: string | Date; endDate?: string | Date }[];
    };
}

/**
 * Simple button rendered inside chat bubbles to let the user view more bills
 * that were matched by the AI filter. It navigates to the Bills screen with
 * the query parameters and an `ai` flag so the destination screen can show
 * a dismissible "AI Filter" tag.
 */
export const ViewMoreButton: React.FC<ViewMoreButtonProps> = ({ moreCount, query = {} }) => {
    const router = useRouter();
    const { t } = useTranslation();
    const handlePress = () => {
        const params: Record<string, string> = {
            ai: "1",
        };

        if (query.startDate) {
            params.startDate = typeof query.startDate === "string" ? query.startDate : new Date(query.startDate).toISOString();
        }
        if (query.endDate) {
            params.endDate = typeof query.endDate === "string" ? query.endDate : new Date(query.endDate).toISOString();
        }
        if (query.categories && query.categories.length) {
            params.categories = query.categories.join(",");
        } else if (query.category) {
            params.category = query.category;
        }
        if (query.keywords && query.keywords.length) {
            params.keywords = query.keywords.join(",");
        }
        if (typeof query.minAmount === "number") {
            params.minAmount = String(query.minAmount);
        }
        if (typeof query.maxAmount === "number") {
            params.maxAmount = String(query.maxAmount);
        }
        if (query.dateField) {
            params.dateField = query.dateField;
        }
        if (query.dateRanges && query.dateRanges.length) {
            params.dateRanges = JSON.stringify(query.dateRanges);
        }

        router.push({ pathname: "/bills", params });
    };

    return (
        <Button size="$2" onPress={handlePress} backgroundColor="$blue4" alignSelf="flex-start">
            <XStack gap="$1" alignItems="center">
                <Text fontSize={12} color="$blue11">
                    {t("+{{count}} more", { count: moreCount })}
                </Text>
                <ChevronRight size={14} />
            </XStack>
        </Button>
    );
};

ViewMoreButton.displayName = "ViewMoreButton"; 
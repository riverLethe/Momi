import React from "react";
import { useTranslation } from "react-i18next";
import { YStack, XStack, Text, Separator, Circle, Card, useTheme } from "tamagui";
import { SectionList } from "react-native";
import {
    TrendingDown,
    TrendingUp,
    AlertTriangle,
    DollarSign,
    SkipForward,
    PieChart,
    RefreshCcw,
} from "lucide-react-native";
import { Insight } from "@/types/reports.types";

interface InsightsSectionListProps {
    insights: Insight[];
}

type ThemeKey = NonNullable<Insight["theme"]>;

const InsightsSectionList: React.FC<InsightsSectionListProps> = ({ insights }) => {
    const { t } = useTranslation();
    const theme = useTheme();

    const themeMeta: Record<ThemeKey, { title: string; icon: JSX.Element }> = {
        overspend: { title: "Overspending", icon: <TrendingDown size={16} color={theme.red9?.get()} /> },
        underutilised_budget: { title: "Budget Not Used", icon: <PieChart size={16} color={theme.color8?.get()} /> },
        volatility: { title: "Spending Volatility", icon: <AlertTriangle size={16} color={theme.orange9?.get()} /> },
        momentum: { title: "Category Momentum", icon: <RefreshCcw size={16} color={theme.blue9?.get()} /> },
        savings_opportunity: { title: "Savings Opportunity", icon: <TrendingUp size={16} color={theme.green9?.get()} /> },
        recurring_risk: { title: "Recurring Risk", icon: <SkipForward size={16} color={theme.red9?.get()} /> },
        cashflow: { title: "Cashflow", icon: <DollarSign size={16} color={theme.blue9?.get()} /> },
    };

    // group by theme
    const group: Record<string, Insight[]> = {};
    insights.forEach((ins) => {
        const key = ins.theme || "others";
        group[key] = group[key] || [];
        group[key].push(ins);
    });

    const sections = (Object.keys(group) as ThemeKey[]).map((k) => ({
        key: k,
        data: group[k],
    }));

    if (sections.length === 0) return null;

    const renderItem = ({ item }: { item: Insight }) => (
        <XStack gap="$3" alignItems="flex-start" paddingVertical="$2">
            <Circle size="$3" backgroundColor="$backgroundSoft">
                {themeMeta[item.theme as ThemeKey]?.icon || <DollarSign size={16} color={theme.color8?.get()} />}
            </Circle>
            <YStack flex={1} gap="$1">
                <Text fontSize="$3" fontWeight="$6" color="$color">
                    {t(item.title)}
                </Text>
                <Text fontSize="$2" color="$color10">
                    {t(item.description)}
                </Text>
                {item.recommendedAction && (
                    <Text fontSize="$2" color="$blue9">
                        {t("Action: ") + t(item.recommendedAction)}
                    </Text>
                )}
            </YStack>
        </XStack>
    );

    const renderSectionHeader = ({ section }: { section: { key: ThemeKey } }) => (
        <YStack paddingVertical="$2">
            <XStack gap="$2" alignItems="center">
                {themeMeta[section.key]?.icon}
                <Text fontWeight="$7" fontSize="$3" color="$color">
                    {t(themeMeta[section.key]?.title)}
                </Text>
            </XStack>
        </YStack>
    );

    return (
        <Card
            padding="$2"
            borderRadius="$4"
            backgroundColor="$card"
            marginBottom="$4"
        >
            <Text fontSize="$3" fontWeight="$7" color="$color">
                {t("Financial Insights")}
            </Text>

            <YStack gap="$3.5">

                <SectionList
                    sections={sections}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    renderSectionHeader={renderSectionHeader}
                />
            </YStack>
        </Card>
    );
};

export default InsightsSectionList; 
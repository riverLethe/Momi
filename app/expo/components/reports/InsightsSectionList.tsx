import React from "react";
import { useTranslation } from "react-i18next";
import { YStack, XStack, Text, Separator, Circle, Card } from "tamagui";
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

const themeMeta: Record<ThemeKey, { title: string; icon: JSX.Element }> = {
    overspend: { title: "Overspending", icon: <TrendingDown size={16} color="#EF4444" /> },
    underutilised_budget: { title: "Budget Not Used", icon: <PieChart size={16} color="#64748B" /> },
    volatility: { title: "Spending Volatility", icon: <AlertTriangle size={16} color="#F59E0B" /> },
    momentum: { title: "Category Momentum", icon: <RefreshCcw size={16} color="#3B82F6" /> },
    savings_opportunity: { title: "Savings Opportunity", icon: <TrendingUp size={16} color="#10B981" /> },
    recurring_risk: { title: "Recurring Risk", icon: <SkipForward size={16} color="#EF4444" /> },
    cashflow: { title: "Cashflow", icon: <DollarSign size={16} color="#3B82F6" /> },
};

const InsightsSectionList: React.FC<InsightsSectionListProps> = ({ insights }) => {
    const { t } = useTranslation();

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
            <Circle size="$3" backgroundColor="#F1F5F9">
                {themeMeta[item.theme as ThemeKey]?.icon || <DollarSign size={16} color="#64748B" />}
            </Circle>
            <YStack flex={1} gap="$1">
                <Text fontSize="$3" fontWeight="$6">
                    {t(item.title)}
                </Text>
                <Text fontSize="$2" color="$gray10">
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
                <Text fontWeight="$7" fontSize="$3" color="$gray12">
                    {t(themeMeta[section.key]?.title)}
                </Text>
            </XStack>
        </YStack>
    );

    return (
        <Card
            padding="$2"
            borderRadius="$4"
            backgroundColor="white"
            marginBottom="$4"
        >
            <Text fontSize="$3" fontWeight="$7" color="$gray12">
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
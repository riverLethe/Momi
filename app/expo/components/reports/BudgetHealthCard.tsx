import React from "react";
// Import translation and UI libs
import { useTranslation } from "react-i18next";
import { YStack, XStack, Text } from "tamagui";
import Svg, { Circle as SvgCircle } from "react-native-svg";

import { formatCurrency } from "@/utils/format";
import type { HealthScoreDetail } from "@/types/reports.types";
import { getSeverityColor } from "@/types/budget.types";

/**
 * Budget related overview passed down from the reports screen.
 */
interface BudgetOverview {
    amount: number | null;
    spent: number;
    remaining: number;
    percentage: number; // 0 – 100
    status: "good" | "warning" | "danger" | "none";
}

interface BudgetHealthCardProps {
    budget: BudgetOverview;
    /** Computed health-score detail. May be undefined while loading. */
    health?: HealthScoreDetail | null;
    severity: "good" | "warning" | "danger";
}


// Added: map severity to Tamagui colour tokens for Text components
const getSeverityToken = (severity: "good" | "warning" | "danger") =>
    severity === "danger" ? "$red9" : severity === "warning" ? "$orange9" : "$green9";

// Added: generic metric analyser replicating logic from FinancialHealthScore
const analyseMetric = (
    value: number,
    dangerCond: (v: number) => boolean,
    warnCond: (v: number) => boolean
) => {
    if (dangerCond(value)) return { severity: "danger" as const };
    if (warnCond(value)) return { severity: "warning" as const };
    return { severity: "good" as const };
};

/**
 * A circular progress ring that represents budget utilisation and displays the
 * financial-health score in the centre.
 */
const ScoreRing: React.FC<{
    /** Budget utilisation in percentage 0-100 */
    progress: number;
    /** Overall severity that decides the ring colour */
    severity: "good" | "warning" | "danger";
}> = ({ progress, severity }) => {
    const size = 200;
    const strokeWidth = 15;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const dashOffset =
        circumference - (Math.min(Math.max(progress, 0), 100) / 100) * circumference;

    const ringColor = getSeverityColor(severity);

    return (
        <Svg width={size} height={size}>
            {/* Track */}
            <SvgCircle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#E5E7EB" /* gray3 */
                strokeWidth={strokeWidth}
                fill="none"
            />
            {/* Progress */}
            <SvgCircle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={ringColor}
                strokeWidth={strokeWidth}
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                rotation="-90"
                originX={size / 2}
                originY={size / 2}
                fill="none"
            />
            {/* Centre text rendered via Tamagui Text using absolute positioning */}
            {/* Using foreignObject is buggy on RN; instead overlay via parent */}
        </Svg>
    );
};

/**
 * Main component that merges the previous budget progress overview with the
 * financial-health score metrics.
 */
const BudgetHealthCard: React.FC<BudgetHealthCardProps> = ({ budget, health, severity }) => {
    const { t } = useTranslation();



    const scoreDisplay = health
        ? health.score
        : "-";

    return (
        <YStack gap="$4">
            {/* Ring + score */}
            <YStack alignItems="center" gap="$2">
                <YStack position="relative" alignItems="center" justifyContent="center">
                    <ScoreRing progress={budget.percentage} severity={severity} />
                    {/* Absolute centre overlay */}
                    <YStack position="absolute" alignItems="center" justifyContent="center">
                        <Text fontSize="$9" fontWeight="$8" color={getSeverityColor(severity)}>
                            {scoreDisplay}
                        </Text>

                        {/* Score text */}
                        {health && (
                            <Text fontSize="$3" fontWeight="$6" color="$gray11">
                                {t("Financial Health Score")}
                            </Text>
                        )}
                    </YStack>
                </YStack>
            </YStack>

            {/* Metric grid */}
            <YStack gap="$3">
                <XStack justifyContent="space-between">
                    <YStack gap="$2">
                        <Text color="$gray10">{t("Budget")}</Text>
                        <Text fontWeight="$7">{formatCurrency(budget.amount || 0)}</Text>
                    </YStack>
                    <YStack alignItems="flex-end" gap="$2">
                        <Text color="$gray10">{t("Spent")}</Text>
                        <Text fontWeight="$7">{formatCurrency(budget.spent)}</Text>
                    </YStack>
                </XStack>

                <XStack justifyContent="space-between" >
                    <YStack gap="$2">
                        <Text color="$gray10">{t("Remaining")}</Text>
                        <Text fontWeight="$6" color={budget.remaining > 0 ? "$green9" : "$red9"}>{formatCurrency(budget.remaining)}</Text>
                    </YStack>
                    <YStack alignItems="flex-end" gap="$2">
                        <Text color="$gray10">{t("Used")}</Text>
                        <Text fontWeight="$6">{budget.percentage.toFixed(1)}%</Text>
                    </YStack>
                </XStack>
                <XStack justifyContent="space-between" >
                    <YStack gap="$2">
                        <Text color="$gray10">{t("Volatility")}</Text>
                        <Text fontWeight="$6" color={getSeverityToken(health ? analyseMetric(
                            health.subScores.volatility.pct,
                            (v) => v >= 60,
                            (v) => v >= 40
                        ).severity : "good")}>{health?.subScores.volatility.pct}%</Text>
                    </YStack>
                    <YStack alignItems="flex-end" gap="$2">
                        <Text color="$gray10">{t("Recurring cover")}</Text>
                        <Text fontWeight="$6" color={getSeverityToken(health ? analyseMetric(
                            health.subScores.recurring.days,
                            (v) => v < 7,
                            (v) => v < 14
                        ).severity : "good")}>{health?.subScores.recurring.days}d</Text>
                    </YStack>
                </XStack>
            </YStack>
        </YStack>
    );
};

export default BudgetHealthCard; 
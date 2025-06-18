import React from "react";
import { XStack, Text } from "tamagui";

interface MetricChipProps {
    label: string;
    value: string;
    warning?: boolean;
}

const MetricChip: React.FC<MetricChipProps> = ({ label, value, warning }) => {
    return (
        <XStack
            paddingVertical="$1"
            paddingHorizontal="$2"
            borderRadius="$3"
            backgroundColor={warning ? "#FEF3C7" : "#ECFDF5"}
            alignItems="center"
            gap="$1"
        >
            <Text fontSize="$2" color="$gray11">
                {label}
            </Text>
            <Text fontSize="$2" fontWeight="$7" color={warning ? "#D97706" : "#059669"}>
                {value}
            </Text>
        </XStack>
    );
};

export default MetricChip; 
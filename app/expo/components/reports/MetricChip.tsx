import React from "react";
import { XStack, Text, useTheme } from "tamagui";

interface MetricChipProps {
    label: string;
    value: string;
    warning?: boolean;
}

const MetricChip: React.FC<MetricChipProps> = ({ label, value, warning }) => {
    const theme = useTheme();

    return (
        <XStack
            paddingVertical="$1"
            paddingHorizontal="$2"
            borderRadius="$3"
            backgroundColor={warning ? "$orange2" : "$green2"}
            alignItems="center"
            gap="$1"
        >
            <Text fontSize="$2" color="$color11">
                {label}
            </Text>
            <Text fontSize="$2" fontWeight="$7" color={warning ? "$orange9" : "$green9"}>
                {value}
            </Text>
        </XStack>
    );
};

export default MetricChip; 
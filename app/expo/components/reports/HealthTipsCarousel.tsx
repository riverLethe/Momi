import React from "react";
import { FlatList, View } from "react-native";
import { XStack, Text, useTheme } from "tamagui";

interface Tip {
    metric: string;
    advice: string;
}

interface Props {
    tips: Tip[];
}

const HealthTipsCarousel: React.FC<Props> = ({ tips }) => {
    const theme = useTheme();

    if (!tips || tips.length === 0) return null;

    return (
        <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={tips}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item }) => (
                <XStack
                    marginRight={12}
                    paddingVertical="$2"
                    paddingHorizontal="$3"
                    backgroundColor="$backgroundSoft"
                    borderRadius="$4"
                    maxWidth={260}
                >
                    <Text fontWeight="$7" marginRight="$1" color="$color">
                        {item.metric}:
                    </Text>
                    <Text flexShrink={1} color="$color">{item.advice}</Text>
                </XStack>
            )}
        />
    );
};

export default HealthTipsCarousel; 
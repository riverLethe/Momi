import React from "react";
import { Modal, ScrollView } from "react-native";
import { YStack, XStack, Text, Button, Separator } from "tamagui";
import { HealthScoreDetail } from "@/types/reports.types";

interface Props {
    visible: boolean;
    onClose: () => void;
    health: HealthScoreDetail;
}

const HealthScoreModal: React.FC<Props> = ({ visible, onClose, health }) => {
    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
                <YStack gap="$3">
                    <Text fontSize="$4" fontWeight="$8">
                        Score Details
                    </Text>
                    {Object.entries(health.subScores).map(([key, val], idx) => (
                        <YStack key={idx}>
                            <XStack justifyContent="space-between">
                                <Text fontWeight="$7">{key}</Text>
                                {"pct" in val ? (
                                    <Text>{(val as any).pct}%</Text>
                                ) : (
                                    <Text>{(val as any).days}d</Text>
                                )}
                            </XStack>
                            <Text fontSize="$2" color="$gray10">
                                Deduction: {(val as any).deduction}
                            </Text>
                            <Separator marginVertical="$2" />
                        </YStack>
                    ))}
                    <Button onPress={onClose} backgroundColor="$blue9" color="white">
                        Close
                    </Button>
                </YStack>
            </ScrollView>
        </Modal>
    );
};

export default HealthScoreModal; 
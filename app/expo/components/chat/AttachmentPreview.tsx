import React from "react";
import { ScrollView, Pressable, Image } from "react-native";
import { View, YStack, useTheme } from "tamagui";
import { File as FileIcon, X as CloseIcon } from "lucide-react-native";

export interface Attachment {
    id: string;
    uri: string;
    type: "image" | "file";
    name?: string;
}

interface AttachmentPreviewProps {
    attachments: Attachment[];
    onRemove?: (id: string) => void;
}

export const AttachmentPreview: React.FC<AttachmentPreviewProps> = React.memo(
    ({ attachments, onRemove }) => {
        const theme = useTheme();

        if (!attachments || attachments.length === 0) return null;

        return (
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8 }}
            >
                {attachments.map((att) => (
                    <View key={att.id} marginRight={8} position="relative">
                        {att.type === "image" ? (
                            <Image
                                source={{ uri: att.uri }}
                                style={{ width: 40, height: 40, borderRadius: 5 }}
                            />
                        ) : (
                            <YStack
                                width={40}
                                height={40}
                                borderRadius={5}
                                backgroundColor="$card"
                                alignItems="center"
                                justifyContent="center"
                            >
                                <FileIcon size={28} color={theme.color8?.get()} />
                            </YStack>
                        )}

                        {onRemove && (
                            <Pressable
                                onPress={() => onRemove(att.id)}
                                style={{ position: "absolute", top: -6, right: -6 }}
                            >
                                <View
                                    width={15}
                                    height={15}
                                    borderRadius={10}
                                    backgroundColor="rgba(0,0,0,0.6)"
                                    alignItems="center"
                                    justifyContent="center"
                                >
                                    <CloseIcon size={12} color="#fff" />
                                </View>
                            </Pressable>
                        )}
                    </View>
                ))}
            </ScrollView>
        );
    }
);

AttachmentPreview.displayName = "AttachmentPreview"; 
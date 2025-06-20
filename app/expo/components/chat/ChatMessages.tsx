import React, { RefObject, useCallback, useMemo } from "react";
import { FlatList, ActivityIndicator } from "react-native";
import { XStack, Text, View } from "tamagui";
import { Message } from "@/utils/api";
import { MessageBubble } from "./MessageBubble";
import { useTranslation } from "react-i18next";

interface ChatMessagesProps {
    messages: Message[];
    currentStreamedMessage: string;
    isThinking: boolean;
    /**
     * Ref to access internal FlatList instance so that parent can call scrollToEnd etc.
     */
    scrollViewRef: RefObject<FlatList<Message>>;
    /** Load more historical messages */
    loadMoreMessages?: () => void;
    /** Whether more messages are being loaded */
    isLoadingMore?: boolean;
    /** Whether there are more messages to load */
    hasMoreMessages?: boolean;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
    messages,
    currentStreamedMessage,
    isThinking,
    scrollViewRef,
    loadMoreMessages,
    isLoadingMore = false,
    hasMoreMessages = false,
}) => {
    const { t } = useTranslation();

    // Footer component (appears at top in inverted list) for loading more messages
    const ListFooterComponent = useMemo(() => {
        if (!hasMoreMessages && !isLoadingMore) return null;

        return (
            <View paddingVertical="$3" alignItems="center">
                {isLoadingMore ? (
                    <XStack alignItems="center" gap="$2">
                        <ActivityIndicator size="small" color="#3B82F6" />
                        <Text fontSize={14} color="$gray500">
                            {t("Loading more messages...")}
                        </Text>
                    </XStack>
                ) : (
                    <Text fontSize={14} color="$gray500">
                        {t("Pull up to load more messages")}
                    </Text>
                )}
            </View>
        );
    }, [hasMoreMessages, isLoadingMore, t]);

    // Memoise thinking/streaming indicator (now becomes ListHeader in inverted list)
    const ListHeaderComponent = useMemo(() => {
        if (currentStreamedMessage) {
            return (
                <XStack
                    width="80%"
                    maxWidth="80%"
                    marginBottom="$3"
                    alignItems="flex-end"
                    alignSelf="flex-start"
                >
                    <View
                        width={32}
                        height={32}
                        borderRadius={16}
                        backgroundColor="$blue500"
                        alignItems="center"
                        justifyContent="center"
                        marginRight="$2"
                    >
                        <Text color="$white" fontSize={14} fontWeight="bold">
                            AI
                        </Text>
                    </View>
                    <View
                        flex={1}
                        borderRadius={18}
                        borderBottomLeftRadius={4}
                        backgroundColor="$gray100"
                        paddingHorizontal="$3.5"
                        paddingVertical="$2.5"
                    >
                        <Text fontSize={16} lineHeight={22} color="$gray800">
                            {currentStreamedMessage}
                        </Text>
                    </View>
                </XStack>
            );
        }

        if (isThinking) {
            return (
                <XStack
                    width="80%"
                    maxWidth="80%"
                    marginBottom="$3"
                    alignItems="flex-end"
                    alignSelf="flex-start"
                >
                    <View
                        flexDirection="row"
                        alignItems="center"
                        borderRadius={18}
                        borderBottomLeftRadius={4}
                        backgroundColor="$gray100"
                        paddingHorizontal="$3.5"
                        paddingVertical="$2"
                    >
                        <ActivityIndicator size="small" color="#3B82F6" />
                        <Text marginLeft="$2" fontSize={14} color="$gray500">
                            {t("Thinking...")}
                        </Text>
                    </View>
                </XStack>
            );
        }

        return null;
    }, [currentStreamedMessage, isThinking, t]);

    const renderItem = useCallback(({ item }: { item: Message }) => {
        return <MessageBubble message={item} />;
    }, []);

    const keyExtractor = useCallback((item: Message) => item.id, []);

    const handleLoadMore = useCallback(() => {
        if (loadMoreMessages && !isLoadingMore && hasMoreMessages) {
            loadMoreMessages();
        }
    }, [loadMoreMessages, isLoadingMore, hasMoreMessages]);

    // Reverse messages so newest is first (for inverted list)
    const reversedData = useMemo(() => [...messages].reverse(), [messages]);

    return (
        <FlatList
            ref={scrollViewRef as any}
            data={reversedData}
            inverted
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={{
                paddingTop: 16,
                paddingHorizontal: 0,
                paddingBottom: 20,
            }}
            ListHeaderComponent={ListHeaderComponent}
            ListFooterComponent={ListFooterComponent}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.2}
            initialNumToRender={20}
            maxToRenderPerBatch={20}
            windowSize={21}
            removeClippedSubviews
        />
    );
}; 
import React from "react";
import { XStack, YStack, Text, Card, Separator } from "tamagui";
import { Message } from "@/utils/api";
import Markdown from "react-native-markdown-display";
import { ExpenseList } from "./ExpenseList";
import { Pressable } from "react-native";
import { Audio } from "expo-av";
import { Play, File as FileIcon } from "lucide-react-native";
import { SingleImage } from "@/components/ui/SingleImage";
import i18n from "@/i18n";

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  return (
    <XStack
      width="100%"
      marginBottom="$3"
      alignItems="flex-end"
      justifyContent={message.isUser ? "flex-end" : "flex-start"}
    >
      <YStack
        maxWidth="80%"
        borderRadius={18}
        paddingHorizontal="$4"
        paddingVertical="$2.75"
        backgroundColor={message.isUser ? "$blue500" : "$gray100"}
        borderBottomRightRadius={message.isUser ? 4 : 18}
        borderBottomLeftRadius={message.isUser ? 18 : 4}
        shadowColor="$black"
        shadowOpacity={0.08}
        shadowRadius={2}
        shadowOffset={{ width: 0, height: 1 }}
      >
        {renderMessageContent(message)}
        {/* <Text
          fontSize={12}
          marginTop="$1"
          color={message.isUser ? "rgba(255, 255, 255, 0.7)" : "$gray400"}
          alignSelf={message.isUser ? "flex-end" : "flex-start"}
        >
          {formatTime(message.timestamp)}
        </Text> */}
      </YStack>
    </XStack>
  );
};

// Helper function to render message content based on type
const renderMessageContent = (message: Message) => {
  // 媒体消息处理（图片 / 语音 / 文件）
  if (message.type === "image" && message.data?.uri) {
    return <SingleImage uri={message.data.uri} />;
  }

  if (message.type === "voice" && message.data?.uri) {
    const handlePlay = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync({
          uri: message.data.uri,
        });
        await sound.playAsync();
      } catch (err) {
        console.error("Failed to play audio", err);
      }
    };

    return (
      <XStack alignItems="center">
        <Pressable onPress={handlePlay} style={{ marginRight: 8 }}>
          <Play size={20} color="#3B82F6" />
        </Pressable>
        <Text fontSize={14} color="$gray800">
          {message.text || i18n.t("Voice message")}
        </Text>
      </XStack>
    );
  }

  if (message.type === "file" && message.data?.mimeType) {
    return (
      <Text fontSize={14} color="$gray800">
        {message.text}
      </Text>
    );
  }

  // Handle special data types
  if (message.data) {
    if (
      message.data.type === "expense_list" &&
      Array.isArray(message.data.expenses)
    ) {
      return (
        <YStack width="100%" alignItems="flex-start">
          <Card
            borderRadius="$4"
            overflow="hidden"
            elevation={0.5}
            backgroundColor="white"
            padding="$2"
            width="fit-content"
          >
            <Text fontSize={12} lineHeight={16}>
              {message.text}
            </Text>
          </Card>
          <YStack marginTop="$2">
            <ExpenseList bills={message.data.expenses} />
          </YStack>
        </YStack>
      );
    }

    if (message.data.type === "expense" && message.data.expense) {
      return (
        <YStack width="100%">
          <Text fontSize={16} lineHeight={22}>
            {message.text}
          </Text>
          <YStack marginTop="$2">
            <ExpenseList bills={[message.data.expense]} />
          </YStack>
        </YStack>
      );
    }

    if (message.data.type === "expense_analysis" && message.data.analysis) {
      const { totalAmount, categorySummary, count } = message.data.analysis;
      return (
        <YStack width="100%">
          <Text fontSize={16} lineHeight={22}>
            {message.text}
          </Text>
          <Card
            marginTop="$2"
            padding="$2"
            backgroundColor="$gray50"
            borderColor="$gray200"
            borderWidth={1}
          >
            <Text
              fontSize={16}
              fontWeight="bold"
              color="$gray800"
              marginBottom="$1"
            >
              {i18n.t("Total Spending")}: {totalAmount.toFixed(2)}
            </Text>
            <Text fontSize={14} color="$gray500" marginBottom="$2">
              {i18n.t("Total {{count}} transactions", { count })}
            </Text>
            {Object.entries(categorySummary).map(
              ([category, amount], index) => (
                <XStack
                  key={index}
                  justifyContent="space-between"
                  marginVertical="$0.5"
                >
                  <Text fontSize={14} color="$gray600">
                    {category}
                  </Text>
                  <Text fontSize={14} fontWeight="500" color="$blue500">
                    {(amount as number).toFixed(2)}
                  </Text>
                </XStack>
              )
            )}
          </Card>
        </YStack>
      );
    }

    if (message.data.type === "markdown" && message.data.content) {
      return (
        <Card
          borderRadius="$4"
          overflow="hidden"
          elevation={0.5}
          backgroundColor="white"
          padding="$2"
          width="fit-content"
        >
          <Markdown>{message.data.content}</Markdown>
        </Card>
      );
    }

    // System error message (recording / other runtime issues)
    if (message.data.type === "system_error") {
      return (
        <Card
          borderRadius="$4"
          overflow="hidden"
          elevation={0.5}
          backgroundColor="#FEE2E2" // light red
          padding="$2"
          width="fit-content"
          borderColor="#FCA5A5"
          borderWidth={1}
        >
          <Text fontSize={12} lineHeight={16} color="#B91C1C">
            {message.text}
          </Text>
        </Card>
      );
    }

    // Attachments from combined message
    if (
      Array.isArray(message.data.attachments) &&
      message.data.attachments.length
    ) {
      const hasText = message.text && message.text.trim().length > 0;
      return (
        <YStack width="100%" alignItems="flex-end" gap="$1">
          <Card
            borderRadius="$4"
            overflow="hidden"
            elevation={0.5}
            backgroundColor="white"
            width="fit-content"
          >
            <XStack flexWrap="wrap" gap="$1" padding="$2">
              {message.data.attachments.map((att: any) => {
                if (att.type === "image") {
                  return <SingleImage key={att.id} uri={att.uri} small />;
                }
                // file preview
                return (
                  <YStack
                    key={att.id}
                    minWidth={30}
                    maxWidth={100}
                    borderRadius={5}
                    backgroundColor="#F3F4F6"
                    paddingHorizontal={8}
                    paddingVertical={6}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <FileIcon size={20} color="#6B7280" />
                    <Text
                      fontSize={10}
                      color="#374151"
                      numberOfLines={1}
                      style={{ flexShrink: 1, textAlign: "center" }}
                    >
                      {att.name || i18n.t("file")}
                    </Text>
                  </YStack>
                );
              })}
            </XStack>
            {hasText && (
              <>
                <Separator />
                <Text fontSize={12} lineHeight={16} padding="$2">
                  {message.text}
                </Text>
              </>
            )}
          </Card>
        </YStack>
      );
    }
  }

  // Regular text message
  return (
    <YStack width="100%" alignItems="flex-end">
      <Card
        borderRadius="$4"
        overflow="hidden"
        elevation={0.5}
        backgroundColor="white"
        padding="$2"
        width="fit-content"
      >
        <Text fontSize={12} lineHeight={16}>
          {message.text}
        </Text>
      </Card>
    </YStack>
  );
};

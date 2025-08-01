import React from "react";
import { XStack, YStack, Text, Card, Separator, useTheme } from "tamagui";
import { Message } from "@/utils/api";
import { ExpenseList } from "./ExpenseList";
import { File as FileIcon, TerminalIcon } from "lucide-react-native";
import { SingleImage } from "@/components/ui/SingleImage";
import i18n from "@/i18n";
import { formatCurrency } from "@/utils/format";
import FinancialInsights from "@/components/reports/FinancialInsights";
import { ViewMoreButton } from "@/components/ui/ViewMoreButton";
import { Pressable } from "react-native";

interface MessageBubbleProps {
  message: Message;
  onLongPress?: (message: Message) => void;
}

const MessageBubbleComponent: React.FC<MessageBubbleProps> = ({ message, onLongPress }) => {
  const theme = useTheme();
  // Memoize to avoid recomputation on re-renders of the same message

  // Helper function to render message content based on type
  const renderMessageContent = (message: Message) => {

    // 媒体消息处理（图片 / 语音 / 文件）
    if (message.type === "image" && message.data?.uri) {
      return <SingleImage
        uri={message.data.uri}
        onLongPress={message.isUser && onLongPress ? (event) => onLongPress(message) : undefined}
      />;
    }


    if (message.type === "file" && message.data?.mimeType) {
      return (
        <Text fontSize={14} color="$gray800">
          {message.text}
        </Text>
      );
    }
    if (message.type === "cmd" && message.text) {
      return (<YStack width="100%" alignItems="flex-end">
        <Card
          borderRadius="$4"
          overflow="hidden"
          elevation={0.5}
          backgroundColor="$blue4"
          padding="$2"
          width="auto"
        >
          <XStack alignItems="center" gap="$2">
            <TerminalIcon size={16} />
            <Text fontSize={12} lineHeight={16}>
              {message.text}
            </Text>
          </XStack>
        </Card>
      </YStack>)
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
              backgroundColor="$card"
              padding="$2"
              width="auto"
            >
              <Text fontSize={12} lineHeight={16}>
                {message.text}
              </Text>
            </Card>
            <YStack marginTop="$2" gap="$2">
              <ExpenseList bills={message.data.expenses} />
              {typeof message.data.moreCount === "number" && message.data.moreCount > 0 && (
                <ViewMoreButton moreCount={message.data.moreCount} query={message.data.query} />
              )}
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
                {i18n.t("Total Spending")}: {formatCurrency(totalAmount)}
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
                      {formatCurrency(amount as number)}
                    </Text>
                  </XStack>
                )
              )}
            </Card>
          </YStack>
        );
      }

      if (message.data.type === "markdown" && message.data.content) {
        const Markdown = getMarkdownRenderer();
        return (
          <Card
            borderRadius="$4"
            overflow="hidden"
            elevation={0.5}
            backgroundColor="$card"
            padding="$2"
            width="auto"
          >
            <Markdown style={{ body: { color: theme.color?.get() } }}>{message.data.content}</Markdown>
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
            backgroundColor="$red2"
            padding="$2"
            width="auto"
            borderColor="$red6"
            borderWidth={1}
          >
            <Text fontSize={12} lineHeight={16} color="$red10">
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
              backgroundColor="$card"
              width="auto"
            >
              <XStack flexWrap="wrap" gap="$1" padding="$2">
                {message.data.attachments.map((att: any) => {
                  if (att.type === "image") {
                    return <SingleImage
                      key={att.id}
                      uri={att.uri}
                      small
                      onLongPress={message.isUser && onLongPress ? (event) => onLongPress(message) : undefined}
                    />;
                  }
                  // file preview
                  return (
                    <YStack
                      key={att.id}
                      minWidth={30}
                      maxWidth={100}
                      borderRadius={5}
                      backgroundColor="$backgroundSoft"
                      paddingHorizontal={8}
                      paddingVertical={6}
                      alignItems="center"
                      justifyContent="center"
                    >
                      <FileIcon size={20} color={theme.color8?.get()} />
                      <Text
                        fontSize={10}
                        color="$color"
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
                  <Text fontSize={12} lineHeight={16} padding="$2" color="$color">
                    {message.text}
                  </Text>
                </>
              )}
            </Card>
          </YStack>
        );
      }

      // Financial insights loading / result
      if (message.data.type === "financial_insights" && message.data.insights) {

        return (
          <XStack flex={1} width="100%" alignItems="flex-start" >
            <Card
              borderRadius="$4"
              overflow="hidden"
              elevation={0.5}
              backgroundColor="$card"
              padding="$2"
              width="100%"
            >
              <FinancialInsights insights={message.data.insights} />
            </Card>
          </XStack>
        );
      }
    }

    // Regular text message
    return message.text && (
      <YStack width="100%" alignItems="flex-end">
        <Card
          borderRadius="$4"
          overflow="hidden"
          elevation={0.5}
          backgroundColor="$card"
          padding="$2"
          width="auto"
        >
          <Text fontSize={12} lineHeight={16} color="$color">
            {message.text}
          </Text>
        </Card>
      </YStack>
    );
  };

  const content = React.useMemo(() => renderMessageContent(message), [message]);

  const handleLongPress = React.useCallback(() => {
    if (onLongPress && message.isUser) {
      onLongPress(message);
    }
  }, [onLongPress, message]);

  return (
    <XStack
      width="100%"
      marginBottom="$3"
      alignItems="center"
      gap="$2"
      justifyContent={message.isUser ? "flex-end" : "flex-start"}
    >
      <Pressable
        onLongPress={message.isUser ? handleLongPress : undefined}
        style={{ maxWidth: "80%" }}
      >
        <YStack
          borderRadius={18}
          paddingVertical="$2.75"
          borderBottomRightRadius={message.isUser ? 4 : 18}
          borderBottomLeftRadius={message.isUser ? 18 : 4}
        >
          {content}
        </YStack>
      </Pressable>
    </XStack>
  );
};

// Memoise to avoid re-render when message reference unchanged
export const MessageBubble = React.memo(
  MessageBubbleComponent,
  (prevProps, nextProps) =>
    prevProps.message === nextProps.message &&
    prevProps.onLongPress === nextProps.onLongPress
);

// Lazy load markdown renderer to reduce initial bundle size
let MarkdownRenderer: any;
const getMarkdownRenderer = () => {
  if (!MarkdownRenderer) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    MarkdownRenderer = require("react-native-markdown-display").default;
  }
  return MarkdownRenderer;
};


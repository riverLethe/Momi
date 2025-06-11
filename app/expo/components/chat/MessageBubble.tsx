import React from "react";
// import { View as RNView } from 'react-native';
import { XStack, YStack, Text, Avatar, Card } from "tamagui";
import { Message } from "@/utils/api";
import { formatTime } from "@/utils/format";
import { Expense } from "@/utils/api";
import Markdown from "react-native-markdown-display";
import { ExpenseList } from "./ExpenseList";

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
            padding="$3"
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
            padding="$3"
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
              Total Spending: {totalAmount.toFixed(2)}
            </Text>
            <Text fontSize={14} color="$gray500" marginBottom="$2">
              Total {count} transactions
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
      return <Markdown>{message.data.content}</Markdown>;
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
        padding="$3"
        width="fit-content"
      >
        <Text fontSize={12} lineHeight={16}>
          {message.text}
        </Text>
      </Card>
    </YStack>
  );
};

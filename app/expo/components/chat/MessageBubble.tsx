import React from 'react';
import { View as RNView } from 'react-native';
import { XStack, YStack, Text, View } from 'tamagui';
import { Message } from '@/utils/api';
import { formatTime } from '@/utils/format';
import { ExpenseList } from './ExpenseList';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  return (
    <XStack
      width="80%"
      maxWidth="80%"
      marginBottom="$3"
      alignItems="flex-end"
      alignSelf={message.isUser ? 'flex-end' : 'flex-start'}
    >
      {!message.isUser && (
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
      )}

      <YStack
        borderRadius={18}
        paddingHorizontal="$3.5"
        paddingVertical="$2.5"
        backgroundColor={message.isUser ? '$blue500' : '$gray100'}
        borderBottomRightRadius={message.isUser ? 4 : 18}
        borderBottomLeftRadius={message.isUser ? 18 : 4}
        flex={1}
      >
        {renderMessageContent(message)}
        <Text
          fontSize={12}
          marginTop="$1"
          color={message.isUser ? 'rgba(255, 255, 255, 0.7)' : '$gray400'}
          alignSelf={message.isUser ? 'flex-end' : 'flex-start'}
        >
          {formatTime(message.timestamp)}
        </Text>
      </YStack>
    </XStack>
  );
};

// Helper function to render message content based on type
const renderMessageContent = (message: Message) => {
  // Handle special data types
  if (message.data) {
    if (message.data.type === 'expense_list' && Array.isArray(message.data.expenses)) {
      return (
        <YStack width="100%">
          <Text fontSize={16} lineHeight={22}>
            {message.text}
          </Text>
          <ExpenseList
            expenses={message.data.expenses}
            title="Expense List"
            compact={true}
          />
        </YStack>
      );
    }

    if (message.data.type === 'expense' && message.data.expense) {
      return (
        <YStack width="100%">
          <Text fontSize={16} lineHeight={22}>
            {message.text}
          </Text>
          <View
            backgroundColor="$white"
            borderRadius={8}
            padding="$3"
            marginTop="$2"
            shadowColor="$black"
            shadowOffset={{ width: 0, height: 1 }}
            shadowOpacity={0.05}
            shadowRadius={1}
          >
            <Text fontSize={18} fontWeight="bold" color="$blue500" marginBottom="$1">
              {message.data.expense.amount.toFixed(2)}
            </Text>
            <Text fontSize={14} color="$gray600" marginBottom="$1">
              {message.data.expense.category}
            </Text>
            <Text fontSize={12} color="$gray500">
              {message.data.expense.note}
            </Text>
          </View>
        </YStack>
      );
    }

    if (message.data.type === 'expense_analysis' && message.data.analysis) {
      const { totalAmount, categorySummary, count } = message.data.analysis;
      return (
        <YStack width="100%">
          <Text fontSize={16} lineHeight={22}>
            {message.text}
          </Text>
          <View
            backgroundColor="$white"
            borderRadius={8}
            padding="$3"
            marginTop="$2"
            shadowColor="$black"
            shadowOffset={{ width: 0, height: 1 }}
            shadowOpacity={0.05}
            shadowRadius={1}
          >
            <Text fontSize={16} fontWeight="bold" color="$gray800" marginBottom="$1">
              Total Spending: {totalAmount.toFixed(2)}
            </Text>
            <Text fontSize={14} color="$gray500" marginBottom="$2">
              Total {count} transactions
            </Text>
            {Object.entries(categorySummary).map(([category, amount], index) => (
              <XStack key={index} justifyContent="space-between" marginVertical="$0.5">
                <Text fontSize={14} color="$gray600">
                  {category}
                </Text>
                <Text fontSize={14} fontWeight="500" color="$blue500">
                  {(amount as number).toFixed(2)}
                </Text>
              </XStack>
            ))}
          </View>
        </YStack>
      );
    }
  }

  // Regular text message
  return (
    <Text
      fontSize={16}
      lineHeight={22}
      color={message.isUser ? '$white' : '$gray800'}
    >
      {message.text}
    </Text>
  );
}; 
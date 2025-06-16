import React from "react";
import { Image, TouchableOpacity } from "react-native";
import { XStack, Text, View, Button } from "tamagui";
import { BrushCleaningIcon, PlusCircle, PlusIcon } from "lucide-react-native";

interface ChatHeaderProps {
  onAddExpense: () => void;
  /** Handler to clear all chat messages */
  onClearChat?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onAddExpense,
  onClearChat,
}) => {
  return (
    <XStack
      alignItems="center"
      justifyContent="space-between"
      paddingHorizontal="$4"
      paddingVertical="$3"
      borderBottomWidth={1}
      borderBottomColor="$gray4"
      backgroundColor="$white"
    >
      <XStack alignItems="center" justifyContent="center">
        <View
          width={28}
          height={28}
          borderRadius={14}
          overflow="hidden"
          marginRight="$2"
        >
          <Image
            source={{
              uri: "https://placehold.co/100x100/3B82F6/FFFFFF.png?text=M",
            }}
            style={{ width: "100%", height: "100%" }}
          />
        </View>
        <Text fontSize={18} fontWeight="600" color="$gray800">
        MomiQ
        </Text>
      </XStack>
      <XStack alignItems="flex-end" gap="$2">
        <Button onPress={onAddExpense} circular>
          <PlusIcon size={22} color="#3B82F6" />
        </Button>
        {onClearChat && (
          <Button onPress={onClearChat} circular>
            <BrushCleaningIcon size={22} color="#EF4444" />
          </Button>
        )}
      </XStack>
    </XStack>
  );
};

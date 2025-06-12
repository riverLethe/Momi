import React from "react";
import { Image, TouchableOpacity } from "react-native";
import { XStack, Text, View } from "tamagui";
import { PlusCircle } from "lucide-react-native";

interface ChatHeaderProps {
  onAddExpense: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ onAddExpense }) => {
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
      <View width={40} />
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
          Momiq
        </Text>
      </XStack>
      <View width={40} alignItems="flex-end">
        <TouchableOpacity onPress={onAddExpense}>
          <PlusCircle size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>
    </XStack>
  );
};

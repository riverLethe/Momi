import React from "react";
import { Animated, Pressable } from "react-native";
import { XStack, YStack, Text, View, Input } from "tamagui";
import { Mic, Camera, Send, Plus, Keyboard } from "lucide-react-native";

interface ChatInputProps {
  isTextMode: boolean;
  inputText: string;
  isRecording: boolean;
  recordingTimer: number;
  isThinking: boolean;
  showMoreOptions: boolean;
  micButtonScale: Animated.Value;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onToggleInputMode: () => void;
  onToggleMoreOptions: () => void;
  onStartRecording: () => void;
  onStopRecording: (hasContent: boolean) => void;
  onImageUpload: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  isTextMode,
  inputText,
  isRecording,
  recordingTimer,
  isThinking,
  showMoreOptions,
  micButtonScale,
  onChangeText,
  onSend,
  onToggleInputMode,
  onToggleMoreOptions,
  onStartRecording,
  onStopRecording,
  onImageUpload,
}) => {
  return (
    <YStack>
      <View
        borderTopWidth={1}
        borderTopColor="$gray4"
        backgroundColor="$white"
        paddingHorizontal="$3"
        paddingVertical="$2"
      >
        {/* Voice mode input */}
        {!isTextMode ? (
          <XStack alignItems="center" paddingVertical="$1">
            {/**camera */}
            <Pressable onPress={onImageUpload}>
              <View
                width={40}
                height={40}
                borderRadius={20}
                justifyContent="center"
                alignItems="center"
              >
                <Camera size={22} color="#4B5563" />
              </View>
            </Pressable>
            {/**record voice */}

            <Pressable
              style={{
                flex: 1,
                height: 44,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#F3F4F6",
                borderRadius: 22,
                paddingHorizontal: 16,
                marginHorizontal: 8,
              }}
              onPressIn={onStartRecording}
              onPressOut={() => onStopRecording(recordingTimer > 0)}
            >
              <Text fontSize={16} color="$gray600">
                {isRecording
                  ? `Recording ${3 - recordingTimer}s...`
                  : "Hold to speak"}
              </Text>
              <Animated.View
                style={[
                  {
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                  },
                  { transform: [{ scale: micButtonScale }] },
                ]}
              >
                <Mic size={20} color={isRecording ? "#EF4444" : "#4B5563"} />
              </Animated.View>
            </Pressable>

            <Pressable onPress={onToggleInputMode}>
              <View
                width={40}
                height={40}
                borderRadius={20}
                justifyContent="center"
                alignItems="center"
              >
                <Keyboard size={22} color="#4B5563" />
              </View>
            </Pressable>

            <Pressable onPress={onToggleMoreOptions}>
              <View
                width={40}
                height={40}
                borderRadius={20}
                justifyContent="center"
                alignItems="center"
              >
                <Plus size={22} color="#4B5563" />
              </View>
            </Pressable>
          </XStack>
        ) : (
          /* Text mode input */
          <XStack alignItems="center" paddingVertical="$1">
            {/* camera */}
            <Pressable onPress={onImageUpload}>
              <View
                width={40}
                height={40}
                borderRadius={20}
                justifyContent="center"
                alignItems="center"
              >
                <Camera size={22} color="#4B5563" />
              </View>
            </Pressable>
            <View
              style={{
                flex: 1,
                height: 44,
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#F3F4F6",
                borderRadius: 22,
                paddingHorizontal: 16,
                marginHorizontal: 8,
              }}
            >
              <Input
                placeholder="Send a message..."
                value={inputText}
                onChangeText={onChangeText}
                multiline={false}
                maxLength={1000}
                borderWidth={0}
                backgroundColor="transparent"
                padding="$0"
                onSubmitEditing={onSend}
              />
            </View>

            <Pressable onPress={onToggleInputMode}>
              <View
                width={40}
                height={40}
                borderRadius={20}
                justifyContent="center"
                alignItems="center"
              >
                <Mic size={22} color="#4B5563" />
              </View>
            </Pressable>

            {inputText.trim() === "" ? (
              <Pressable onPress={onToggleMoreOptions}>
                <View
                  width={40}
                  height={40}
                  borderRadius={20}
                  justifyContent="center"
                  alignItems="center"
                >
                  <Plus size={22} color="#4B5563" />
                </View>
              </Pressable>
            ) : (
              <Pressable onPress={onSend} disabled={isThinking}>
                <View
                  width={40}
                  height={40}
                  borderRadius={20}
                  backgroundColor="$blue500"
                  justifyContent="center"
                  alignItems="center"
                >
                  <Send size={18} />
                </View>
              </Pressable>
            )}
          </XStack>
        )}
      </View>
    </YStack>
  );
};

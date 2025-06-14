import React from "react";
import { Pressable, Animated, Easing, ScrollView, Image } from "react-native";
import { XStack, YStack, Text, View, Input } from "tamagui";
import {
  Camera,
  Plus,
  X as CloseIcon,
  File as FileIcon,
} from "lucide-react-native";

interface Attachment {
  id: string;
  uri: string;
  type: "image" | "file";
  name?: string;
}

interface ChatInputProps {
  isTextMode: boolean;
  inputText: string;
  isRecording: boolean;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onToggleInputMode: () => void;
  onToggleMoreOptions: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onImageUpload: () => void;
  attachments: Attachment[];
  onRemoveAttachment: (id: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  isTextMode,
  inputText,
  isRecording,
  onChangeText,
  onSend,
  onToggleInputMode,
  onToggleMoreOptions,
  onStartRecording,
  onStopRecording,
  onImageUpload,
  attachments,
  onRemoveAttachment,
}) => {
  /* Waveform animation setup */
  const BAR_COUNT = 50;
  const barAnimatedValues = React.useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(1))
  ).current;
  const barAnimations = React.useRef<Animated.CompositeAnimation[]>([]);

  React.useEffect(() => {
    if (isRecording) {
      // Start looping animations for each bar
      barAnimations.current = barAnimatedValues.map((val) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(val, {
              toValue: Math.random() * 1.5 + 1.2,
              duration: 200 + Math.random() * 150,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
            Animated.timing(val, {
              toValue: 1,
              duration: 200 + Math.random() * 150,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
          ])
        )
      );
      barAnimations.current.forEach((anim) => anim.start());
    } else {
      // Stop animations and reset bars
      barAnimations.current.forEach((anim) => anim.stop && anim.stop());
      barAnimatedValues.forEach((v) => v.setValue(1));
    }
    // Cleanup on unmount
    return () => {
      barAnimations.current.forEach((anim) => anim.stop && anim.stop());
    };
  }, [isRecording]);

  return (
    <YStack>
      {/* Attachment preview */}
      {attachments.length > 0 && (
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
                  backgroundColor="#E5E7EB"
                  alignItems="center"
                  justifyContent="center"
                >
                  <FileIcon size={28} color="#6B7280" />
                </YStack>
              )}
              {/* Remove button */}
              <Pressable
                onPress={() => onRemoveAttachment(att.id)}
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
            </View>
          ))}
        </ScrollView>
      )}
      <View
        borderTopWidth={1}
        borderTopColor="$gray4"
        backgroundColor="$white"
        paddingHorizontal="$3"
        paddingVertical="$2"
      >
        {/* Placeholder / Voice mode */}
        <XStack alignItems="center" paddingVertical="$1">
          {!isTextMode && !isRecording && (
            /* Camera icon only when voice mode & not recording */
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
          )}

          {/* Core pressable – stays mounted during recording */}
          {(!isTextMode || isRecording) && (
            <Pressable
              style={{
                flex: 1,
                height: 44,
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: isRecording ? "transparent" : "#F3F4F6",
                borderRadius: isRecording ? 0 : 22,
                marginHorizontal: 8,
                paddingHorizontal: isRecording ? 0 : 16,
              }}
              android_disableSound
              delayLongPress={100}
              onPress={onToggleInputMode}
              onLongPress={onStartRecording}
              onPressOut={onStopRecording}
            >
              {isRecording ? (
                <YStack flex={1} justifyContent="center" alignItems="center">
                  <Text color="$gray9" fontSize={10} marginBottom="$2">
                    Release to send, slide up to cancel
                  </Text>
                  <View
                    width="90%"
                    paddingVertical={10}
                    backgroundColor="$blue9"
                    borderRadius={20}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Animated.View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      {barAnimatedValues.map((val, i) => (
                        <Animated.View
                          key={i}
                          style={{
                            width: 3,
                            height: 6,
                            marginHorizontal: 1,
                            backgroundColor: "white",
                            borderRadius: 1,
                            opacity: i % 5 === 0 ? 1 : 0.6,
                            transform: [{ scaleY: val }],
                          }}
                        />
                      ))}
                    </Animated.View>
                  </View>
                </YStack>
              ) : (
                <Text fontSize={14} color="$gray9">
                  Send a message or hold to talk...
                </Text>
              )}
            </Pressable>
          )}

          {/* Text mode input field */}
          {isTextMode && !isRecording && (
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
                autoFocus
                placeholder={
                  attachments.length > 0
                    ? "Enter text or send directly..."
                    : "Send a message..."
                }
                value={inputText}
                onChangeText={onChangeText}
                multiline={false}
                maxLength={1000}
                borderWidth={0}
                backgroundColor="transparent"
                padding="$0"
                onSubmitEditing={onSend}
                onBlur={() => {
                  if (!inputText) onToggleInputMode();
                }}
              />
            </View>
          )}

          {/* Plus icon hidden during recording */}
          {!isRecording && (
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
          )}
        </XStack>
      </View>
    </YStack>
  );
};

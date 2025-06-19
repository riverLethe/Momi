import React from "react";
import { Pressable, Animated, Easing } from "react-native";
import { XStack, YStack, Text, View, Input } from "tamagui";
import {
  Camera,
  Plus,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { MoreOptions } from "./MoreOptions";
import { AttachmentPreview, Attachment } from "./AttachmentPreview";

interface ChatInputProps {
  isTextMode: boolean;
  inputText: string;
  isRecording: boolean;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onToggleInputMode: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onImageUpload: () => void;
  onPickImage: () => void;
  onTakePhoto: () => void;
  onFileUpload: () => void;
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
  onStartRecording,
  onStopRecording,
  onImageUpload,
  onPickImage,
  onTakePhoto,
  onFileUpload,
  attachments,
  onRemoveAttachment,
}) => {
  const { t } = useTranslation();
  const [showMoreOptions, setShowMoreOptions] = React.useState(false);

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
      <AttachmentPreview
        attachments={attachments}
        onRemove={onRemoveAttachment}
      />
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
                borderRadius="$2"
                justifyContent="center"
                alignItems="center"
                backgroundColor="$gray4"
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
                    {t("Release to send, slide up to cancel")}
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
                  {t("Send a message or hold to talk...")}
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
                    ? t("Enter text or send directly...")
                    : t("Send a message...")
                }
                value={inputText}
                onChangeText={onChangeText}
                multiline={false}
                maxLength={1000}
                borderWidth={0}
                backgroundColor="transparent"
                padding="$0"
                onSubmitEditing={() => onSend()}
                onBlur={() => {
                  if (!inputText) onToggleInputMode();
                }}
              />
            </View>
          )}

          {/* Plus icon hidden during recording */}
          {!isRecording && (
            <Pressable onPress={() => setShowMoreOptions(!showMoreOptions)}>
              <View
                width={40}
                height={40}
                borderRadius="$2"
                justifyContent="center"
                alignItems="center"
                backgroundColor="$gray4"
              >
                <Plus size={22} color="#4B5563" />
              </View>
            </Pressable>
          )}
        </XStack>
      </View>

      {/* More options modal */}
      {showMoreOptions && (
        <MoreOptions
          onPickImage={() => {
            setShowMoreOptions(false);
            onPickImage();
          }}
          onTakePhoto={() => {
            setShowMoreOptions(false);
            onTakePhoto();
          }}
          onFileUpload={() => {
            setShowMoreOptions(false);
            onFileUpload();
          }}
        />
      )}
    </YStack>
  );
};

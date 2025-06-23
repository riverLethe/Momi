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

  /* Waveform animation setup - smoother wave effect */
  const BAR_COUNT = 50; // 增加数量以获得更连续的效果
  const barAnimatedValues = React.useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(1))
  ).current;
  const barAnimations = React.useRef<Animated.CompositeAnimation[]>([]);

  React.useEffect(() => {
    if (isRecording) {
      // Start looping animations for each bar with improved timing
      // 创建更平滑的波浪动画效果
      barAnimations.current = barAnimatedValues.map((val, index) => {
        // 使用正弦波形模式，使相邻的条形动画联动，形成连续波浪
        const phaseOffset = index * (Math.PI / 10);
        const randomFactor = 0.3 + Math.random() * 0.4; // 随机因子增加自然感

        return Animated.loop(
          Animated.sequence([
            Animated.timing(val, {
              toValue: 1.2 + Math.sin(phaseOffset) * randomFactor,
              duration: 300 + Math.sin(phaseOffset) * 100, // 更长的时间使波浪更平滑
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(val, {
              toValue: 0.8 + Math.cos(phaseOffset) * randomFactor,
              duration: 300 + Math.cos(phaseOffset) * 100,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ])
        );
      });

      // 错开动画启动时间，形成完美的波浪效果
      barAnimations.current.forEach((anim, index) => {
        setTimeout(() => anim.start(), index * 15);
      });
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
              delayLongPress={50}
              onPress={onToggleInputMode}
              onLongPress={onStartRecording}
              onPressOut={onStopRecording}
              pressRetentionOffset={{ top: 30, left: 30, bottom: 30, right: 30 }}
            >
              {isRecording ? (
                <YStack flex={1} justifyContent="center" alignItems="center">
                  <Text color="$gray9" fontSize={11} marginBottom="$2">
                    {t("Release to send, slide up to cancel")}
                  </Text>
                  <Animated.View
                    style={{
                      width: "100%",
                      paddingVertical: 10,
                      borderRadius: 20,
                      alignItems: "center",
                      justifyContent: "center",
                      elevation: 2,
                    }}
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
                            width: i % 4 === 0 ? 1.5 : 2,
                            height: 10,
                            marginHorizontal: 1,
                            backgroundColor: "#999",
                            borderRadius: 50, // 完全圆角
                            opacity: 0.9,
                            transform: [{ scaleY: val }],
                          }}
                        />
                      ))}
                    </Animated.View>
                  </Animated.View>
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
      {
        showMoreOptions && (
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
        )
      }
    </YStack >
  );
};

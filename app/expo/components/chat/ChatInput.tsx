import React, { useRef, useState } from "react";
import {
  Pressable,
  Animated,
  Easing,
  GestureResponderEvent,
  LayoutChangeEvent
} from "react-native";
import { XStack, YStack, Text, View, Input } from "tamagui";
import {
  Camera,
  Plus,
  Mic,
  Send
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
  onCancelRecording?: () => void;
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
  onCancelRecording,
  onImageUpload,
  onPickImage,
  onTakePhoto,
  onFileUpload,
  attachments,
  onRemoveAttachment,
}) => {
  const { t } = useTranslation();
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [isCancelZone, setIsCancelZone] = useState(false);

  // 记录滑动状态
  const currentY = useRef<number>(0);
  const startY = useRef<number>(0);

  // 处理布局变化
  const handleLayout = (event: LayoutChangeEvent) => {
    // 保留这个方法，以兼容现有代码
  };

  // 移除handleTouchStart，因为我们已经在长按事件中记录初始位置

  const handleTouchMove = (e: GestureResponderEvent) => {
    if (!isRecording) return;

    currentY.current = e.nativeEvent.pageY;
    const diff = currentY.current - startY.current;

    // 上滑超过20像素就进入取消模式
    const shouldCancel = diff < -20;

    if (shouldCancel !== isCancelZone) {
      setIsCancelZone(shouldCancel);
    }
  };

  const handleTouchEnd = () => {
    if (!isRecording) return;

    const diff = currentY.current - startY.current;

    if (isCancelZone && diff < -20) {
      onCancelRecording?.();
    } else {
      onStopRecording();
    }

    setIsCancelZone(false);
  };

  /* Waveform animation setup - smoother wave effect */
  const BAR_COUNT = 50;
  const barAnimatedValues = React.useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(1))
  ).current;
  const barAnimations = React.useRef<Animated.CompositeAnimation[]>([]);

  React.useEffect(() => {
    if (isRecording) {
      barAnimations.current = barAnimatedValues.map((val, index) => {
        const phaseOffset = index * (Math.PI / 10);
        const randomFactor = 0.3 + Math.random() * 0.4;

        return Animated.loop(
          Animated.sequence([
            Animated.timing(val, {
              toValue: 1.2 + Math.sin(phaseOffset) * randomFactor,
              duration: 300 + Math.sin(phaseOffset) * 100,
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

      barAnimations.current.forEach((anim, index) => {
        setTimeout(() => anim.start(), index * 15);
      });
    } else {
      barAnimations.current.forEach((anim) => anim.stop && anim.stop());
      barAnimatedValues.forEach((v) => v.setValue(1));
    }

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
        <XStack alignItems="center" paddingVertical="$1">
          {!isTextMode && !isRecording && (
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

          {/* 核心消息输入区域 */}
          <View
            flex={1}
            marginHorizontal="$2"
            onLayout={handleLayout}
          >
            {/* Voice recording UI */}
            {isRecording ? (
              <Pressable
                style={{
                  height: 80,
                  backgroundColor: "transparent",
                  borderRadius: 4,
                  justifyContent: "center",
                  alignItems: "center",
                  paddingVertical: 10,
                }}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <Text
                  color={isCancelZone ? "#FF4D4D" : "$gray9"}
                  fontSize={11}
                  marginBottom="$2"
                  fontWeight={isCancelZone ? "700" : "normal"}
                >
                  {isCancelZone
                    ? t("Release to cancel")
                    : t("Release to send, slide up to cancel")}
                </Text>

                <Animated.View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    height: 24,
                  }}
                >
                  {barAnimatedValues.map((val, i) => (
                    <Animated.View
                      key={i}
                      style={{
                        width: i % 4 === 0 ? 1.5 : 2,
                        height: 10,
                        marginHorizontal: 1,
                        backgroundColor: isCancelZone ? "#FF4D4D" : "#999",
                        borderRadius: 50,
                        opacity: 0.9,
                        transform: [{ scaleY: val }],
                      }}
                    />
                  ))}
                </Animated.View>
              </Pressable>
            ) : isTextMode ? (
              /* Text input UI */
              <View
                style={{
                  height: 44,
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#F3F4F6",
                  borderRadius: 22,
                  paddingHorizontal: 16,
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

                {inputText.trim().length > 0 && (
                  <Pressable onPress={onSend} style={{ marginLeft: 4 }}>
                    <View
                      width={30}
                      height={30}
                      borderRadius={15}
                      justifyContent="center"
                      alignItems="center"
                      backgroundColor="$blue8"
                    >
                      <Send size={16} color="#FFFFFF" />
                    </View>
                  </Pressable>
                )}
              </View>
            ) : (
              /* Voice mode placeholder */
              <Pressable
                style={{
                  height: 44,
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#F3F4F6",
                  borderRadius: 22,
                  paddingHorizontal: 16,
                  justifyContent: "space-between"
                }}
                onPress={onToggleInputMode}
                onLongPress={(e: GestureResponderEvent) => {
                  startY.current = e.nativeEvent.pageY;
                  onStartRecording();
                }}
                delayLongPress={80} // shorten long-press threshold for snappier UX
              >
                <Text fontSize={14} color="$gray9">
                  {t("Send a message or hold to talk...")}
                </Text>
                <Mic size={18} color="#9CA3AF" />
              </Pressable>
            )}
          </View>

          {/* Plus button (not visible during recording) */}
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

import React, { useRef, useState, useCallback } from "react";
import {
  Pressable,
  GestureResponderEvent,
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
import { VoiceWaveform } from "./VoiceWaveform";

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

  // 只对高频调用的函数使用useCallback
  const handleTouchMove = useCallback((e: GestureResponderEvent) => {
    if (!isRecording) return;

    const newY = e.nativeEvent.pageY;
    const diff = newY - startY.current;
    const shouldCancel = diff < -20;

    // 避免不必要的状态更新
    if (shouldCancel !== isCancelZone) {
      currentY.current = newY;
      setIsCancelZone(shouldCancel);
    }
  }, [isRecording, isCancelZone]);

  const handleTouchEnd = useCallback(() => {
    if (!isRecording) return;

    const diff = currentY.current - startY.current;

    if (isCancelZone && diff < -20) {
      onCancelRecording?.();
    } else {
      onStopRecording();
    }

    setIsCancelZone(false);
  }, [isRecording, isCancelZone, onCancelRecording, onStopRecording]);

  // 关键：长按立即响应，减少到60ms
  const handleLongPressStart = useCallback((e: GestureResponderEvent) => {
    startY.current = e.nativeEvent.pageY;
    currentY.current = e.nativeEvent.pageY;
    // 立即同步调用，避免任何延迟
    onStartRecording();
  }, [onStartRecording]);

  // 动画逻辑已移至 VoiceWaveform 组件

  // 移除不必要的useCallback - 这些函数很简单且调用频率不高
  const toggleMoreOptions = () => {
    setShowMoreOptions(prev => !prev);
  };

  const hideMoreOptions = () => {
    setShowMoreOptions(false);
  };

  const handlePickImage = () => {
    hideMoreOptions();
    onPickImage();
  };

  const handleTakePhoto = () => {
    hideMoreOptions();
    onTakePhoto();
  };

  const handleFileUpload = () => {
    hideMoreOptions();
    onFileUpload();
  };

  const handleSend = () => {
    onSend();
  };

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

                {/* 高性能波形动画 */}
                <VoiceWaveform
                  isRecording={isRecording}
                  isCancelZone={isCancelZone}
                  color="#999"
                  cancelColor="#FF4D4D"
                />
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
                  onSubmitEditing={handleSend}
                  onBlur={() => {
                    if (!inputText) onToggleInputMode();
                  }}
                />

                {inputText.trim().length > 0 && (
                  <Pressable onPress={handleSend} style={{ marginLeft: 4 }}>
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
              /* Voice mode placeholder - 优化长按响应到60ms */
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
                onLongPress={handleLongPressStart}
                delayLongPress={100}
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
            <Pressable onPress={toggleMoreOptions}>
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
          onPickImage={handlePickImage}
          onTakePhoto={handleTakePhoto}
          onFileUpload={handleFileUpload}
        />
      )}
    </YStack>
  );
};

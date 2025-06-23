import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  KeyboardAvoidingView,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { View } from "tamagui";
import { chatAPI, Message } from "@/utils/api";
import { useAuth } from "@/providers/AuthProvider";
import { useData } from "@/providers/DataProvider";
import { useBudgets } from "@/hooks/useBudgets";
import { summariseBills } from "@/utils/abi-summary.utils";
import { startOfMonth, endOfMonth } from "date-fns";
import { DatePeriodEnum } from "@/types/reports.types";
import * as Localization from "expo-localization";

// Import components
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";
import { WelcomeScreen } from "@/components/chat/WelcomeScreen";

// 新增：本地缓存工具
import { useChatMessages } from "@/hooks/chat/useChatMessages";


// Utility to persist selected files inside the app sandbox
import { clearCachedFiles } from "@/utils/file.utils";

// 语音识别与播放
import { useVoiceRecognition } from "@/hooks/chat/useVoiceRecognition";
import { useTranslation } from "react-i18next";

import { useChatAttachments } from "@/hooks/chat/useChatAttachments";
import { createHandleAIResponse } from "@/hooks/chat/useAIResponse";
import { useChatSender } from "@/hooks/chat/useChatSender";
import { useQuickScreenshot } from "@/hooks/chat/useQuickScreenshot";
import { useFinancialInsights } from "@/hooks/chat/useFinancialInsights";

export default function ChatScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { refreshData, bills } = useData();
  const { budgets } = useBudgets();
  const [inputText, setInputText] = useState("");
  const [isTextMode, setIsTextMode] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [currentStreamedMessage, setCurrentStreamedMessage] = useState("");
  const [isFirstLoading, setIsFirstLoading] = useState(true);

  const scrollViewRef = useRef<FlatList<Message>>(null);

  // Helper: scroll chat to bottom (used by many hooks)
  function scrollToBottom() {
    scrollViewRef.current?.scrollToOffset({ offset: 0, animated: true });
  }

  const { messages, setMessages, clearMessages, loadMoreMessages, isLoadingMore, hasMoreMessages } = useChatMessages({
    onLoaded: () => {
      setIsFirstLoading(false);
      // ChatMessages组件会自动滚动到底部
    },
  });

  /** 处理 Quick Screenshot Deeplink 参数 */
  const params = useLocalSearchParams();
  const autoSend = params.autoSend === "1" || params.autoSend === "true";
  // tmpPath is URL-encoded on the native side; decode and normalise here.
  const tmpPathRaw =
    typeof params.tmpPath === "string" ? (params.tmpPath as string) : undefined;
  const tmpPath = tmpPathRaw ? decodeURIComponent(tmpPathRaw) : undefined;
  const { t } = useTranslation();

  // UI language (e.g., "en", "zh")
  const uiLang = (Localization.getLocales()?.[0]?.languageCode || "en").split(/[-_]/)[0];

  const {
    attachments,
    pickImage: handlePickImage,
    takePhoto: handleTakePhoto,
    uploadFile: handleFileUpload,
    remove: removeAttachment,
    replaceAttachments,
  } = useChatAttachments({
    onAfterAdd: () => setIsTextMode(true),
    onError: showSystemError,
  });
  // Memoised AI response handler (streaming, structured data, etc.)
  const handleAIResponse = useMemo(
    () =>
      createHandleAIResponse({
        user,
        refreshData,
        scrollToBottom,
        setMessages,
        setIsThinking,
        setCurrentStreamedMessage,
      }),
    [t, user, uiLang]
  );

  // Chat sender hook
  const { handleSend } = useChatSender({
    uiLang,
    attachments,
    replaceAttachments,
    inputText,
    setInputText,
    setIsTextMode,
    messages,
    setMessages,
    scrollToBottom,
    setIsThinking,
    setCurrentStreamedMessage,
    handleAIResponse,
  });

  // Quick screenshot auto attach & send (after hooks are ready)
  useQuickScreenshot({
    autoSend,
    tmpPath,
    replaceAttachments,
    handleSend,
    showSystemError,
  });

  const {
    isRecording,
    startRecording: startVoiceRecording,
    stopRecording: stopVoiceRecording,
  } = useVoiceRecognition({
    onFinalResult: (transcript) => {
      // Create a text message from the recognised speech
      const userMessage = chatAPI.createMessage(transcript, true, "text");
      setMessages((prev) => {
        const all = [...prev, userMessage];
        // Trigger AI reply once the message is inserted
        setIsThinking(true);
        setCurrentStreamedMessage("");
        const history = chatAPI.buildHistory(all);
        // Build current month summary for context
        const today = new Date();
        const summary = summariseBills(
          bills,
          budgets,
          DatePeriodEnum.MONTH,
          startOfMonth(today),
          endOfMonth(today)
        );

        chatAPI.sendMessage(
          transcript,
          history,
          handleAIResponse,
          [],
          uiLang,
          undefined,
          summary
        );
        setTimeout(() => scrollToBottom(), 50);
        return all;
      });
    },
    onError: (err) => {
      const errorBubble = chatAPI.createMessage(
        t("⚠️  Recording error: {{error}}", { error: err }),
        false,
        "text",
        { type: "system_error" }
      );
      setMessages((prev) => [...prev, errorBubble]);
      setTimeout(() => scrollToBottom(), 50);
    },
    maxDuration: 60000,
  });

  const insightsPeriodParam = typeof params.insightsPeriod === "string" ? params.insightsPeriod : undefined;
  // Auto-generate financial insights based on router param
  useFinancialInsights({ isMessageLoading: isFirstLoading, ts: typeof params.ts === "string" ? params.ts : undefined, periodParam: insightsPeriodParam, setMessages, setIsThinking, scrollToBottom });

  const handleAddExpense = () => {
    router.push("/bills/add");
  };

  // Toggle between text and voice input
  const toggleInputMode = () => {
    setIsTextMode(!isTextMode);
  };

  /** Clear all chat messages */
  const handleClearChat = () => {
    if (messages.length === 0 && currentStreamedMessage === "") return;

    Alert.alert(t("Clear Chat"), t("Are you sure you want to delete all messages?"), [
      { text: t("Cancel"), style: "cancel" },
      {
        text: t("Clear"),
        style: "destructive",
        onPress: () => {
          clearMessages();
          setCurrentStreamedMessage("");
          replaceAttachments([]);
          // Remove cached images so they don't occupy storage after chat is cleared
          clearCachedFiles("chat_images");
        },
      },
    ]);
  };

  /** Helper to display a user-visible error bubble */
  function showSystemError(text: string) {
    const errMsg = chatAPI.createMessage(t("⚠️  {{text}}", { text }), false, "text", {
      type: "system_error",
    });
    setMessages((prev) => [...prev, errMsg]);
    // Ensure it becomes visible
    setTimeout(() => scrollToBottom(), 50);
  }

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        if (isTextMode) {
          Keyboard.dismiss();
          setIsTextMode(false);
        }
      }}
      accessible={false}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
        <StatusBar barStyle="dark-content" />
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />

        {/* Custom Header */}
        <ChatHeader
          onAddExpense={handleAddExpense}
          onClearChat={handleClearChat}
        />

        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          {/* Chat Messages */}
          <View flex={1} backgroundColor="$gray2">
            {messages.length === 0 ? (
              <WelcomeScreen />
            ) : (
              <ChatMessages
                messages={messages}
                currentStreamedMessage={currentStreamedMessage}
                isThinking={isThinking}
                scrollViewRef={scrollViewRef}
                loadMoreMessages={loadMoreMessages}
                isLoadingMore={isLoadingMore}
                hasMoreMessages={hasMoreMessages}
              />
            )}
          </View>

          {/* Input area */}
          <ChatInput
            isTextMode={isTextMode}
            inputText={inputText}
            isRecording={isRecording}
            onChangeText={setInputText}
            onSend={handleSend}
            onToggleInputMode={toggleInputMode}
            onStartRecording={startVoiceRecording}
            onStopRecording={stopVoiceRecording}
            onImageUpload={handleTakePhoto}
            attachments={attachments}
            onRemoveAttachment={removeAttachment}
            onPickImage={handlePickImage}
            onTakePhoto={handleTakePhoto}
            onFileUpload={handleFileUpload}
          />

        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

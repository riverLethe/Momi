import React, { useState, useEffect, useRef } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { XStack, Text, View } from "tamagui";
import { chatAPI, Message, AIResponseType } from "@/utils/api";
import { saveBill } from "@/utils/bills.utils";
import { updateUserPreferences } from "@/utils/userPreferences.utils";
import { useAuth } from "@/providers/AuthProvider";
import { useData } from "@/providers/DataProvider";

// Import components
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { WelcomeScreen } from "@/components/chat/WelcomeScreen";
import { MoreOptions } from "@/components/chat/MoreOptions";
import { Bill } from "@/types/bills.types";

// 新增：本地缓存工具
import { loadChatMessages, saveChatMessages } from "@/utils/chatStorage.utils";

// 新增：设备能力库
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";

// 语音识别与播放
import { ExpoSpeechRecognitionModule } from "expo-speech-recognition";

export default function ChatScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { refreshData } = useData();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTextMode, setIsTextMode] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [recordingTimer, setRecordingTimer] = useState(0);
  const [recordingTimeout, setRecordingTimeout] =
    useState<NodeJS.Timeout | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [currentStreamedMessage, setCurrentStreamedMessage] = useState("");
  const [attachments, setAttachments] = useState<any[]>([]);

  const scrollViewRef = useRef<ScrollView>(null);

  /**
   * firstLoadRef 标识首次加载（用于避免在初始化时就触发保存）
   */
  const firstLoadRef = useRef(true);

  /** 临时保存语音识别结果与文件路径，待两者都就绪后生成消息 */
  const voiceUriRef = useRef<string | null>(null);
  const voiceTranscriptRef = useRef<string | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /** 保存事件订阅，便于结束时移除 */
  const recordingListeners = useRef<any[]>([]);

  // 组件挂载时，尝试从本地读取聊天记录
  useEffect(() => {
    (async () => {
      const cachedMessages = await loadChatMessages();
      if (cachedMessages.length) {
        setMessages(cachedMessages);
        // 等待渲染后滚动到底部
        setTimeout(() => scrollToBottom(), 50);
      }
      firstLoadRef.current = false;
    })();
  }, []);

  // 当 messages 更新时，将其保存到本地（跳过首次初始化）
  useEffect(() => {
    if (!firstLoadRef.current) {
      saveChatMessages(messages);
    }
  }, [messages]);

  useEffect(() => {
    // Clean up timer on unmount
    return () => {
      if (recordingTimeout) {
        clearTimeout(recordingTimeout);
      }
    };
  }, [recordingTimeout]);

  const handleSend = async () => {
    if (inputText.trim() === "" && attachments.length === 0) return;

    // Prepare attachments payload for API
    const attachmentsPayload: import("@/utils/api").AttachmentPayload[] = [];
    for (const att of attachments) {
      try {
        const base64 = await FileSystem.readAsStringAsync(att.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        attachmentsPayload.push({
          mimeType:
            att.mimeType ||
            (att.type === "image" ? "image/jpeg" : "application/octet-stream"),
          data: base64,
          name: att.name,
        });
      } catch (e) {
        console.warn("Failed to read attachment", e);
      }
    }

    // Build user message combining text & attachments (for local UI)
    const combinedMessage = chatAPI.createMessage(inputText, true, "text", {
      attachments,
    });
    setMessages((prev) => [...prev, combinedMessage]);

    // Scroll after rendering
    setTimeout(() => scrollToBottom(), 50);

    // Prepare for AI response
    const history = chatAPI.buildHistory([...messages, combinedMessage]);
    setIsThinking(true);
    setCurrentStreamedMessage("");

    await chatAPI.sendMessage(
      inputText,
      history,
      handleAIResponse,
      attachmentsPayload
    );

    // clear input and attachments
    setInputText("");
    setAttachments([]);
  };

  // Handle streaming AI response
  const handleAIResponse = async (response: AIResponseType) => {
    if (response.type === "thinking") {
      setIsThinking(response.content);
      if (!response.content && currentStreamedMessage) {
        const aiMessage = chatAPI.createMessage(currentStreamedMessage, false);
        setMessages((prev) => [...prev, aiMessage]);
        setCurrentStreamedMessage("");
        setTimeout(() => scrollToBottom(), 50);
      }
    }
    // else if (response.type === 'chunk') {
    //   setCurrentStreamedMessage(prev => prev + response.content);
    //   setTimeout(() => scrollToBottom(), 50);
    // }
    else if (response.type === "structured") {
      // 结构化AI响应
      const { type, expense, expenses, query, budget, content } = response.data;
      if (type === "create_expense" && (expense || expenses)) {
        // Normalize to an array of expense objects
        const expenseArray: any[] = Array.isArray(expenses)
          ? expenses
          : expense
            ? [expense]
            : [];

        const newBills: Bill[] = [];

        for (const exp of expenseArray) {
          try {
            const savedBill = await saveBill(
              {
                amount: exp.amount,
                category: exp.category || "others",
                date: exp.date ? new Date(exp.date) : new Date(),
                merchant: exp.merchant || "",
                notes: exp.note || "",
                account: exp.paymentMethod || "Default",
                isFamilyBill: false,
              },
              user || { id: "local-user", name: "Local User" }
            );
            newBills.push(savedBill);
          } catch (err) {
            console.error("Failed to save expense from AI:", err);
          }
        }

        if (newBills.length) {
          // Refresh context so UI updates elsewhere
          refreshData();

          const expenseMessage = chatAPI.createMessage(
            newBills.length > 1
              ? `${newBills.length} expenses created`
              : "Expense created",
            false,
            "text",
            { type: "expense_list", expenses: newBills }
          );
          setMessages((prev) => [...prev, expenseMessage]);
        }
      } else if (type === "list_expenses" && query) {
        const listMessage = chatAPI.createMessage(
          "Expense query",
          false,
          "text",
          { type: "expense_list", expenses: [] }
        );
        setMessages((prev) => [...prev, listMessage]);
      } else if (type === "set_budget" && budget) {
        // Persist budget to user preferences
        (async () => {
          try {
            await updateUserPreferences({
              budgetAmount: budget.amount,
              budgetPeriod: budget.period,
            });
          } catch (err) {
            console.error("Failed to update budget preference:", err);
          }
        })();

        const budgetMessage = chatAPI.createMessage(
          `Budget set: ${budget.amount} (${budget.category || "All"}, ${budget.period})`,
          false,
          "text",
          { type: "budget", budget }
        );
        setMessages((prev) => [...prev, budgetMessage]);
      } else if (type === "markdown" && content) {
        const markdownMessage = chatAPI.createMessage("", false, "text", {
          type: "markdown",
          content,
        });
        setMessages((prev) => [...prev, markdownMessage]);
      } else {
        // fallback
        const fallbackMessage = chatAPI.createMessage(
          JSON.stringify(response.data),
          false
        );
        setMessages((prev) => [...prev, fallbackMessage]);
      }
      setTimeout(() => scrollToBottom(), 50);
    } else if (response.type === "markdown") {
      const markdownMessage = chatAPI.createMessage("", false, "text", {
        type: "markdown",
        content: response.content,
      });
      setMessages((prev) => [...prev, markdownMessage]);
      setTimeout(() => scrollToBottom(), 50);
    } else if (response.type === "complete") {
      // Add complete message
      const aiMessage = chatAPI.createMessage(response.content, false);
      setMessages((prev) => [...prev, aiMessage]);
      setCurrentStreamedMessage("");
      setTimeout(() => scrollToBottom(), 50);
    } else if (response.type === "error") {
      // Handle error
      const errorMessage = chatAPI.createMessage(
        `Sorry, an error occurred: ${response.error}`,
        false
      );
      setMessages((prev) => [...prev, errorMessage]);
      setIsThinking(false);
      setCurrentStreamedMessage("");
      setTimeout(() => scrollToBottom(), 50);
    }
  };

  const handleStartRecording = async () => {
    try {
      // 请求权限
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm.granted) {
        console.warn("Speech permission denied");
        return;
      }

      setIsRecording(true);
      setRecordingTimer(0);

      // 注册事件监听
      const resultListener = ExpoSpeechRecognitionModule.addListener(
        "result",
        (event: any) => {
          if (event.isFinal) {
            voiceTranscriptRef.current = event.results?.[0]?.transcript || "";
            maybeFinalizeVoiceMessage();
          }
        }
      );

      const audioEndListener = ExpoSpeechRecognitionModule.addListener(
        "audioend",
        (event: any) => {
          if (event.uri) {
            voiceUriRef.current = event.uri;
            maybeFinalizeVoiceMessage();
          }
        }
      );

      // 启动识别并持久化音频
      ExpoSpeechRecognitionModule.start({
        lang: "en-US",
        interimResults: false,
        recordingOptions: {
          persist: true,
        },
      });

      // 最长录制 15 秒自动停止
      const timer = setTimeout(() => handleStopRecording(), 15000);
      setRecordingTimeout(timer as unknown as NodeJS.Timeout);

      // 计时器 UI
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTimer((prev) => prev + 1);
      }, 1000);

      // 保存监听到 state 方便清理
      recordingListeners.current = [resultListener, audioEndListener];
    } catch (err) {
      console.error("Failed to start speech recognition", err);
    }
  };

  const maybeFinalizeVoiceMessage = () => {
    if (voiceUriRef.current && voiceTranscriptRef.current) {
      const transcript = voiceTranscriptRef.current;
      const uri = voiceUriRef.current;

      // 创建用户消息
      const userMessage: any = chatAPI.createMessage(
        transcript,
        true,
        "voice",
        {
          uri,
        }
      );
      setMessages((prev) => [...prev, userMessage]);

      // 清理
      voiceUriRef.current = null;
      voiceTranscriptRef.current = null;

      // 开始调用 AI
      setIsThinking(true);
      setCurrentStreamedMessage("");

      const history = chatAPI.buildHistory([...messages, userMessage]);
      chatAPI.sendMessage(transcript, history, handleAIResponse, []);

      setTimeout(() => scrollToBottom(), 50);
    }
  };

  const handleStopRecording = async (hasContent?: boolean) => {
    // hasContent indicates whether we should proceed to finalize voice message
    const shouldKeepContent = Boolean(hasContent);

    setIsRecording(false);

    if (recordingTimeout) {
      clearTimeout(recordingTimeout);
      setRecordingTimeout(null);
    }

    // 停止识别
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch (err) {
      console.warn("stop recognition error", err);
    }

    if (recordingIntervalRef.current) {
      clearTimeout(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    // 移除监听
    recordingListeners.current.forEach((l) => l.remove && l.remove());
    recordingListeners.current = [];

    setRecordingTimer(0);

    // If recording considered canceled / too short, purge any captured data
    if (!shouldKeepContent) {
      voiceUriRef.current = null;
      voiceTranscriptRef.current = null;
    }
  };

  /** 从相册选择图片 */
  const handlePickImage = async () => {
    setShowMoreOptions(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      console.warn("Media library permission denied");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length) {
      const asset = result.assets[0];
      const attachment = {
        id: Date.now().toString(),
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        type: "image" as const,
      };
      setAttachments((prev) => [...prev, attachment]);
      setIsTextMode(true);
    }
  };

  /** 拍照 */
  const handleTakePhoto = async () => {
    setShowMoreOptions(false);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      console.warn("Camera permission denied");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length) {
      const asset = result.assets[0];
      const attachment = {
        id: Date.now().toString(),
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        type: "image" as const,
      };
      setAttachments((prev) => [...prev, attachment]);
      setIsTextMode(true);
    }
  };

  const handleFileUpload = async () => {
    setShowMoreOptions(false);

    try {
      const result: any = await DocumentPicker.getDocumentAsync({
        type: [
          "text/csv",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ],
      });

      if (result?.type === "success") {
        const { uri, name, mimeType } = result;
        const attachment = {
          id: Date.now().toString(),
          uri,
          name,
          mimeType,
          type: "file" as const,
        };
        setAttachments((prev) => [...prev, attachment]);
        setIsTextMode(true);
      }
    } catch (err) {
      console.error("File picker error", err);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // 相机按钮直接调用拍照
  const handleImageUpload = handleTakePhoto;

  const handleAddExpense = () => {
    router.push("/bills/add");
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  // Toggle between text and voice input
  const toggleInputMode = () => {
    setIsTextMode(!isTextMode);
  };

  // Toggle more options
  const toggleMoreOptions = () => {
    setShowMoreOptions(!showMoreOptions);
  };

  return (
    <>
      {/* 背景点击区域 */}
      {isTextMode && (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View
            height="100%"
            width="100%"
            position="absolute"
            top={0}
            left={0}
            zIndex={1}
          />
        </TouchableWithoutFeedback>
      )}
      <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
        <StatusBar barStyle="dark-content" />
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />

        {/* Custom Header */}
        <ChatHeader onAddExpense={handleAddExpense} />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          {/* Chat Messages */}
          <View flex={1} backgroundColor="$gray2">
            {messages.length === 0 ? (
              <WelcomeScreen />
            ) : (
              <ScrollView
                ref={scrollViewRef}
                style={{ flex: 1 }}
                contentContainerStyle={{
                  paddingTop: 16,
                  paddingHorizontal: 0,
                  paddingBottom: 24,
                }}
              >
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}

                {/* Streaming message */}
                {currentStreamedMessage && (
                  <XStack
                    width="80%"
                    maxWidth="80%"
                    marginBottom="$3"
                    alignItems="flex-end"
                    alignSelf="flex-start"
                  >
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
                    <View
                      flex={1}
                      borderRadius={18}
                      borderBottomLeftRadius={4}
                      backgroundColor="$gray100"
                      paddingHorizontal="$3.5"
                      paddingVertical="$2.5"
                    >
                      <Text fontSize={16} lineHeight={22} color="$gray800">
                        {currentStreamedMessage}
                      </Text>
                    </View>
                  </XStack>
                )}

                {/* Thinking indicator */}
                {isThinking && !currentStreamedMessage && (
                  <XStack
                    width="80%"
                    maxWidth="80%"
                    marginBottom="$3"
                    alignItems="flex-end"
                    alignSelf="flex-start"
                  >
                    <View
                      flexDirection="row"
                      alignItems="center"
                      borderRadius={18}
                      borderBottomLeftRadius={4}
                      backgroundColor="$gray100"
                      paddingHorizontal="$3.5"
                      paddingVertical="$2"
                    >
                      <ActivityIndicator size="small" color="#3B82F6" />
                      <Text marginLeft="$2" fontSize={14} color="$gray500">
                        Thinking...
                      </Text>
                    </View>
                  </XStack>
                )}
              </ScrollView>
            )}
          </View>

          {/* Input area */}
          <ChatInput
            isTextMode={isTextMode}
            inputText={inputText}
            isRecording={isRecording}
            recordingTimer={recordingTimer}
            onChangeText={setInputText}
            onSend={handleSend}
            onToggleInputMode={toggleInputMode}
            onToggleMoreOptions={toggleMoreOptions}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            onImageUpload={handleImageUpload}
            attachments={attachments}
            onRemoveAttachment={removeAttachment}
          />

          {/* More options modal */}
          {showMoreOptions && (
            <MoreOptions
              onPickImage={handlePickImage}
              onTakePhoto={handleTakePhoto}
              onFileUpload={handleFileUpload}
            />
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

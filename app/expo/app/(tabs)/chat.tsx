import React, { useState, useEffect, useRef } from "react";
import {
  KeyboardAvoidingView,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { XStack, Text, View } from "tamagui";
import { chatAPI, Message, AIResponseType } from "@/utils/api";
import { saveBill } from "@/utils/bills.utils";
import { updateUserPreferences } from "@/utils/userPreferences.utils";
import { useAuth } from "@/providers/AuthProvider";
import { useData } from "@/providers/DataProvider";
import uuid from "react-native-uuid";
import * as Localization from "expo-localization";

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
import * as Clipboard from "expo-clipboard";

// Utility to persist selected files inside the app sandbox
import { copyFileToDocumentDir, clearCachedFiles } from "@/utils/file.utils";

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
  const [isThinking, setIsThinking] = useState(false);
  const [currentStreamedMessage, setCurrentStreamedMessage] = useState("");
  const [attachments, setAttachments] = useState<any[]>([]);

  /**
   * Speech recognition language (derived from device locale).
   * Some devices return extended locale strings (e.g. "zh-Hans-CN"),
   * which are not recognised by native speech APIs.  Here we coerce the
   * string into a simple `xx-XX` pattern and provide a safe fallback.
   */
  const [speechLang] = useState<string>(() => {
    const rawLocale = Localization.locale || "en-US";

    // Common language mapping (extend as needed)
    const langMap: Record<string, string> = {
      zh: "zh-CN",
      en: "en-US",
      ja: "ja-JP",
      ko: "ko-KR",
    };

    // If the locale already matches the simple pattern (e.g. en-US), use it.
    if (/^[a-z]{2}-[A-Z]{2}$/.test(rawLocale)) {
      return rawLocale;
    }

    // Otherwise try to map by the primary language sub-tag.
    const primary = rawLocale.split(/[\-_]/)[0]; // handle zh-Hans-CN, en_US etc.
    return langMap[primary] || "en-US";
  });

  /** Cache microphone permission so we don't request every time */
  const [micPermissionGranted, setMicPermissionGranted] =
    useState<boolean>(false);

  // Handle max recording duration timeout (e.g., 60 s)
  const [recordingTimeout, setRecordingTimeout] =
    useState<NodeJS.Timeout | null>(null);

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

  /** 处理 Quick Screenshot Deeplink 参数 */
  const params = useLocalSearchParams();
  const autoSend = params.autoSend === "1" || params.autoSend === "true";
  // tmpPath is URL-encoded on the native side; decode and normalise here.
  const tmpPathRaw =
    typeof params.tmpPath === "string" ? (params.tmpPath as string) : undefined;
  const tmpPath = tmpPathRaw ? decodeURIComponent(tmpPathRaw) : undefined;


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

  // 若带有 tmpPath 或 autoSend 参数，则尝试自动附加并发送截图
  useEffect(() => {

    (async () => {
      try {
        if(!tmpPath)return
        // 处理来自 AppIntent 的临时文件路径
        let sourceUri = tmpPath;
        if (!sourceUri.startsWith("file://")) {
          sourceUri = `file://${sourceUri}`;
        }

        const info = await FileSystem.getInfoAsync(sourceUri);
        if (!info.exists) {
          console.warn("tmpPath does not exist", sourceUri);
          showSystemError("Screenshot not found – please try again.");
          return;
        }

        // 重用 util 函数统一复制逻辑，避免重复代码
        const destUri = await copyFileToDocumentDir(
          sourceUri,
          "chat_images"
        ).catch((e) => {
          console.warn("Copy screenshot error", e);
          showSystemError("Failed to import screenshot");
          throw e;
        });

        const attachment = {
          id: Date.now().toString(),
          uri: destUri,
          type: "image" as const,
        };
        setAttachments([attachment]);

        if (autoSend) {
          handleSend([attachment])
        }


      } catch (err: any) {
        console.warn("Quick attach failed", err);
        showSystemError(
          `Quick attach failed: ${err?.message || "Unknown error"}`
        );
      }
    })();
  }, [autoSend, tmpPath]);

  // Check microphone permission on mount so we avoid asking every time the user starts recording
  useEffect(() => {
    (async () => {
      try {
        if (ExpoSpeechRecognitionModule.getPermissionsAsync) {
          const current =
            await ExpoSpeechRecognitionModule.getPermissionsAsync();
          setMicPermissionGranted(!!current?.granted);
        }
      } catch (err) {
        console.warn("Failed to get speech permission status", err);
      }
    })();
  }, []);

  const handleSend = async (directlySendAttachments?:any[]) => {
    if (inputText.trim() === "" && attachments.length === 0&&!directlySendAttachments?.length) return;
    const attachmentsToSend=directlySendAttachments||attachments

    setIsTextMode(false);
    Keyboard.dismiss();
    // clear input and attachments
    setInputText("");
    setAttachments([]);

    // Prepare attachments payload for API
    const attachmentsPayload: import("@/utils/api").AttachmentPayload[] = [];
    for (const att of attachmentsToSend) {
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
      } catch (e: any) {
        console.warn("Failed to read attachment", e);
        showSystemError(
          `Failed to read attachment: ${e?.message || "unknown error"}`
        );
      }
    }

    // Build user message combining text & attachments (for local UI)
    const combinedMessage = chatAPI.createMessage(inputText, true, "text", {
      attachments:attachmentsToSend,
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
      // Ensure we have permission (request if not yet granted)
      if (!micPermissionGranted) {
        const perm =
          await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (!perm.granted) {
          console.warn("Speech permission denied");
          return;
        }
        setMicPermissionGranted(true);
      }

      setIsRecording(true);

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

      // Capture audio URI when recording starts (some platforms may not emit a valid URI in `audioend`)
      const audioStartListener = ExpoSpeechRecognitionModule.addListener(
        "audiostart",
        (event: any) => {
          if (event.uri) {
            voiceUriRef.current = event.uri;
            // Attempt to finalize if transcript already ready
            maybeFinalizeVoiceMessage();
          }
        }
      );

      const audioEndListener = ExpoSpeechRecognitionModule.addListener(
        "audioend",
        (event: any) => {
          if (event.uri) {
            voiceUriRef.current = event.uri;
            // Attempt to finalize once recording stops
            maybeFinalizeVoiceMessage();
          }
        }
      );

      // Capture errors for easier debugging
      const errorListener = ExpoSpeechRecognitionModule.addListener(
        "error",
        (event: any) => {
          console.warn("Speech recognition error", event);

          // Stop recording state so UI updates immediately
          setIsRecording(false);

          // Show a chat message to let the user know something went wrong
          const friendlyMessage =
            event?.error || event?.message || "Unknown recording error";
          const errorBubble = chatAPI.createMessage(
            `⚠️  Recording error: ${friendlyMessage}`,
            false,
            "text",
            { type: "system_error" }
          );
          setMessages((prev) => [...prev, errorBubble]);
          setTimeout(() => scrollToBottom(), 50);
        }
      );

      // 启动识别并持久化音频
      ExpoSpeechRecognitionModule.start({
        lang: speechLang,
        interimResults: false,
        recordingOptions: {
          persist: true,
        },
      });

      // 最长录制 15 秒自动停止
      const timer = setTimeout(() => handleStopRecording(), 60000);
      setRecordingTimeout(timer as unknown as NodeJS.Timeout);

      // Listen for 'end' event to cleanup listeners safely after final result
      const endListener = ExpoSpeechRecognitionModule.addListener("end", () => {
        recordingListeners.current.forEach((l) => l.remove && l.remove());
        recordingListeners.current = [];
        if (recordingTimeout) {
          clearTimeout(recordingTimeout);
          setRecordingTimeout(null);
        }
      });

      // 保存监听到 state 方便清理
      recordingListeners.current = [
        resultListener,
        audioStartListener,
        audioEndListener,
        errorListener,
        endListener,
      ];
    } catch (err) {
      console.error("Failed to start speech recognition", err);
    }
  };

  /**
   * When both transcript and audio URI are available, create a voice message and
   * send the transcript to the AI. The audio file will be playable inside the
   * chat via the `MessageBubble` component.
   */
  const maybeFinalizeVoiceMessage = () => {
    if (voiceTranscriptRef.current) {
      const transcript = voiceTranscriptRef.current as string;

      // Create a regular text message from the transcript
      const userMessage: any = chatAPI.createMessage(transcript, true, "text");

      setMessages((prev) => [...prev, userMessage]);

      // Clean refs to avoid duplicate sends
      voiceTranscriptRef.current = null;
      voiceUriRef.current = null;

      // Trigger AI response
      setIsThinking(true);
      setCurrentStreamedMessage("");

      const history = chatAPI.buildHistory([...messages, userMessage]);
      chatAPI.sendMessage(transcript, history, handleAIResponse, []);

      setTimeout(() => scrollToBottom(), 50);
    }
  };

  /**
   * Stop the speech recognition session.
   * We no longer cancel short recordings (<3s). Even brief utterances should be
   * transcribed and sent as a message, so we avoid clearing the transcript
   * refs here.  We only clean up timers / listeners.
   */
  const handleStopRecording = async () => {
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

    // 不再立即移除监听，等待 'end' 事件清理

    // In case the final result came in before `audioend`, ensure we try to
    // finalize once recording is stopped.
    maybeFinalizeVoiceMessage();
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
      // Persist a local copy so the image remains even if deleted from gallery
      const localUri = await copyFileToDocumentDir(asset.uri, "chat_images");
      const attachment = {
        id: Date.now().toString(),
        uri: localUri,
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
      // Persist a local copy so the image remains even if deleted from gallery
      const localUri = await copyFileToDocumentDir(asset.uri, "chat_images");
      const attachment = {
        id: Date.now().toString(),
        uri: localUri,
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
      if (result.assets?.length) {
        const tmpAttachments: any[] = [];
        for (const asset of result.assets) {
          const { uri, name, mimeType } = asset;
          const attachment = {
            id: uuid.v4(),
            uri,
            name,
            mimeType,
            type: "file" as const,
          };
          tmpAttachments.push(attachment);
        }
        setAttachments((prev) => [...prev, ...tmpAttachments]);
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

  /** Clear all chat messages */
  const handleClearChat = () => {
    if (messages.length === 0 && currentStreamedMessage === "") return;

    Alert.alert("Clear Chat", "Are you sure you want to delete all messages?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => {
          setMessages([]);
          setCurrentStreamedMessage("");
          setAttachments([]);
          // Remove cached images so they don't occupy storage after chat is cleared
          clearCachedFiles("chat_images");
        },
      },
    ]);
  };

  /** Helper to display a user-visible error bubble */
  const showSystemError = (text: string) => {
    const errMsg = chatAPI.createMessage(`⚠️  ${text}`, false, "text", {
      type: "system_error",
    });
    setMessages((prev) => [...prev, errMsg]);
    // Ensure it becomes visible
    setTimeout(() => scrollToBottom(), 50);
  };

  return (
    <>
      {/* 背景点击区域 */}
      {isTextMode && (
        <TouchableWithoutFeedback
          onPress={() => {
            Keyboard.dismiss();
            setIsTextMode(false);
          }}
          accessible={false}
        >
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

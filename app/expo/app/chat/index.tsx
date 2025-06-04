import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  GiftedChat,
  IMessage,
  Send,
  InputToolbar,
  Composer,
} from "react-native-gifted-chat";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import {
  ArrowLeft,
  Paperclip,
  Send as SendIcon,
  Image as ImageIcon,
  FileText,
} from "lucide-react-native";
import { useLanguage } from "@/hooks/useLanguage";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

interface TransactionData {
  amount: number;
  category: string;
  merchant?: string;
  date: string;
  notes?: string;
}

export default function ChatPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useLanguage();
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // 判断是否在家庭空间上下文中
  const isInFamilyContext = params.context === "family";
  const familySpaceName = (params.familySpaceName as string) || "";

  React.useEffect(() => {
    // 初始欢迎消息
    setMessages([
      {
        _id: 1,
        text: isInFamilyContext
          ? t(
              `Hello! I'm your smart accounting assistant. You are recording transactions for "${familySpaceName}". How can I help you today?`
            )
          : t(
              "Hello! I'm your smart accounting assistant. You are recording personal transactions. How can I help you today?"
            ),
        createdAt: new Date(),
        user: {
          _id: 2,
          name: "AI Assistant",
        },
      },
    ]);
  }, [isInFamilyContext, familySpaceName]);

  const processAIResponse = async (userInput: string) => {
    setIsProcessing(true);

    // TODO: 调用 AI 解析服务
    // 模拟 AI 解析结果
    setTimeout(() => {
      const mockTransaction: TransactionData = {
        amount: 58,
        category: "餐饮",
        merchant: "超市",
        date: new Date().toISOString(),
        notes: userInput,
      };

      const confirmMessage: IMessage = {
        _id: Math.random(),
        text: t(
          `I've parsed your transaction:\n\nAmount: ¥${mockTransaction.amount}\nCategory: ${mockTransaction.category}\nMerchant: ${mockTransaction.merchant}\nDate: ${new Date(mockTransaction.date).toLocaleDateString()}\n\nIs this correct?`
        ),
        createdAt: new Date(),
        user: {
          _id: 2,
          name: "AI Assistant",
        },
        quickReplies: {
          type: "radio",
          values: [
            { title: t("Confirm and Save"), value: "confirm" },
            { title: t("Edit"), value: "edit" },
            { title: t("Cancel"), value: "cancel" },
          ],
        },
      };

      setMessages((previousMessages) =>
        GiftedChat.append(previousMessages, [confirmMessage])
      );
      setIsProcessing(false);
    }, 1000);
  };

  const onSend = useCallback((messages: IMessage[] = []) => {
    setMessages((previousMessages) =>
      GiftedChat.append(previousMessages, messages)
    );

    // 处理用户输入
    const userMessage = messages[0];
    if (userMessage && userMessage.text) {
      processAIResponse(userMessage.text);
    }
  }, []);

  const handleImagePicker = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      // TODO: 处理图片上传和 OCR 识别
      Alert.alert(t("Image Selected"), t("Processing receipt image..."));
    }
  };

  const handleDocumentPicker = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ],
    });

    if (!result.canceled) {
      // TODO: 处理文件上传和解析
      Alert.alert(t("File Selected"), t("Processing file..."));
    }
  };

  const renderInputToolbar = (props: any) => {
    return (
      <InputToolbar
        {...props}
        containerStyle={{
          backgroundColor: "white",
          borderTopColor: "#E5E7EB",
          borderTopWidth: 1,
          paddingHorizontal: 8,
          paddingVertical: 6,
        }}
      />
    );
  };

  const renderComposer = (props: any) => {
    return (
      <View className="flex-row items-center flex-1">
        <TouchableOpacity onPress={handleImagePicker} className="p-2">
          <ImageIcon size={24} color="#6B7280" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDocumentPicker} className="p-2">
          <FileText size={24} color="#6B7280" />
        </TouchableOpacity>
        <Composer
          {...props}
          textInputStyle={{
            fontSize: 16,
            lineHeight: 20,
            marginLeft: 8,
            marginRight: 8,
            paddingTop: 8,
            paddingBottom: 8,
          }}
          placeholder={t("Type a message or describe your expense...")}
        />
      </View>
    );
  };

  const renderSend = (props: any) => {
    return (
      <Send {...props} containerStyle={{ justifyContent: "center" }}>
        <View className="mr-2 mb-1">
          <SendIcon size={24} color="#3B82F6" />
        </View>
      </Send>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: t("Smart Accounting Assistant"),
          headerTitleAlign: "center",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="p-2">
              <ArrowLeft size={24} color="#000" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push("/transactions/add")}
              className="p-2"
            >
              <Text className="text-blue-500 font-medium">{t("Manual")}</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
          keyboardVerticalOffset={90}
        >
          {isInFamilyContext && (
            <View className="bg-blue-50 px-4 py-2 border-b border-blue-100">
              <Text className="text-sm text-blue-700 text-center">
                {t(`Recording for "${familySpaceName}"`)}
              </Text>
            </View>
          )}

          <GiftedChat
            messages={messages}
            onSend={onSend}
            user={{
              _id: 1,
            }}
            placeholder={t("Type a message...")}
            renderInputToolbar={renderInputToolbar}
            renderComposer={renderComposer}
            renderSend={renderSend}
            isTyping={isProcessing}
            showUserAvatar={false}
            renderAvatarOnTop
            messagesContainerStyle={{
              backgroundColor: "#F9FAFB",
            }}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

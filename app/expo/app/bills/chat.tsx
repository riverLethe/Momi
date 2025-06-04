import React, { useState, useCallback, useEffect } from "react";
import { View as RNView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Edit, Pencil } from "lucide-react-native";
import {
  GiftedChat,
  Bubble,
  Send,
  InputToolbar,
} from "react-native-gifted-chat";
import {
  View,
  Text,
  Button,
  XStack,
  YStack,
  H4,
  Circle,
} from "tamagui";

import { useViewStore } from "@/stores/viewStore";
import { useAuth } from "@/providers/AuthProvider";

// Mock AI for bill processing (in a real app, this would call an API)
const mockBillProcessing = (text: string) => {
  // Simple parsing logic
  const amountMatch = text.match(/(\d+(\.\d+)?)/);
  const amount = amountMatch ? parseFloat(amountMatch[0]) : 0;

  // Try to extract category
  let category = "Other";
  if (text.includes("food") || text.includes("餐") || text.includes("eat")) {
    category = "Food";
  } else if (
    text.includes("transport") ||
    text.includes("bus") ||
    text.includes("taxi")
  ) {
    category = "Transport";
  } else if (text.includes("shop") || text.includes("buy")) {
    category = "Shopping";
  }

  return {
    amount,
    category,
    date: new Date(),
    merchant: "Auto-detected",
    notes: text,
  };
};

export default function BillChatScreen() {
  const router = useRouter();
  const { viewMode, currentFamilySpace } = useViewStore();
  const { isLoggedIn, user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [billData, setBillData] = useState<any>(null);

  useEffect(() => {
    // Welcome message when the chat is loaded
    setMessages([
      {
        _id: 1,
        text: `Hello! I'm your bill assistant. Tell me about your spending${viewMode === "family" ? ` for ${currentFamilySpace?.name || "your family"}` : ""}.`,
        createdAt: new Date(),
        user: {
          _id: 2,
          name: "AI Assistant",
          avatar: "https://placehold.co/100x100/3B82F6/FFFFFF.png?text=AI",
        },
      },
    ]);
  }, []);

  // Check if family mode is available
  useEffect(() => {
    if (viewMode === "family" && !isLoggedIn) {
      Alert.alert(
        "Login Required",
        "You need to login to record family bills.",
        [
          { text: "Continue as personal", onPress: () => router.back() },
          { text: "Login", onPress: () => router.push("/auth/login") },
        ]
      );
    }
  }, [viewMode, isLoggedIn]);

  const onSend = useCallback((newMessages: any = []) => {
    setMessages((previousMessages) =>
      GiftedChat.append(previousMessages, newMessages)
    );

    // Process the user message
    const userMessage = newMessages[0]?.text || "";

    // Give the AI some time to "think"
    setTimeout(() => {
      // Parse the message
      const processedBill = mockBillProcessing(userMessage);
      setBillData(processedBill);

      // AI response
      const botMessage = {
        _id: Math.round(Math.random() * 1000000),
        text: `I detected a ${processedBill.category} expense of ¥${processedBill.amount}. Is this correct?`,
        createdAt: new Date(),
        user: {
          _id: 2,
          name: "AI Assistant",
          avatar: "https://placehold.co/100x100/3B82F6/FFFFFF.png?text=AI",
        },
        // Custom bill summary component can be added here
      };

      setMessages((previousMessages) =>
        GiftedChat.append(previousMessages, [botMessage])
      );
    }, 1000);
  }, []);

  const renderBubble = (props: any) => {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: "#3B82F6",
          },
          left: {
            backgroundColor: "#F3F4F6",
          },
        }}
        textStyle={{
          right: {
            color: "#FFFFFF",
          },
          left: {
            color: "#1F2937",
          },
        }}
      />
    );
  };

  const renderInputToolbar = (props: any) => {
    return (
      <InputToolbar
        {...props}
        containerStyle={{
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
          padding: 4,
        }}
      />
    );
  };

  const renderSend = (props: any) => {
    return (
      <Send
        {...props}
        containerStyle={{
          justifyContent: "center",
          alignItems: "center",
          marginRight: 10,
          marginBottom: 5,
        }}
      >
        <Circle size="$4" backgroundColor="$blue9" alignItems="center" justifyContent="center">
          <Text color="white" fontWeight="$7">→</Text>
        </Circle>
      </Send>
    );
  };

  const renderActions = () => {
    if (billData) {
      return (
        <Button
          size="$3"
          marginBottom="$2"
          marginLeft="$2"
          backgroundColor="$green9"
          onPress={() => {
            router.push({
              pathname: "/bills/add",
              params: billData,
            } as any);
          }}
        >
          <Text color="white" fontWeight="$6">Save Bill</Text>
        </Button>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <XStack 
        alignItems="center" 
        justifyContent="space-between" 
        padding="$4" 
        borderBottomWidth={1} 
        borderBottomColor="$gray4"
      >
        <Button 
          chromeless
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1F2937" />
        </Button>

        <H4>
          {viewMode === "family"
            ? `Recording for ${currentFamilySpace?.name || "Family"}`
            : "Personal Recording"}
        </H4>

        <Button 
          chromeless
          onPress={() => router.push("/bills/add" as any)}
        >
          <Pencil size={24} color="#1F2937" />
        </Button>
      </XStack>

      <View flex={1}>
        <GiftedChat
          messages={messages}
          onSend={onSend}
          user={{
            _id: 1,
            name: isLoggedIn ? user?.username : "Guest",
          }}
          renderBubble={renderBubble}
          renderInputToolbar={renderInputToolbar}
          renderSend={renderSend}
          renderActions={renderActions}
          placeholder="Tell me about your spending..."
          alwaysShowSend
          inverted
        />
      </View>
    </SafeAreaView>
  );
}

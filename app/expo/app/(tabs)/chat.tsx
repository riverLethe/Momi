import React, { useState, useEffect, useRef } from 'react';
import { 
  KeyboardAvoidingView, 
  Platform, 
  SafeAreaView, 
  StatusBar,
  ScrollView,
  Animated,
  ActivityIndicator
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { XStack, YStack, Text, View } from 'tamagui';
import { chatAPI, Message, AIResponseType } from '@/utils/api';

// Import components
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { WelcomeScreen } from '@/components/chat/WelcomeScreen';
import { MoreOptions } from '@/components/chat/MoreOptions';

export default function ChatScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTextMode, setIsTextMode] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [recordingTimer, setRecordingTimer] = useState(0);
  const [recordingTimeout, setRecordingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [currentStreamedMessage, setCurrentStreamedMessage] = useState('');
  
  const scrollViewRef = useRef<ScrollView>(null);
  const micButtonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Clean up timer on unmount
    return () => {
      if (recordingTimeout) {
        clearInterval(recordingTimeout);
      }
    };
  }, [recordingTimeout]);

  const handleSend = async () => {
    if (inputText.trim() === '') return;
    
    // Add user message
    const userMessage = chatAPI.createMessage(inputText, true);
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    
    // Scroll to bottom immediately after user sends message
    setTimeout(() => scrollToBottom(), 50);
    
    // Prepare for AI response
    setIsThinking(true);
    setCurrentStreamedMessage('');
    
    // Get message history for API
    const history = chatAPI.buildHistory(messages);
    
    // Send message to API and handle streaming response
    await chatAPI.sendMessage(inputText, history, handleAIResponse);
  };
  
  // Handle streaming AI response
  const handleAIResponse = (response: AIResponseType) => {
    if (response.type === 'thinking') {
      setIsThinking(response.content);
      
      // If thinking ended and we have collected streamed message, add it as a complete message
      if (!response.content && currentStreamedMessage) {
        const aiMessage = chatAPI.createMessage(currentStreamedMessage, false);
        setMessages(prev => [...prev, aiMessage]);
        setCurrentStreamedMessage('');
        setTimeout(() => scrollToBottom(), 50);
      }
    } 
    else if (response.type === 'chunk') {
      // Add chunk to current streamed message
      setCurrentStreamedMessage(prev => prev + response.content);
      setTimeout(() => scrollToBottom(), 50);
    }
    else if (response.type === 'command') {
      // Handle different command types
      if (response.command === 'CREATE_EXPENSE' && response.data) {
        // Create a new expense message with the data
        const expenseMessage = chatAPI.createMessage(
          response.result, 
          false, 
          'text',
          { type: 'expense', expense: response.data }
        );
        setMessages(prev => [...prev, expenseMessage]);
      }
      else if (response.command === 'LIST_EXPENSES' && response.data) {
        // Set expense data for display and create a message
        const listMessage = chatAPI.createMessage(
          response.result, 
          false, 
          'text',
          { type: 'expense_list', expenses: response.data }
        );
        setMessages(prev => [...prev, listMessage]);
      }
      else if (response.command === 'EXPENSE_DETAILS' && response.data) {
        // Create a message with expense details
        const detailMessage = chatAPI.createMessage(
          response.result, 
          false, 
          'text',
          { type: 'expense_detail', expense: response.data }
        );
        setMessages(prev => [...prev, detailMessage]);
      }
      else if (response.command === 'ANALYZE_EXPENSES' && response.data) {
        // Create a message with expense analysis
        const analysisMessage = chatAPI.createMessage(
          response.result, 
          false, 
          'text',
          { type: 'expense_analysis', analysis: response.data }
        );
        setMessages(prev => [...prev, analysisMessage]);
      }
      else {
        // For other commands or if no data
        const commandMessage = chatAPI.createMessage(response.result, false);
        setMessages(prev => [...prev, commandMessage]);
      }
      
      setTimeout(() => scrollToBottom(), 50);
    }
    else if (response.type === 'complete') {
      // Add complete message
      const aiMessage = chatAPI.createMessage(response.content, false);
      setMessages(prev => [...prev, aiMessage]);
      setCurrentStreamedMessage('');
      setTimeout(() => scrollToBottom(), 50);
    }
    else if (response.type === 'error') {
      // Handle error
      const errorMessage = chatAPI.createMessage(`Sorry, an error occurred: ${response.error}`, false);
      setMessages(prev => [...prev, errorMessage]);
      setIsThinking(false);
      setCurrentStreamedMessage('');
      setTimeout(() => scrollToBottom(), 50);
    }
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingTimer(0);
    
    // Animate mic button
    Animated.sequence([
      Animated.timing(micButtonScale, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(micButtonScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Start a timer for recording (max 3 seconds)
    const timer = setInterval(() => {
      setRecordingTimer((prev) => {
        if (prev >= 3) {
          handleStopRecording(true);
          clearInterval(timer);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    
    setRecordingTimeout(timer);
  };
  
  const handleStopRecording = async (hasContent = false) => {
    setIsRecording(false);
    
    if (recordingTimeout) {
      clearInterval(recordingTimeout);
      setRecordingTimeout(null);
    }
    
    if (hasContent) {
      // Add voice message from user
      const userMessage = chatAPI.createMessage('🎤 Voice message', true, 'voice');
      setMessages(prev => [...prev, userMessage]);
      
      // Prepare for AI response
      setIsThinking(true);
      setCurrentStreamedMessage('');
      
      // Get message history for API
      const history = chatAPI.buildHistory(messages);
      
      // Simulate voice transcription with default message
      const transcribedText = "Please help me record an expense";
      
      // Send message to API and handle streaming response
      await chatAPI.sendMessage(transcribedText, history, handleAIResponse);
      
      setTimeout(() => scrollToBottom(), 50);
    }
  };

  const handleImageUpload = async () => {
    setShowMoreOptions(false);
    
    // Simulate image upload
    const userMessage = chatAPI.createMessage('📷 Image', true, 'image');
    setMessages(prev => [...prev, userMessage]);
    
    // Prepare for AI response
    setIsThinking(true);
    setCurrentStreamedMessage('');
    
    // Get message history for API
    const history = chatAPI.buildHistory(messages);
    
    // Simulate image transcription with default message
    const transcribedText = "This is a receipt, please help me record this expense";
    
    // Send message to API and handle streaming response
    await chatAPI.sendMessage(transcribedText, history, handleAIResponse);
    
    setTimeout(() => scrollToBottom(), 50);
  };

  const handleFileUpload = async () => {
    setShowMoreOptions(false);
    
    // Simulate file upload
    const userMessage = chatAPI.createMessage('📄 File', true, 'file');
    setMessages(prev => [...prev, userMessage]);
    
    // Prepare for AI response
    setIsThinking(true);
    setCurrentStreamedMessage('');
    
    // Get message history for API
    const history = chatAPI.buildHistory(messages);
    
    // Simulate file transcription with default message
    const transcribedText = "This is my expense file, please analyze my spending";
    
    // Send message to API and handle streaming response
    await chatAPI.sendMessage(transcribedText, history, handleAIResponse);
    
    setTimeout(() => scrollToBottom(), 50);
  };

  const handleAddExpense = () => {
    router.push('/bills/add');
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
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen
        options={{
          headerShown: false
        }}
      />
      
      {/* Custom Header */}
      <ChatHeader onAddExpense={handleAddExpense} />
      
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Chat Messages */}
        <View flex={1} backgroundColor="$gray50">
          {messages.length === 0 ? (
            <WelcomeScreen />
          ) : (
            <ScrollView 
              ref={scrollViewRef}
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
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
          isThinking={isThinking}
          showMoreOptions={showMoreOptions}
          micButtonScale={micButtonScale}
          onChangeText={setInputText}
          onSend={handleSend}
          onToggleInputMode={toggleInputMode}
          onToggleMoreOptions={toggleMoreOptions}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          onImageUpload={handleImageUpload}
        />
        
        {/* More options modal */}
        {showMoreOptions && (
          <MoreOptions 
            onImageUpload={handleImageUpload}
            onFileUpload={handleFileUpload}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

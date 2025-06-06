import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  KeyboardAvoidingView, 
  Platform, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  TextInput,
  ScrollView,
  Image,
  Dimensions,
  Animated,
  Pressable,
  Modal
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Button, Text, XStack, YStack, Circle } from 'tamagui';
import { Mic, Camera, Send, Plus, Image as ImageIcon, File, Keyboard, PlusCircle } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

// Define message type
interface Message {
  id: string;
  text: string;
  timestamp: Date;
  isUser: boolean;
}

export default function ChatScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTextMode, setIsTextMode] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [recordingTimer, setRecordingTimer] = useState(0);
  const [recordingTimeout, setRecordingTimeout] = useState<NodeJS.Timeout | null>(null);
  
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

  const handleSend = () => {
    if (inputText.trim() === '') return;
    
    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      text: inputText,
      timestamp: new Date(),
      isUser: true,
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    
    // Simulate AI response after a delay
    setTimeout(() => {
      let responseText = '';
      
      if (inputText.toLowerCase().includes('coffee') || inputText.toLowerCase().includes('starbucks')) {
        responseText = "I've recorded your coffee purchase. Would you like to categorize this as 'Food & Drinks'?";
      } else if (inputText.toLowerCase().includes('grocery') || inputText.toLowerCase().includes('supermarket')) {
        responseText = "Got it! I've added your grocery shopping expense. Would you like to see your monthly grocery spending?";
      } else if (inputText.toLowerCase().includes('restaurant') || inputText.toLowerCase().includes('dinner')) {
        responseText = "I've recorded your dining expense. Your dining budget is 70% spent for this month.";
      } else if (inputText.toLowerCase().includes('taxi') || inputText.toLowerCase().includes('uber')) {
        responseText = "I've logged your transportation expense. You've spent ¥320 on transportation this week.";
      } else {
        responseText = "I've recorded your expense. Would you like to add any details like category or payment method?";
      }
      
      const aiMessage = {
        id: Date.now().toString(),
        text: responseText,
        timestamp: new Date(),
        isUser: false,
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Scroll to bottom after new message
      setTimeout(() => scrollToBottom(), 100);
    }, 1000);
    
    // Scroll to bottom immediately after user sends message
    setTimeout(() => scrollToBottom(), 50);
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
  
  const handleStopRecording = (hasContent = false) => {
    setIsRecording(false);
    
    if (recordingTimeout) {
      clearInterval(recordingTimeout);
      setRecordingTimeout(null);
    }
    
    if (hasContent) {
      // Add voice message from user
      const userMessage = {
        id: Date.now().toString(),
        text: '🎤 Voice message',
        timestamp: new Date(),
        isUser: true,
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // AI response to voice message
      setTimeout(() => {
        const aiMessage = {
          id: Date.now().toString(),
          text: "I've received your voice message. Would you like me to help you add an expense?",
          timestamp: new Date(),
          isUser: false,
        };
        
        setMessages(prev => [...prev, aiMessage]);
        setTimeout(() => scrollToBottom(), 100);
      }, 1000);
      
      setTimeout(() => scrollToBottom(), 50);
    }
  };

  const handleImageUpload = () => {
    setShowMoreOptions(false);
    
    // Simulate image upload
    const userMessage = {
      id: Date.now().toString(),
      text: '📷 Image',
      timestamp: new Date(),
      isUser: true,
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // AI response to image
    setTimeout(() => {
      const aiMessage = {
        id: Date.now().toString(),
        text: "I've received your image. Is this a receipt you'd like me to process?",
        timestamp: new Date(),
        isUser: false,
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setTimeout(() => scrollToBottom(), 100);
    }, 1000);
    
    setTimeout(() => scrollToBottom(), 50);
  };

  const handleFileUpload = () => {
    setShowMoreOptions(false);
    
    // Simulate file upload
    const userMessage = {
      id: Date.now().toString(),
      text: '📄 File',
      timestamp: new Date(),
      isUser: true,
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // AI response to file
    setTimeout(() => {
      const aiMessage = {
        id: Date.now().toString(),
        text: "I've received your file. Would you like me to extract expense information from it?",
        timestamp: new Date(),
        isUser: false,
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setTimeout(() => scrollToBottom(), 100);
    }, 1000);
    
    setTimeout(() => scrollToBottom(), 50);
  };

  const handleAddExpense = () => {
    router.push('/add-expense');
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  // Format time to display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Toggle between text and voice input
  const toggleInputMode = () => {
    setIsTextMode(!isTextMode);
  };

  // Welcome screen when no messages
  const renderWelcomeScreen = () => (
    <View style={styles.welcomeContainer}>
      <Image 
        source={{ uri: 'https://placehold.co/300x300/3B82F6/FFFFFF.png?text=AI' }}
        style={styles.welcomeImage}
      />
      <Text style={styles.welcomeTitle}>Welcome to Momi AI Assistant</Text>
      <Text style={styles.welcomeSubtitle}>I can help you track expenses, manage your budget, and provide financial insights.</Text>
      <Text style={styles.welcomePrompt}>Hold the mic button and speak to start</Text>
    </View>
  );

  // Custom header component
  const renderCustomHeader = () => (
    <View style={styles.customHeader}>
      <View style={styles.headerLeft} />
      <View style={styles.headerCenter}>
        <View style={styles.logoContainer}>
          <Image
            source={{ uri: 'https://placehold.co/100x100/3B82F6/FFFFFF.png?text=M' }}
            style={styles.logoImage}
          />
        </View>
        <Text style={styles.headerTitle}>Momi</Text>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity 
          style={styles.addExpenseButton}
          onPress={handleAddExpense}
        >
          <PlusCircle size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen
        options={{
          headerShown: false
        }}
      />
      
      {/* Custom Header */}
      {renderCustomHeader()}
      
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Chat Messages */}
        <View style={styles.chatContainer}>
          {messages.length === 0 ? (
            renderWelcomeScreen()
          ) : (
            <ScrollView 
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
            >
              {messages.map((message) => (
                <View 
                  key={message.id} 
                  style={[
                    styles.messageBubble,
                    message.isUser ? styles.userMessage : styles.aiMessage
                  ]}
                >
                  {!message.isUser && (
                    <View style={styles.aiIconContainer}>
                      <Text style={styles.aiIconText}>AI</Text>
                    </View>
                  )}
                  <View style={[
                    styles.messageContent,
                    message.isUser ? styles.userMessageContent : styles.aiMessageContent
                  ]}>
                    <Text 
                      style={[
                        styles.messageText,
                        message.isUser ? styles.userMessageText : styles.aiMessageText
                      ]}
                    >
                      {message.text}
                    </Text>
                    <Text 
                      style={[
                        styles.messageTime,
                        message.isUser ? styles.userMessageTime : styles.aiMessageTime
                      ]}
                    >
                      {formatTime(message.timestamp)}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
        
        {/* Input area */}
        <View style={styles.inputContainer}>
          {/* Voice mode input */}
          {!isTextMode ? (
            <XStack alignItems="center" justifyContent="space-between" style={styles.voiceInputRow}>
              <TouchableOpacity style={styles.iconButton} onPress={handleImageUpload}>
                <Camera size={22} color="#4B5563" />
              </TouchableOpacity>
              
              <Pressable 
                style={styles.voiceButton}
                onPressIn={handleStartRecording}
                onPressOut={() => handleStopRecording(recordingTimer > 0)}
              >
                <Text style={styles.voiceButtonText}>
                  {isRecording ? `Recording ${3 - recordingTimer}s...` : "Hold to speak"}
                </Text>
                <Animated.View 
                  style={[
                    styles.micIconContainer,
                    { transform: [{ scale: micButtonScale }] }
                  ]}
                >
                  <Mic size={20} color={isRecording ? "#EF4444" : "#4B5563"} />
                </Animated.View>
              </Pressable>
              
              <TouchableOpacity style={styles.iconButton} onPress={toggleInputMode}>
                <Keyboard size={22} color="#4B5563" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.iconButton} 
                onPress={() => setShowMoreOptions(!showMoreOptions)}
              >
                <Plus size={22} color="#4B5563" />
              </TouchableOpacity>
            </XStack>
          ) : (
            /* Text mode input */
            <XStack alignItems="center" style={styles.textInputRow}>
              <View style={styles.textInputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Send a message..."
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxLength={1000}
                />
              </View>
              
              <TouchableOpacity style={styles.iconButton} onPress={toggleInputMode}>
                <Mic size={22} color="#4B5563" />
              </TouchableOpacity>
              
              {inputText.trim() === '' ? (
                <TouchableOpacity 
                  style={styles.iconButton} 
                  onPress={() => setShowMoreOptions(!showMoreOptions)}
                >
                  <Plus size={22} color="#4B5563" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[styles.iconButton, styles.sendButton]} 
                  onPress={handleSend}
                >
                  <Send size={18} color="white" />
                </TouchableOpacity>
              )}
            </XStack>
          )}
        </View>
        
        {/* More options modal */}
        {showMoreOptions && (
          <View style={styles.moreOptionsContainer}>
            <TouchableOpacity 
              style={styles.moreOptionItem} 
              onPress={handleImageUpload}
            >
              <Circle size={50} backgroundColor="#F3F4F6">
                <ImageIcon size={24} color="#4B5563" />
              </Circle>
              <Text style={styles.moreOptionText}>Gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.moreOptionItem} 
              onPress={handleImageUpload}
            >
              <Circle size={50} backgroundColor="#F3F4F6">
                <Camera size={24} color="#4B5563" />
              </Circle>
              <Text style={styles.moreOptionText}>Camera</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.moreOptionItem} 
              onPress={handleFileUpload}
            >
              <Circle size={50} backgroundColor="#F3F4F6">
                <File size={24} color="#4B5563" />
              </Circle>
              <Text style={styles.moreOptionText}>File</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    width: 40,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  logoContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    marginRight: 8,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  addExpenseButton: {
    padding: 4,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageBubble: {
    maxWidth: '80%',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  aiMessage: {
    alignSelf: 'flex-start',
  },
  aiIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  aiIconText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  messageContent: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    position: 'relative',
  },
  userMessageContent: {
    backgroundColor: '#3B82F6',
    borderBottomRightRadius: 4,
  },
  aiMessageContent: {
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 4,
  },
  userMessageText: {
    color: 'white',
  },
  aiMessageText: {
    color: '#1F2937',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  userMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    alignSelf: 'flex-end',
  },
  aiMessageTime: {
    color: '#9CA3AF',
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  voiceInputRow: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  textInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    backgroundColor: '#3B82F6',
  },
  voiceButton: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    borderRadius: 22,
    paddingHorizontal: 16,
    marginHorizontal: 8,
  },
  voiceButtonText: {
    fontSize: 16,
    color: '#4B5563',
  },
  micIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  textInput: {
    fontSize: 16,
    maxHeight: 100,
  },
  moreOptionsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 16,
    paddingHorizontal: 24,
    justifyContent: 'space-around',
  },
  moreOptionItem: {
    alignItems: 'center',
  },
  moreOptionText: {
    marginTop: 8,
    fontSize: 12,
    color: '#4B5563',
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  welcomeImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  welcomePrompt: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 
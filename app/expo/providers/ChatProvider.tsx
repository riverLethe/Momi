import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ChatMessage, chatService } from '@/utils/chat.utils';
import { useAuth } from './AuthProvider';
import { useTranslation } from 'react-i18next';

// 聊天上下文类型
interface ChatContextType {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  clearMessages: () => Promise<void>;
  refreshMessages: () => Promise<void>;
}

// 创建聊天上下文
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// 聊天提供者Props
interface ChatProviderProps {
  children: ReactNode;
}

/**
 * 聊天上下文提供者
 */
export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 加载聊天记录
  const loadMessages = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const loadedMessages = await chatService.getMessages();
      setMessages(loadedMessages);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setError(t('Failed to load messages. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  // 发送消息
  const sendMessage = async (text: string) => {
    try {
      // 创建用户消息
      const userMessage: Partial<ChatMessage> = {
        _id: `user_${Date.now()}`,
        text,
        createdAt: new Date(),
        user: {
          _id: 'user',
          name: 'You',
        },
      };

      // 发送消息到服务
      await chatService.sendMessage(userMessage as ChatMessage);

      // 刷新消息列表
      await loadMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
      setError(t('Failed to send message. Please try again.'));
    }
  };

  // 清除聊天记录
  const clearMessages = async () => {
    try {
      setIsLoading(true);
      await chatService.clearHistory();
      setMessages([]);
    } catch (error) {
      console.error('Failed to clear messages:', error);
      setError(t('Failed to clear chat history. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  // 刷新消息
  const refreshMessages = async () => {
    await loadMessages();
  };

  // 初始加载消息
  useEffect(() => {
    if (isAuthenticated) {
      loadMessages();
    }
  }, [isAuthenticated]);

  // 上下文值
  const contextValue: ChatContextType = {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    refreshMessages,
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

/**
 * 使用聊天上下文的钩子
 */
export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  const { t } = useTranslation();
  if (context === undefined) {
    throw new Error(t('useChat must be used within a ChatProvider'));
  }

  return context;
}; 
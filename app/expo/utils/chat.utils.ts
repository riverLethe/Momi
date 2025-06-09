import { IMessage } from 'react-native-gifted-chat';

/**
 * Chat message with additional metadata
 */
export interface ChatMessage extends IMessage {
  pending?: boolean;
  sent?: boolean;
  received?: boolean;
  isAI?: boolean;
}

/**
 * Chat API service interface
 * This is a placeholder for future backend integration
 */
export interface ChatServiceInterface {
  /**
   * Get chat history
   */
  getMessages: () => Promise<ChatMessage[]>;
  
  /**
   * Send a message to the AI assistant
   */
  sendMessage: (message: Omit<ChatMessage, 'sent' | 'received'>) => Promise<ChatMessage>;
  
  /**
   * Clear chat history
   */
  clearHistory: () => Promise<void>;
}

/**
 * Mock implementation of the Chat service for development
 */
export class MockChatService implements ChatServiceInterface {
  private messages: ChatMessage[] = [];
  
  constructor() {
    // Initialize with a welcome message
    const welcomeMessage: ChatMessage = {
      _id: 'welcome_msg',
      text: 'Hi there! I am your Momi financial assistant. How can I help you today?',
      createdAt: new Date(),
      user: {
        _id: 'ai',
        name: 'Momi Assistant',
        avatar: 'https://via.placeholder.com/150',
      },
      isAI: true,
    };
    
    this.messages = [welcomeMessage];
  }
  
  /**
   * Get chat history
   */
  async getMessages(): Promise<ChatMessage[]> {
    return Promise.resolve([...this.messages]);
  }
  
  /**
   * Send a message to the AI assistant
   */
  async sendMessage(message: Omit<ChatMessage, 'sent' | 'received'>): Promise<ChatMessage> {
    // Add the user message to history
    const userMessage: ChatMessage = {
      ...message,
      sent: true,
      received: true,
    };
    
    this.messages.unshift(userMessage);
    
    // Generate a mock AI response
    const responseText = await this.generateResponse(message.text);
    
    const aiResponse: ChatMessage = {
      _id: 'ai_' + Date.now(),
      text: responseText,
      createdAt: new Date(),
      user: {
        _id: 'ai',
        name: 'Momi Assistant',
        avatar: 'https://via.placeholder.com/150',
      },
      sent: true,
      received: true,
      isAI: true,
    };
    
    // Add AI response to history
    this.messages.unshift(aiResponse);
    
    return Promise.resolve(aiResponse);
  }
  
  /**
   * Clear chat history
   */
  async clearHistory(): Promise<void> {
    this.messages = [];
    return Promise.resolve();
  }
  
  /**
   * Generate a mock response based on user input
   * This would be replaced with an actual API call in production
   */
  private async generateResponse(userMessage: string): Promise<string> {
    // Mock responses based on keywords in the user message
    const lowerCaseMessage = userMessage.toLowerCase();
    
    if (lowerCaseMessage.includes('hello') || lowerCaseMessage.includes('hi')) {
      return 'Hello! How can I help you with your finances today?';
    }
    
    if (lowerCaseMessage.includes('budget')) {
      return 'Would you like me to help you create a budget plan or analyze your current spending patterns?';
    }
    
    if (lowerCaseMessage.includes('expense') || lowerCaseMessage.includes('spending')) {
      return 'I can help you track and analyze your expenses. Would you like to see a breakdown of your recent spending?';
    }
    
    if (lowerCaseMessage.includes('save') || lowerCaseMessage.includes('saving')) {
      return 'Saving money is important! I can suggest some saving strategies based on your spending patterns.';
    }
    
    if (lowerCaseMessage.includes('invest') || lowerCaseMessage.includes('investment')) {
      return 'Investment is a great way to grow your wealth. What kind of investments are you interested in?';
    }
    
    // Default response
    return "I'm here to help with your financial questions. Feel free to ask about budgeting, expenses, savings, or investments!";
  }
}

/**
 * Create a chat service instance
 * This function would be updated when integrating with a real backend
 */
export const createChatService = (): ChatServiceInterface => {
  // For now, return the mock implementation
  return new MockChatService();
};

// Export a singleton instance for use throughout the app
export const chatService = createChatService(); 
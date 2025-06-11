import AsyncStorage from "@react-native-async-storage/async-storage";
import { Message } from "@/utils/api";

/**
 * Key used in AsyncStorage for persisting chat messages
 */
const STORAGE_KEY = "chat_messages";

/**
 * Persist chat messages locally.
 * Dates will be converted to ISO strings to ensure correct serialization.
 */
export const saveChatMessages = async (messages: Message[]): Promise<void> => {
  try {
    const serialisable = messages.map((msg) => ({
      ...msg,
      timestamp:
        msg.timestamp instanceof Date
          ? msg.timestamp.toISOString()
          : msg.timestamp,
    }));

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(serialisable));
  } catch (error) {
    console.error("Failed to save chat messages:", error);
  }
};

/**
 * Load cached chat messages from local storage.
 * Timestamps will be converted back to Date instances.
 */
export const loadChatMessages = async (): Promise<Message[]> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: Message[] = JSON.parse(raw).map((msg: any) => ({
      ...msg,
      timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
    }));

    return parsed;
  } catch (error) {
    console.error("Failed to load chat messages:", error);
    return [];
  }
};

/**
 * Clear cached chat messages.
 */
export const clearChatMessages = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear chat messages:", error);
  }
};

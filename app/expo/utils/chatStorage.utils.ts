import { storage } from "@/utils/storage.utils";
import { Message } from "@/utils/api";
import * as FileSystem from "expo-file-system";

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
    const docDir = FileSystem.documentDirectory ?? "";

    // Helper to strip current sandbox prefix so we only persist relative path
    const stripUri = (uri?: string): string | undefined => {
      if (!uri || typeof uri !== "string") return uri;
      if (uri.startsWith(docDir)) {
        return uri.substring(docDir.length);
      }
      return uri;
    };

    const serialisable = messages.map((msg) => {
      // Deep clone to avoid mutating original objects
      const cloned: any = JSON.parse(JSON.stringify(msg));

      // Convert Date -> ISO string for serialization
      cloned.timestamp =
        msg.timestamp instanceof Date
          ? msg.timestamp.toISOString()
          : msg.timestamp;

      // 1. Migrate direct media messages (image / voice)
      if ((msg.type === "image" || msg.type === "voice") && cloned.data) {
        cloned.data.uri = stripUri(cloned.data.uri);
      }

      // 2. Combined attachments inside message.data.attachments
      if (cloned.data && Array.isArray(cloned.data.attachments)) {
        cloned.data.attachments = cloned.data.attachments.map((att: any) => ({
          ...att,
          uri: stripUri(att.uri),
        }));
      }

      return cloned;
    });

    await storage.setItem(STORAGE_KEY, serialisable);
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
    const rawData = await storage.getItem<any[]>(STORAGE_KEY);
    if (!rawData) return [];

    const parsed: Message[] = rawData.map((msg: any) => ({
      ...msg,
      timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
    }));

    // --- NEW: Migrate stale sandbox file URIs to the current documentDirectory path ---
    const docDir = FileSystem.documentDirectory ?? "";

    const migrateUri = (uri?: string): string | undefined => {
      if (!uri || typeof uri !== "string") return uri;
      // If already points to current sandbox path, keep as is
      if (uri.startsWith(docDir)) return uri;

      // 1) If URI is already relative (no scheme), prepend docDir
      if (!uri.startsWith("file://")) {
        // Ensure we don't double-prepend
        return `${docDir}${uri.replace(/^\/*/, "")}`; // strip any leading slashes
      }

      // 2) If URI includes a previous sandbox path (contains /Documents/), replace prefix
      const splitIndex = uri.indexOf("/Documents/");
      if (splitIndex === -1) return uri; // external/unknown path, leave untouched

      // Keep the relative portion after "/Documents/"
      const relativePath = uri.substring(splitIndex + "/Documents/".length);
      return `${docDir}${relativePath}`;
    };

    // Go through every message & fix attachment URIs
    parsed.forEach((msg) => {
      if (msg.type === "image" || msg.type === "voice") {
        if (msg.data && typeof msg.data === "object") {
          msg.data.uri = migrateUri(msg.data.uri);
        }
      }

      // Combined attachments inside "data.attachments"
      if (msg.data && Array.isArray(msg.data.attachments)) {
        msg.data.attachments.forEach((att: any) => {
          att.uri = migrateUri(att.uri);
        });
      }
    });

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
    await storage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear chat messages:", error);
  }
};

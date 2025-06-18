import { useState, useEffect, useRef } from "react";
import { loadChatMessages, saveChatMessages } from "@/utils/chatStorage.utils";
import { Message } from "@/utils/api";

interface UseChatMessagesOptions {
  /** Fired once cached messages are loaded */
  onLoaded?: (msgs: Message[]) => void;
}

export const useChatMessages = (opts: UseChatMessagesOptions = {}) => {
  const { onLoaded } = opts;
  const [messages, setMessages] = useState<Message[]>([]);
  const firstLoadRef = useRef(true);

  // initial load
  useEffect(() => {
    (async () => {
      const cached = await loadChatMessages();
      if (cached.length) {
        setMessages(cached);
        onLoaded?.(cached);
      }
      firstLoadRef.current = false;
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // persist on change (skip first render)
  useEffect(() => {
    if (!firstLoadRef.current) {
      saveChatMessages(messages);
    }
  }, [messages]);

  const clearMessages = () => setMessages([]);

  return {
    messages,
    setMessages,
    clearMessages,
  } as const;
};

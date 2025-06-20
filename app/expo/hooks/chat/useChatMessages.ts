import { useState, useEffect, useRef, useCallback } from "react";
import { loadChatMessages, saveChatMessages } from "@/utils/chatStorage.utils";
import { Message } from "@/utils/api";

interface UseChatMessagesOptions {
  /** Fired once cached messages are loaded */
  onLoaded?: (msgs: Message[]) => void;
  /** Messages per page */
  pageSize?: number;
}

export const useChatMessages = (opts: UseChatMessagesOptions = {}) => {
  const { onLoaded, pageSize = 50 } = opts;
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [displayedMessages, setDisplayedMessages] = useState<Message[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const firstLoadRef = useRef(true);
  const currentPageRef = useRef(0);

  // Load messages from cache and display the latest pageSize messages
  useEffect(() => {
    (async () => {
      const cached = await loadChatMessages();
      setAllMessages(cached);

      if (cached.length > 0) {
        // Display the latest messages (last pageSize items)
        const startIndex = Math.max(0, cached.length - pageSize);
        const latestMessages = cached.slice(startIndex);
        setDisplayedMessages(latestMessages);

        // Check if there are more messages to load
        setHasMoreMessages(cached.length > pageSize);
        currentPageRef.current = Math.floor(cached.length / pageSize);

        onLoaded?.(latestMessages);
      } else {
        setDisplayedMessages([]);
        setHasMoreMessages(false);
        onLoaded?.([]);
      }

      firstLoadRef.current = false;
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize]);

  // Save all messages when they change (skip first render)
  useEffect(() => {
    if (!firstLoadRef.current) {
      saveChatMessages(allMessages);
    }
  }, [allMessages]);

  // Load more historical messages (called when user scrolls to top)
  const loadMoreMessages = useCallback(async () => {
    if (isLoadingMore || !hasMoreMessages) return;

    setIsLoadingMore(true);

    try {
      // Calculate how many messages to show from the beginning
      const currentDisplayed = displayedMessages.length;
      const totalMessages = allMessages.length;
      const newMessagesToShow = Math.min(
        pageSize,
        totalMessages - currentDisplayed
      );

      if (newMessagesToShow > 0) {
        // Show more messages from the beginning
        const newStartIndex = Math.max(
          0,
          totalMessages - currentDisplayed - newMessagesToShow
        );
        const newMessages = allMessages.slice(
          newStartIndex,
          totalMessages - currentDisplayed
        );

        setDisplayedMessages((prev) => [...newMessages, ...prev]);

        // Check if there are still more messages
        setHasMoreMessages(newStartIndex > 0);
      } else {
        setHasMoreMessages(false);
      }
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    allMessages,
    displayedMessages.length,
    isLoadingMore,
    hasMoreMessages,
    pageSize,
  ]);

  // Update messages (add new message)
  const setMessages = useCallback(
    (updater: React.SetStateAction<Message[]>) => {
      if (typeof updater === "function") {
        setAllMessages((prev) => {
          const newMessages = updater(prev);
          // Also update displayed messages to show the latest
          const startIndex = Math.max(0, newMessages.length - pageSize);
          const latestMessages = newMessages.slice(startIndex);
          setDisplayedMessages(latestMessages);
          setHasMoreMessages(newMessages.length > pageSize);
          return newMessages;
        });
      } else {
        setAllMessages(updater);
        // Also update displayed messages to show the latest
        const startIndex = Math.max(0, updater.length - pageSize);
        const latestMessages = updater.slice(startIndex);
        setDisplayedMessages(latestMessages);
        setHasMoreMessages(updater.length > pageSize);
      }
    },
    [pageSize]
  );

  const clearMessages = useCallback(() => {
    setAllMessages([]);
    setDisplayedMessages([]);
    setHasMoreMessages(false);
    currentPageRef.current = 0;
  }, []);

  return {
    messages: displayedMessages,
    setMessages,
    clearMessages,
    loadMoreMessages,
    isLoadingMore,
    hasMoreMessages,
  } as const;
};

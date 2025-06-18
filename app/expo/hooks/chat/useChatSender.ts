import { Keyboard } from "react-native";
import * as FileSystem from "expo-file-system";
import { chatAPI, AIResponseType, Message } from "@/utils/api";

export interface Attachment {
  id: string;
  uri: string;
  type: "image" | "file";
  name?: string;
  mimeType?: string;
}

interface Params {
  uiLang: string;
  attachments: Attachment[];
  replaceAttachments: (atts: Attachment[]) => void;
  inputText: string;
  setInputText: (txt: string) => void;
  setIsTextMode: (v: boolean) => void;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  scrollToBottom: () => void;
  setIsThinking: (v: boolean) => void;
  setCurrentStreamedMessage: (v: string) => void;
  handleAIResponse: (res: AIResponseType) => Promise<void>;
}

export const useChatSender = (params: Params) => {
  const {
    uiLang,
    attachments,
    replaceAttachments,
    inputText,
    setInputText,
    setIsTextMode,
    messages,
    setMessages,
    scrollToBottom,
    setIsThinking,
    setCurrentStreamedMessage,
    handleAIResponse,
  } = params;

  const handleSend = async (directlySendAttachments?: Attachment[]) => {
    if (
      inputText.trim() === "" &&
      attachments.length === 0 &&
      !directlySendAttachments?.length
    )
      return;

    const attachmentsToSend = directlySendAttachments || attachments;

    setIsTextMode(false);
    Keyboard.dismiss();
    // clear input & attachments UI
    setInputText("");
    replaceAttachments([]);

    // Convert attachments to payload
    const payload: import("@/utils/api").AttachmentPayload[] = [];
    for (const att of attachmentsToSend) {
      try {
        const base64 = await FileSystem.readAsStringAsync(att.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        payload.push({
          mimeType:
            att.mimeType ||
            (att.type === "image" ? "image/jpeg" : "application/octet-stream"),
          data: base64,
          name: att.name,
        });
      } catch (e: any) {
        console.warn("Failed to read attachment", e);
        // swallow – show error bubble from outside via onError.
      }
    }

    // Combine local message
    const combined = chatAPI.createMessage(inputText, true, "text", {
      attachments: attachmentsToSend,
    });
    setMessages((prev) => [...prev, combined]);
    setTimeout(scrollToBottom, 50);

    // Prepare AI
    const history = chatAPI.buildHistory([...messages, combined]);
    setIsThinking(true);
    setCurrentStreamedMessage("");
    await chatAPI.sendMessage(
      inputText,
      history,
      handleAIResponse,
      payload,
      uiLang
    );
  };

  return { handleSend } as const;
};

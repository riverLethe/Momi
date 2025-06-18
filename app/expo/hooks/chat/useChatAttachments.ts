import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import uuid from "react-native-uuid";
import { copyFileToDocumentDir } from "@/utils/file.utils";
import i18n from "@/i18n";

interface Attachment {
  id: string;
  uri: string;
  type: "image" | "file";
  name?: string;
  width?: number;
  height?: number;
  mimeType?: string;
}

interface UseChatAttachmentsOptions {
  /**
   * Called each time an attachment is successfully added. Useful to switch UI
   * into text-mode so the user can type a caption.
   */
  onAfterAdd?: () => void;
  /**
   * Propagate user-visible errors to the parent so they can be rendered inside
   * the chat as a bubble.
   */
  onError?: (message: string) => void;
}

export const useChatAttachments = (opts: UseChatAttachmentsOptions = {}) => {
  const { onAfterAdd, onError } = opts;
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  /** Helper so every add operation is consistent. */
  const add = (att: Attachment) => {
    setAttachments((prev) => [...prev, att]);
    onAfterAdd?.();
  };

  const replace = (atts: Attachment[]) => {
    setAttachments(atts);
    if (atts.length) onAfterAdd?.();
  };

  /** 从相册选择图片 */
  const pickImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        onError?.(i18n.t("Media library permission denied"));
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.length) {
        const asset = result.assets[0];
        const localUri = await copyFileToDocumentDir(asset.uri, "chat_images");
        add({
          id: Date.now().toString(),
          uri: localUri,
          width: asset.width,
          height: asset.height,
          type: "image",
        });
      }
    } catch (err: any) {
      console.error("pickImage error", err);
      onError?.(err?.message || i18n.t("Failed to pick image"));
    }
  };

  /** 拍照 */
  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        onError?.(i18n.t("Camera permission denied"));
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.length) {
        const asset = result.assets[0];
        const localUri = await copyFileToDocumentDir(asset.uri, "chat_images");
        add({
          id: Date.now().toString(),
          uri: localUri,
          width: asset.width,
          height: asset.height,
          type: "image",
        });
      }
    } catch (err: any) {
      console.error("takePhoto error", err);
      onError?.(err?.message || i18n.t("Failed to take photo"));
    }
  };

  /** 文件上传（csv / excel） */
  const uploadFile = async () => {
    try {
      const result: any = await DocumentPicker.getDocumentAsync({
        type: [
          "text/csv",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ],
      });
      if (result.assets?.length) {
        for (const asset of result.assets) {
          const { uri, name, mimeType } = asset;
          add({
            id: uuid.v4() as string,
            uri,
            name,
            mimeType,
            type: "file",
          });
        }
      }
    } catch (err: any) {
      console.error("uploadFile error", err);
      onError?.(err?.message || i18n.t("Failed to select file"));
    }
  };

  const remove = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  return {
    attachments,
    pickImage,
    takePhoto,
    uploadFile,
    remove,
    replaceAttachments: replace,
  } as const;
};

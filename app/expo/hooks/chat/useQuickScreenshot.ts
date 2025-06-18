import { useEffect } from "react";
import * as FileSystem from "expo-file-system";
import { copyFileToDocumentDir } from "@/utils/file.utils";
import i18n from "@/i18n";

interface Params {
  autoSend: boolean;
  tmpPath: string | undefined;
  replaceAttachments: (atts: any[]) => void;
  handleSend: (atts: any[]) => void;
  showSystemError: (txt: string) => void;
}

export const useQuickScreenshot = ({
  autoSend,
  tmpPath,
  replaceAttachments,
  handleSend,
  showSystemError,
}: Params) => {
  useEffect(() => {
    (async () => {
      try {
        if (!tmpPath) return;
        let sourceUri = tmpPath;
        if (!sourceUri.startsWith("file://")) sourceUri = `file://${sourceUri}`;
        const info = await FileSystem.getInfoAsync(sourceUri);
        if (!info.exists) {
          showSystemError(i18n.t("Screenshot not found – please try again."));
          return;
        }
        const destUri = await copyFileToDocumentDir(sourceUri, "chat_images");
        const attachment = {
          id: Date.now().toString(),
          uri: destUri,
          type: "image" as const,
        };
        replaceAttachments([attachment]);
        if (autoSend) handleSend([attachment]);
      } catch (err: any) {
        console.warn("Quick attach failed", err);
        showSystemError(
          i18n.t("Quick attach failed: {{error}}", {
            error: err?.message || i18n.t("Unknown error"),
          })
        );
      }
    })();
  }, [autoSend, tmpPath]);
};

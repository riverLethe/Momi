import { useState, useRef, useEffect } from "react";
import { ExpoSpeechRecognitionModule } from "expo-speech-recognition";
import * as Localization from "expo-localization";
import i18n from "@/i18n";

/**
 * Options accepted by the useVoiceRecognition hook.
 */
export interface UseVoiceRecognitionOptions {
  /**
   * Callback that fires once the speech recognition session finishes and a final
   * transcript is available.
   */
  onFinalResult: (transcript: string) => void;
  /**
   * Optional error handler so the parent component can display a friendly UI
   * message.
   */
  onError?: (err: string) => void;
  /**
   * Maximum recording duration in milliseconds. Defaults to 60 000 ms.
   */
  maxDuration?: number;
}

/**
 * A dedicated React hook that wraps the native-level speech-recognition logic
 * (via expo-speech-recognition) and exposes a very small API surface to the
 * UI layer:
 *
 *   const { isRecording, startRecording, stopRecording } = useVoiceRecognition({
 *     onFinalResult: (text) => sendMessage(text),
 *     onError: showError,
 *   });
 *
 * Doing so isolates a few hundred lines of imperative code from ChatScreen and
 * makes the UI component cleaner and focused on presentation.
 */
export const useVoiceRecognition = (options: UseVoiceRecognitionOptions) => {
  const { onFinalResult, onError, maxDuration = 60_000 } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [micPermissionGranted, setMicPermissionGranted] = useState(false);

  /** Hold the current transcript and clear it once sent. */
  const transcriptRef = useRef<string | null>(null);
  /** Timeout so we auto-stop extremely long recordings. */
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  /** Store subscriptions so we can remove them when done. */
  const listenersRef = useRef<any[]>([]);

  /** Flag to indicate the current stop was triggered by user cancel gesture. */
  const cancelledRef = useRef(false);

  // Normalise the locale to ensure native APIs recognise the value, e.g. zh-CN
  const language = (() => {
    const raw = Localization.locale || "en-US";
    if (/^[a-z]{2}-[A-Z]{2}$/.test(raw)) return raw;
    const primary = raw.split(/[-_]/)[0];
    const map: Record<string, string> = {
      zh: "zh-CN",
      en: "en-US",
      ja: "ja-JP",
      ko: "ko-KR",
    };
    return map[primary] || "en-US";
  })();

  /** Clean up all event listeners and timers. */
  const cleanup = () => {
    listenersRef.current.forEach((l) => l?.remove && l.remove());
    listenersRef.current = [];
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => cleanup();
  }, []);

  const startRecording = async () => {
    try {
      // Request permission (only the first time)
      if (!micPermissionGranted) {
        const perm =
          await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (!perm.granted) {
          onError?.(i18n.t("Microphone permission denied"));
          return;
        }
        setMicPermissionGranted(true);
      }

      setIsRecording(true);

      /**
       * When the native recogniser emits a final result we cache it and, once
       * the session ends, forward it to the consumer.
       */
      const resultListener = ExpoSpeechRecognitionModule.addListener(
        "result",
        (event: any) => {
          if (event.isFinal) {
            transcriptRef.current = event.results?.[0]?.transcript || "";
          }
        }
      );

      // Native SDK emits an `end` event once everything is finished – ideal time
      // to flush the transcript and cleanup listeners.
      const endListener = ExpoSpeechRecognitionModule.addListener("end", () => {
        setIsRecording(false);
        cleanup();
        if (transcriptRef.current) {
          onFinalResult(transcriptRef.current);
          transcriptRef.current = null;
        }
      });

      // Capture runtime errors (ignore if the stop came from a cancel gesture)
      const errorListener = ExpoSpeechRecognitionModule.addListener(
        "error",
        (event: any) => {
          if (cancelledRef.current) {
            // Reset the flag and silently ignore this expected interruption
            cancelledRef.current = false;
            cleanup();
            setIsRecording(false);
            return;
          }
          cleanup();
          setIsRecording(false);
          const message = event?.error || event?.message || "Unknown error";
          onError?.(message);
        }
      );

      listenersRef.current = [resultListener, endListener, errorListener];

      // Start the recogniser
      ExpoSpeechRecognitionModule.start({
        lang: language,
        interimResults: false,
        recordingOptions: { persist: true },
      });

      // Safety net: auto-stop after maxDuration
      timeoutRef.current = setTimeout(() => stopRecording(), maxDuration);
    } catch (err: any) {
      console.error("Failed to start speech recognition", err);
      onError?.(err?.message || i18n.t("Failed to start recording"));
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;

    setIsRecording(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    try {
      ExpoSpeechRecognitionModule.stop();
    } catch (err) {
      console.warn("Stop recognition error", err);
    }
  };

  /**
   * Cancel the current recording session without emitting the final transcript.
   * This is typically used when the user slides their finger up – signalling
   * that the voice message should be discarded.
   */
  const cancelRecording = async () => {
    if (!isRecording) return;
    // Mark cancellation
    cancelledRef.current = true;
    transcriptRef.current = null;

    // Remove listeners immediately so we don't get spurious error events
    cleanup();

    setIsRecording(false);

    try {
      ExpoSpeechRecognitionModule.stop();
    } catch (err) {
      // swallow – we intentionally cancelled
    }
  };

  return {
    isRecording,
    startRecording,
    stopRecording,
    cancelRecording,
  } as const;
};

import React from "react";
import { Sheet, YStack, Button, Text, Separator } from "tamagui";
import { Progress } from "@tamagui/progress";
import { useTranslation } from "react-i18next";

interface SyncOptionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMerge: () => void;
  onClearAndDownload: () => void;
  onPushAndOverride: () => void;
  syncProgress?: number;
  syncOperation?: string;
  isSyncing?: boolean;
}

export const SyncOptionsSheet: React.FC<SyncOptionsSheetProps> = ({
  open,
  onOpenChange,
  onMerge,
  onClearAndDownload,
  onPushAndOverride,
  syncProgress = 0,
  syncOperation = '',
  isSyncing = false,
}) => {
  const { t } = useTranslation();

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[50]}
      dismissOnSnapToBottom={false}
      dismissOnOverlayPress={false}
    >
      <Sheet.Overlay
        animation="lazy"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
      />
      <Sheet.Handle />
      <Sheet.Frame
        padding="$4"
        alignItems="center"
        gap="$4"
      >
        <YStack gap="$4" width="100%" alignItems="center">
          <YStack gap="$2" alignItems="center">
            <Text fontSize="$5" fontWeight="600" color="$blue10">
              {t('Sync Options')}
            </Text>
            <Text fontSize="$3" color="$color10" textAlign="center">
              {t('Local bills detected. How would you like to sync with your cloud data?')}
            </Text>
          </YStack>

          <Separator />

          {isSyncing ? (
            <YStack gap="$4" width="100%" paddingVertical="$4">
              <Text fontSize="$3" color="$blue10" textAlign="center">
                {syncOperation}
              </Text>

              <Progress value={syncProgress} size="$4">
                <Progress.Indicator animation="bouncy" backgroundColor="$blue10" />
              </Progress>

              <Text fontSize="$2" color="$color10" textAlign="center">
                {Math.round(syncProgress)}%
              </Text>
            </YStack>
          ) : (
            <YStack gap="$3" width="100%">
              <Button
                onPress={() => {
                  onMerge();
                  // 不需要在这里关闭 sheet，因为 handleMerge 方法会在完成后关闭
                }}
                theme={"gray" as any}
                borderRadius="$4"
                height={48}
                justifyContent="flex-start"
                paddingLeft="$3"
                borderColor="$color10"
                backgroundColor="$card"
                disabled={isSyncing}
              >
                {t('Merge')}
              </Button>

              <Button
                onPress={() => {
                  onClearAndDownload();
                  // 不需要在这里关闭 sheet，因为 handleClearAndDownload 方法会在完成后关闭
                }}
                theme={"gray" as any}
                borderRadius="$4"
                height={48}
                justifyContent="flex-start"
                paddingLeft="$3"
                borderColor="$color10"
                backgroundColor="$card"
                disabled={isSyncing}
              >
                {t('Clear & Download Remote')}
              </Button>

              <Button
                onPress={() => {
                  onPushAndOverride();
                  // 不需要在这里关闭 sheet，因为 handlePushAndOverride 方法会在完成后关闭
                }}
                theme={"gray" as any}
                borderRadius="$4"
                height={48}
                justifyContent="flex-start"
                paddingLeft="$3"
                borderColor="$color10"
                backgroundColor="$card"
                disabled={isSyncing}
              >
                {t('Push & Override Remote')}
              </Button>
            </YStack>
          )}

        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
};
import React from "react";
import { Sheet, YStack, Button, Text, Separator } from "tamagui";
import { useTranslation } from "react-i18next";
import { Merge, Download, Upload, LogOut } from "lucide-react-native";

interface SyncOptionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMerge: () => void;
  onClearAndDownload: () => void;
  onPushAndOverride: () => void;
  onSignOut: () => void;
}

export const SyncOptionsSheet: React.FC<SyncOptionsSheetProps> = ({
  open,
  onOpenChange,
  onMerge,
  onClearAndDownload,
  onPushAndOverride,
  onSignOut,
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

          <YStack gap="$3" width="100%">
            <Button
              onPress={() => {
                onMerge();
                onOpenChange(false);
              }}
              theme={"gray" as any}
              borderRadius="$4"
              height={48}
              justifyContent="flex-start"
              paddingLeft="$3"
              borderColor="$color10"
              backgroundColor="$card"
            >
              {t('Merge')}
            </Button>

            <Button
              onPress={() => {
                onClearAndDownload();
                onOpenChange(false);
              }}
              theme={"gray" as any}
              borderRadius="$4"
              height={48}
              justifyContent="flex-start"
              paddingLeft="$3"
              borderColor="$color10"
              backgroundColor="$card"
            >
              {t('Clear & Download Remote')}
            </Button>

            <Button
              onPress={() => {
                onPushAndOverride();
                onOpenChange(false);
              }}
              theme={"gray" as any}
              borderRadius="$4"
              height={48}
              justifyContent="flex-start"
              paddingLeft="$3"
              borderColor="$color10"
              backgroundColor="$card"
            >
              {t('Push & Override Remote')}
            </Button>

            {/* <Button
              size="$4"
              variant="outlined"
              onPress={() => {
                onSignOut();
                onOpenChange(false);
              }}
              icon={LogOut}
              theme="red"
            >
              {t('Sign Out')}
            </Button> */}
          </YStack>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
};
import React from "react";
import { Pressable } from "react-native";
import { XStack, YStack, Text, useTheme } from "tamagui";
import { ImageIcon, Camera, File } from "lucide-react-native";
import { useTranslation } from "react-i18next";

interface MoreOptionsProps {
  /** 选择相册图片 */
  onPickImage: () => void;
  /** 拍照 */
  onTakePhoto: () => void;
  /** 选择 CSV/Excel 文件 */
  onFileUpload: () => void;
}

export const MoreOptions: React.FC<MoreOptionsProps> = ({
  onPickImage,
  onTakePhoto,
  onFileUpload,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <XStack
      backgroundColor="$card"
      borderTopWidth={1}
      borderTopColor="$borderColor"
      paddingVertical="$4"
      paddingHorizontal="$6"
      justifyContent="space-around"
    >
      <YStack alignItems="center">
        <Pressable onPress={onPickImage}>
          <YStack
            alignItems="center"
            backgroundColor="$backgroundHover"
            borderRadius="$2"
            width="$6"
            height="$6"
            justifyContent="center"
          >
            <ImageIcon size={24} color={theme.color?.get()} />
            <Text
              marginTop="$2"
              fontSize={12}
              color="$color10"
              textAlign="center"
            >
              {t("Gallery")}
            </Text>
          </YStack>
        </Pressable>
      </YStack>

      <YStack alignItems="center">
        <Pressable onPress={onTakePhoto}>
          <YStack
            alignItems="center"
            backgroundColor="$backgroundHover"
            borderRadius="$2"
            width="$6"
            height="$6"
            justifyContent="center"
          >
            <Camera size={24} color={theme.color?.get()} />
            <Text
              marginTop="$2"
              fontSize={12}
              color="$color10"
              textAlign="center"
            >
              {t("Camera")}
            </Text>
          </YStack>
        </Pressable>
      </YStack>

      <YStack alignItems="center">
        <Pressable onPress={onFileUpload}>
          <YStack
            alignItems="center"
            backgroundColor="$backgroundHover"
            borderRadius="$2"
            width="$6"
            height="$6"
            justifyContent="center"
          >
            <File size={24} color={theme.color?.get()} />
            <Text
              marginTop="$2"
              fontSize={12}
              color="$color10"
              textAlign="center"
            >
              {t("File")}
            </Text>
          </YStack>
        </Pressable>
      </YStack>
    </XStack>
  );
};

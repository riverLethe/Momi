import React from "react";
import { XStack, YStack, Text, Circle } from "tamagui";
import { Image as ImageIcon, Camera, File } from "lucide-react-native";
import { Pressable } from "react-native";
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
  return (
    <XStack
      backgroundColor="$white"
      borderTopWidth={1}
      borderTopColor="$gray4"
      paddingVertical="$4"
      paddingHorizontal="$6"
      justifyContent="space-around"
    >
      <YStack alignItems="center">
        <Pressable onPress={onPickImage}>
          <Circle size={50} backgroundColor="$gray100">
            <ImageIcon size={24} color="#4B5563" />
          </Circle>
          <Text
            marginTop="$2"
            fontSize={12}
            color="$gray600"
            textAlign="center"
          >
            {t("Gallery")}
          </Text>
        </Pressable>
      </YStack>

      <YStack alignItems="center">
        <Pressable onPress={onTakePhoto}>
          <Circle size={50} backgroundColor="$gray100">
            <Camera size={24} color="#4B5563" />
          </Circle>
          <Text
            marginTop="$2"
            fontSize={12}
            color="$gray600"
            textAlign="center"
          >
            {t("Camera")}
          </Text>
        </Pressable>
      </YStack>

      <YStack alignItems="center">
        <Pressable onPress={onFileUpload}>
          <Circle size={50} backgroundColor="$gray100">
            <File size={24} color="#4B5563" />
          </Circle>
          <Text
            marginTop="$2"
            fontSize={12}
            color="$gray600"
            textAlign="center"
          >
            {t("File")}
          </Text>
        </Pressable>
      </YStack>
    </XStack>
  );
};

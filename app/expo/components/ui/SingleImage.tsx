import React, { useState } from "react";
import {
  Image,
  Pressable,
  Modal,
  View,
  TouchableWithoutFeedback,
} from "react-native";
import { YStack, Text } from "tamagui";
import { useTranslation } from "react-i18next";

interface SingleImageProps {
  uri: string;
  small?: boolean;
}

/**
 * A small helper component that renders an image thumbnail with graceful error handling.
 *
 * If the source fails to load (e.g. the file has been deleted), a neutral placeholder
 * with the text "Damaged" is shown instead so the user is aware the file is missing.
 */
export const SingleImage: React.FC<SingleImageProps> = ({ uri, small }) => {
  const [error, setError] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const { t } = useTranslation();

  const size = small ? 30 : 50;

  // If image failed to load, render placeholder
  if (error) {
    return (
      <YStack
        width={size}
        height={size}
        borderRadius={5}
        alignItems="center"
        justifyContent="center"
        backgroundColor="#F3F4F6"
      >
        <Text fontSize={10} color="$gray700">
          {t("Damaged")}
        </Text>
      </YStack>
    );
  }

  return (
    <>
      <Pressable onPress={() => setPreviewVisible(true)}>
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: 5 }}
          resizeMode="cover"
          onError={() => setError(true)}
        />
      </Pressable>

      {/* Full-screen preview */}
      <Modal
        visible={previewVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setPreviewVisible(false)}>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.9)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Image
              source={{ uri }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="contain"
            />
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

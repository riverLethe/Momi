import React, { useState } from "react";
import { Image } from "react-native";
import { YStack, Text } from "tamagui";

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
  const size = small ? 30 : 50;

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
          Damaged
        </Text>
      </YStack>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={{ width: size, height: size, borderRadius: 5 }}
      resizeMode="cover"
      onError={() => setError(true)}
    />
  );
};

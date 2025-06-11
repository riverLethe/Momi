import React from 'react';
import { XStack, YStack, Text, Circle } from 'tamagui';
import { Image as ImageIcon, Camera, File } from 'lucide-react-native';
import { Pressable } from 'react-native';

interface MoreOptionsProps {
  onImageUpload: () => void;
  onFileUpload: () => void;
}

export const MoreOptions: React.FC<MoreOptionsProps> = ({ 
  onImageUpload, 
  onFileUpload 
}) => {
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
        <Pressable onPress={onImageUpload}>
          <Circle size={50} backgroundColor="$gray100">
            <ImageIcon size={24} color="#4B5563" />
          </Circle>
          <Text
            marginTop="$2"
            fontSize={12}
            color="$gray600"
            textAlign="center"
          >
            Gallery
          </Text>
        </Pressable>
      </YStack>

      <YStack alignItems="center">
        <Pressable onPress={onImageUpload}>
          <Circle size={50} backgroundColor="$gray100">
            <Camera size={24} color="#4B5563" />
          </Circle>
          <Text
            marginTop="$2"
            fontSize={12}
            color="$gray600"
            textAlign="center"
          >
            Camera
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
            File
          </Text>
        </Pressable>
      </YStack>
    </XStack>
  );
}; 
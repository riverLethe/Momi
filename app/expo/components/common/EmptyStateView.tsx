import React from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { 
  Text, 
  YStack,
  Image,
  Paragraph,
  XStack,
  H4,
  Card,
} from "tamagui";
import { ImageSourcePropType } from "react-native";

interface EmptyStateViewProps {
  title: string;
  description: string;
  imageSrc: ImageSourcePropType;
  actionText?: string;
  actionSubtitle?: string;
  actionIcon?: React.ReactNode;
  onActionPress?: () => void;
  hideAction?: boolean;
}

export const EmptyStateView: React.FC<EmptyStateViewProps> = ({
  title,
  description,
  imageSrc,
  actionText,
  actionSubtitle,
  actionIcon,
  onActionPress,
  hideAction = false,
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  
  return (
    <YStack flex={1} paddingHorizontal="$4" paddingVertical="$6" space="$5" justifyContent="center" alignItems="center">
      {/* Logo and Title Section */}
      <YStack alignItems="center" space="$2">
        <Image
          source={imageSrc}
          width={180}
          height={180}
          alt="Empty state image"
          resizeMode="contain"
          borderRadius={32}
        />
        
        <YStack space="$2" alignItems="center">
          <H4 textAlign="center" marginTop="$4" color="$color">
            {title}
          </H4>
          
          <Paragraph textAlign="center" color="$gray11" paddingHorizontal="$4">
            {description}
          </Paragraph>
        </YStack>
      </YStack>
      
      {!hideAction && (
        <YStack space="$4" marginTop="$2" width="100%">
          <Card 
            padding="$4" 
            bordered 
            borderRadius="$4"
            pressStyle={{ scale: 0.98 }}
            backgroundColor="white"
            elevation={2}
            shadowColor="rgba(0,0,0,0.1)"
            shadowRadius={8}
            onPress={onActionPress}
          >
            <XStack alignItems="center" space="$3">
              <YStack
                width={52}
                height={52}
                borderRadius="$5"
                backgroundColor="$blue2"
                alignItems="center"
                justifyContent="center"
                borderWidth={1}
                borderColor="$blue4"
              >
                {actionIcon}
              </YStack>
              <YStack flex={1}>
                <Text fontWeight="$7" fontSize="$4" color="$gray12">
                  {actionText || t("Add New")}
                </Text>
                {actionSubtitle && (
                  <Text fontSize="$2.5" color="$gray10" marginTop="$1">
                    {actionSubtitle}
                  </Text>
                )}
              </YStack>
              <ChevronRight size={20} color="#3B82F6" />
            </XStack>
          </Card>
        </YStack>
      )}
    </YStack>
  );
};

export default EmptyStateView; 
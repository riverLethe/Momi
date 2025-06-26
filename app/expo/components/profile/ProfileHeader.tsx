import React from 'react';
import { LinearGradient } from 'tamagui/linear-gradient';
import { Button, Text, XStack, YStack, Avatar } from 'tamagui';
import { UserCircle } from 'lucide-react-native';
import { User } from '@/types/user.types';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ProfileHeaderProps {
  user: User | null;
  isAuthenticated: boolean;
  onLoginPress: () => void;
}

/**
 * Display user avatar, name (or guest) and login action.
 */
export const ProfileHeader: React.FC<ProfileHeaderProps> = React.memo(
  ({ user, isAuthenticated, onLoginPress }) => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    return (
      <LinearGradient
        colors={["$blue9", "$blue8"]}
        start={[0, 0]}
        end={[1, 0]}
        padding="$5"
        borderRadius="$0"
        marginBottom="$6"
        paddingTop={insets.top}
      >
        <XStack alignItems="center" space="$4">
          <Avatar circular size="$10" overflow="hidden">
            {isAuthenticated && user?.avatar ? (
              <Avatar.Image
                accessibilityLabel={user?.name || 'User avatar'}
                src={user.avatar}
              />
            ) : (
              <Avatar.Fallback
                backgroundColor="rgba(255,255,255,0.2)"
                alignItems="center"
                justifyContent="center"
              >
                <UserCircle size={52} color="white" />
              </Avatar.Fallback>
            )}
          </Avatar>

          <YStack>
            <Text fontSize="$5" fontWeight="$7" color="white">
              {isAuthenticated ? user?.name : t('Guest')}
            </Text>
            {isAuthenticated ? (
              <Text color="rgba(255,255,255,0.8)" fontSize="$3">
                {user?.id}
              </Text>
            ) : (
              <Button
                size="$2"
                marginTop="$3"
                backgroundColor="white"
                onPress={onLoginPress}
              >
                <Text color="$blue9">{t('Login')}</Text>
              </Button>
            )}
          </YStack>
        </XStack>
      </LinearGradient>
    );
  }
);

ProfileHeader.displayName = 'ProfileHeader'; 
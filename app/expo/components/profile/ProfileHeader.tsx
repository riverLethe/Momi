import React from 'react';
import { LinearGradient } from 'tamagui/linear-gradient';
import { Button, Text, XStack, YStack, Avatar } from 'tamagui';
import { UserCircle, LogOut } from 'lucide-react-native';
import { User } from '@/types/user.types';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ProfileHeaderProps {
  user: User | null;
  isAuthenticated: boolean;
  onLoginPress: () => void;
  onLogoutPress?: () => void;
}

/**
 * Display user avatar, name (or guest) and login/logout action.
 */
export const ProfileHeader: React.FC<ProfileHeaderProps> = React.memo(
  ({ user, isAuthenticated, onLoginPress, onLogoutPress }) => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    return (
      <LinearGradient
        colors={["$blue9", "$blue8"]}
        start={[0, 0]}
        end={[1, 0]}
        padding="$6"
        borderRadius="$0"
        marginBottom="$4"
        paddingTop={insets.top + 20}
        paddingBottom="$8"
        position="relative"
      >
        {/* Logout Button - positioned in top right corner */}
        {isAuthenticated && onLogoutPress && (
          <XStack position="absolute" top={insets.top + 10} right="$4" zIndex={10}>
            <Button
              size="$2"
              circular
              backgroundColor="transparent"
              borderWidth={0}
              hoverStyle={{ backgroundColor: "rgba(255,255,255,0.1)" }}
              pressStyle={{ backgroundColor: "rgba(255,255,255,0.2)" }}
              onPress={onLogoutPress}
            >
              <LogOut size={20} color="rgba(255,255,255,0.7)" />
            </Button>
          </XStack>
        )}

        <YStack alignItems="center" gap="$4">
          {/* Avatar */}
          <Avatar circular size="$12" overflow="hidden" borderWidth={4} borderColor="rgba(255,255,255,0.3)">
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
                <UserCircle size={64} color="white" />
              </Avatar.Fallback>
            )}
          </Avatar>

          {/* User Info */}
          <YStack alignItems="center" gap="$2">
            <Text fontSize="$6" fontWeight="$8" color="white" textAlign="center">
              {isAuthenticated ? user?.name || t('User') : t('Guest')}
            </Text>

            {isAuthenticated ? (
              <Text color="rgba(255,255,255,0.7)" fontSize="$3" textAlign="center">
                {user?.email || 'user@example.com'}
              </Text>
            ) : (
              <Text color="rgba(255,255,255,0.8)" fontSize="$3" textAlign="center">
                {t('Sign in to sync your data')}
              </Text>
            )}
          </YStack>

          {/* Login Button - only show for non-authenticated users */}
          {!isAuthenticated && (
            <Button
              size="$4"
              backgroundColor="white"
              borderRadius="$8"
              paddingHorizontal="$6"
              hoverStyle={{ backgroundColor: "$gray2" }}
              pressStyle={{ backgroundColor: "$gray3" }}
              onPress={onLoginPress}
            >
              <Text color="$blue9" fontSize="$4" fontWeight="$7">
                {t('Login')}
              </Text>
            </Button>
          )}
        </YStack>
      </LinearGradient>
    );
  }
);

ProfileHeader.displayName = 'ProfileHeader'; 
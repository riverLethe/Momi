import React from 'react';
import { Button, Text, XStack, YStack, Card, Avatar, Circle } from 'tamagui';
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
 * Modern and professional profile header focused on functionality rather than account prominence.
 */
export const ProfileHeader: React.FC<ProfileHeaderProps> = React.memo(
  ({ user, isAuthenticated, onLoginPress }) => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    return (
      <Card
        margin="$4"
        marginTop={insets.top + 16}
        padding="$5"
        backgroundColor="$background"
        borderWidth={1}
        borderColor="$borderColor"
        elevate
        shadowColor="$shadowColor"
        shadowOffset={{ width: 0, height: 2 }}
        shadowOpacity={0.1}
      >
        <YStack gap="$4">
          {/* Header Row */}
          <XStack gap="$3" alignItems="center">


            {isAuthenticated ? (
              <>
                <XStack alignItems="center" gap="$3">
                  {user?.avatar ? (
                    <Avatar circular size="$4" borderWidth={1} borderColor="$borderColor">
                      <Avatar.Image src={user.avatar} />
                      <Avatar.Fallback backgroundColor="$blue5">
                        <Text fontSize="$3" fontWeight="$6" color="$blue11">
                          {user.name?.substring(0, 2).toUpperCase() || 'U'}
                        </Text>
                      </Avatar.Fallback>
                    </Avatar>
                  ) : (
                    <Circle borderRadius="$4" size="$4" backgroundColor="$blue5">
                      <Text fontSize="$3" fontWeight="$6" color="$blue11">
                        {user?.name?.substring(0, 2).toUpperCase() || 'U'}
                      </Text>
                    </Circle>
                  )}
                </XStack>
                <XStack justifyContent="space-between" alignItems="center">
                  <YStack gap="$1">
                    <Text fontSize="$4" fontWeight="$7" color="$color">
                      {user?.name || t('User')}
                    </Text>
                    <Text fontSize="$2" color="$color10">
                      {user?.email}
                    </Text>
                  </YStack>

                </XStack>
              </>

            ) : (
              <>
                <YStack flex={1}>
                  <Text fontSize="$5" fontWeight="$8" color="$color">
                    {t('Settings')}
                  </Text>
                  <Text fontSize="$3" color="$color10" marginTop="$2">
                    {isAuthenticated
                      ? t('Manage your preferences and data')
                      : t('Sign in to access all features')
                    }
                  </Text>
                </YStack>
                <Button
                  size="$3"
                  theme="blue"
                  onPress={onLoginPress}
                >
                  <Text >
                    {t('Sign In')}
                  </Text>
                </Button></>

            )}
          </XStack>

        </YStack>
      </Card>
    );
  }
);

ProfileHeader.displayName = 'ProfileHeader';
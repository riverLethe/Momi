import React from 'react';
import { TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { Text, Circle, XStack } from 'tamagui';

import { useNotifications } from '@/providers/NotificationProvider';

interface NotificationBadgeProps {
  size?: number;
  color?: string;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = React.memo(({
  size = 24,
  color = '#F59E0B'
}) => {
  const router = useRouter();
  const { unreadCount } = useNotifications();
  
  const handlePress = () => {
    router.push('/notifications');
  };
  
  return (
    <TouchableOpacity onPress={handlePress} style={{ padding: 4 }}>
      <XStack>
        <Bell size={size} color={color} />
        {unreadCount > 0 && (
          <Circle
            size={16}
            backgroundColor="$red9"
            position="absolute"
            top={-5}
            right={-5}
            alignItems="center"
            justifyContent="center"
            borderWidth={1}
            borderColor="white"
          >
            <Text color="white" fontSize={10} fontWeight="bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Text>
          </Circle>
        )}
      </XStack>
    </TouchableOpacity>
  );
});

NotificationBadge.displayName = 'NotificationBadge';

export default NotificationBadge; 
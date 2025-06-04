import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Trash2, Check, Plus } from "lucide-react-native";
import { 
  Button, 
  H2, 
  Text, 
  XStack, 
  YStack, 
  Card, 
  ScrollView,
  Separator
} from "tamagui";

import { useNotifications } from "@/providers/NotificationProvider";

export default function NotificationListScreen() {
  const router = useRouter();
  const { notifications, markAsRead, markAllAsRead, clearNotifications, addNotification } = useNotifications();

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'info': return { bg: '$blue2', text: '$blue11' };
      case 'success': return { bg: '$green2', text: '$green11' };
      case 'warning': return { bg: '$yellow2', text: '$yellow11' };
      case 'error': return { bg: '$red2', text: '$red11' };
      default: return { bg: '$gray2', text: '$gray11' };
    }
  };

  const createTestNotification = () => {
    const types = ['info', 'success', 'warning', 'error'];
    const randomType = types[Math.floor(Math.random() * types.length)] as 'info' | 'success' | 'warning' | 'error';
    
    const titles = {
      info: 'New Feature Available',
      success: 'Payment Successful',
      warning: 'Budget Limit Approaching',
      error: 'Transaction Failed'
    };
    
    const messages = {
      info: 'We\'ve added new charts to help you track your spending.',
      success: 'Your bill payment was processed successfully.',
      warning: 'You\'re at 80% of your monthly budget limit.',
      error: 'Your transaction could not be processed. Please try again.'
    };
    
    addNotification({
      title: titles[randomType],
      message: messages[randomType],
      type: randomType
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <YStack flex={1} padding="$4">
        <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
          <XStack alignItems="center">
            <Button
              size="$3"
              circular
              icon={<ArrowLeft size={24} color="#000" />}
              onPress={() => router.back()}
            />
            <H2 marginLeft="$2">Notifications</H2>
          </XStack>
          
          <XStack space="$2">
            <Button
              size="$3"
              chromeless
              onPress={createTestNotification}
              icon={<Plus size={20} color="#3B82F6" />}
            >
              <Text color="$blue11">Test</Text>
            </Button>
            
            <Button
              size="$3"
              chromeless
              onPress={markAllAsRead}
              disabled={notifications.length === 0 || notifications.every(n => n.read)}
              icon={<Check size={20} color="#10B981" />}
            >
              <Text color="$green11">Read All</Text>
            </Button>
            
            <Button
              size="$3"
              chromeless
              onPress={clearNotifications}
              disabled={notifications.length === 0}
              icon={<Trash2 size={20} color="#EF4444" />}
            >
              <Text color="$red11">Clear All</Text>
            </Button>
          </XStack>
        </XStack>

        <ScrollView>
          <YStack space="$3">
            {notifications.length === 0 ? (
              <Card padding="$6" alignItems="center" justifyContent="center" backgroundColor="$gray2">
                <Text color="$gray11" textAlign="center">
                  No notifications yet. Tap the "Test" button to create a sample notification.
                </Text>
              </Card>
            ) : (
              notifications.map((notification) => {
                const colors = getNotificationColor(notification.type);
                return (
                  <Card
                    key={notification.id}
                    padding="$4"
                    backgroundColor={notification.read ? '$gray1' : colors.bg}
                    pressStyle={{ opacity: 0.8 }}
                    onPress={() => markAsRead(notification.id)}
                  >
                    <YStack>
                      <XStack alignItems="center" justifyContent="space-between">
                        <Text fontWeight="$6" color={notification.read ? '$gray10' : colors.text}>
                          {notification.title}
                        </Text>
                        {!notification.read && (
                          <Card backgroundColor="$blue9" paddingHorizontal="$2" paddingVertical="$1" borderRadius="$10">
                            <Text color="white" fontSize="$1">NEW</Text>
                          </Card>
                        )}
                      </XStack>
                      
                      <Text marginVertical="$2" color={notification.read ? '$gray9' : '$gray12'}>
                        {notification.message}
                      </Text>
                      
                      <Text fontSize="$2" color="$gray8">
                        {formatDate(notification.createdAt)}
                      </Text>
                    </YStack>
                  </Card>
                );
              })
            )}
          </YStack>
        </ScrollView>
      </YStack>
    </SafeAreaView>
  );
} 
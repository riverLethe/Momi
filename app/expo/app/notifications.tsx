import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Bell, DollarSign, Calendar, Users, List } from "lucide-react-native";
import {
  Button,
  H2,
  Text,
  XStack,
  YStack,
  Card,
  Switch,
  Separator
} from "tamagui";

import { useNotifications } from "@/providers/NotificationProvider";
import { useTranslation } from "react-i18next";

export default function NotificationsScreen() {
  const router = useRouter();
  const { settings, updateSettings, unreadCount } = useNotifications();
  const { t } = useTranslation();

  const toggleNotification = (key: keyof typeof settings) => {
    updateSettings({ [key]: !settings[key] });
  };

  const handleViewAllNotifications = () => {
    router.push('/notification-list');
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
            <H2 marginLeft="$2">{t("Notifications")}</H2>
          </XStack>

          <Button
            size="$3"
            icon={<List size={20} color="#3B82F6" />}
            onPress={handleViewAllNotifications}
            backgroundColor="$blue2"
            paddingHorizontal="$3"
          >
            <Text color="$blue11">
              {t("View All")} {unreadCount > 0 && `(${unreadCount})`}
            </Text>
          </Button>
        </XStack>

        <YStack space="$4">
          <Card padding="$4" elevate>
            <Text fontSize="$5" fontWeight="$6" marginBottom="$3">
              {t("Notification Settings")}
            </Text>

            <XStack alignItems="center" justifyContent="space-between" marginBottom="$3">
              <XStack alignItems="center" space="$2">
                <Bell size={24} color="#F59E0B" />
                <Text fontSize="$4">{t("Push Notifications")}</Text>
              </XStack>
              <Switch
                size="$2"
                checked={settings.pushEnabled}
                onCheckedChange={() => toggleNotification('pushEnabled')}
              ><Switch.Thumb animation="bouncy" /></Switch>
            </XStack>

            <Separator marginVertical="$3" />

            <Text fontSize="$4" fontWeight="$6" marginVertical="$3">
              {t("Alert Types")}
            </Text>

            <YStack space="$3">
              <XStack alignItems="center" justifyContent="space-between">
                <XStack alignItems="center" space="$2">
                  <Calendar size={20} color="#3B82F6" />
                  <Text>{t("Bill Reminders")}</Text>
                </XStack>
                <Switch
                  size="$2"
                  checked={settings.billReminders}
                  disabled={!settings.pushEnabled}
                  onCheckedChange={() => toggleNotification('billReminders')}
                ><Switch.Thumb animation="bouncy" /></Switch>
              </XStack>

              <XStack alignItems="center" justifyContent="space-between">
                <XStack alignItems="center" space="$2">
                  <DollarSign size={20} color="#10B981" />
                  <Text>{t("Budget Alerts")}</Text>
                </XStack>
                <Switch
                  size="$2"
                  checked={settings.budgetAlerts}
                  disabled={!settings.pushEnabled}
                  onCheckedChange={() => toggleNotification('budgetAlerts')}
                ><Switch.Thumb animation="bouncy" /></Switch>
              </XStack>

              <XStack alignItems="center" justifyContent="space-between">
                <XStack alignItems="center" space="$2">
                  <Users size={20} color="#8B5CF6" />
                  <Text>{t("Family Updates")}</Text>
                </XStack>
                <Switch
                  size="$2"
                  checked={settings.familyUpdates}
                  disabled={!settings.pushEnabled}
                  onCheckedChange={() => toggleNotification('familyUpdates')}
                ><Switch.Thumb animation="bouncy" /></Switch>
              </XStack>

              <XStack alignItems="center" justifyContent="space-between">
                <XStack alignItems="center" space="$2">
                  <Calendar size={20} color="#EF4444" />
                  <Text>{t("Weekly Reports")}</Text>
                </XStack>
                <Switch
                  size="$2"
                  checked={settings.weeklyReports}
                  disabled={!settings.pushEnabled}
                  onCheckedChange={() => toggleNotification('weeklyReports')}
                ><Switch.Thumb animation="bouncy" /></Switch>
              </XStack>
            </YStack>
          </Card>

          <Card padding="$4" elevate backgroundColor="$blue2">
            <Text color="$blue11" fontWeight="$6">
              {t("Notification Delivery")}
            </Text>
            <Text color="$blue11" fontSize="$3" marginTop="$2">
              {t("We'll only send you notifications during daytime hours (8:00 AM - 10:00 PM) based on your device's time zone.")}
            </Text>
          </Card>
        </YStack>
      </YStack>
    </SafeAreaView>
  );
} 
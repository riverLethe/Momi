import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Bell, DollarSign, Calendar, Users, List, Clock } from "lucide-react-native";
import {
  Button,
  Text,
  XStack,
  YStack,
  Card,
  Switch,
  Circle,
  Separator,
  ScrollView
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#eee" }}>
      <YStack flex={1}>
        {/* Custom Header matching bill details style */}
        <XStack
          height="$5"
          paddingHorizontal="$4"
          alignItems="center"
          justifyContent="space-between"
          backgroundColor="white"
          borderBottomWidth={1}
          borderBottomColor="$gray4"
        >
          <Button
            size="$3"
            circular
            chromeless
            onPress={() => router.back()}
          >
            <ArrowLeft size={20} color="#64748B" />
          </Button>
          <Text fontSize="$4" fontWeight="$6">
            {t("Notification Settings")}
          </Text>
          {/* Placeholder for right side spacing */}
          <XStack width={32} />
        </XStack>

        <ScrollView flex={1} contentContainerStyle={{ padding: 16 }}>
          <YStack gap="$4">
            <Card padding="$4" elevate>
              <Text fontSize="$4" fontWeight="$7" marginBottom="$4">
                {t("Global Switch")}
              </Text>

              <XStack alignItems="center" justifyContent="space-between" marginBottom="$4" paddingVertical="$2">
                <XStack alignItems="center" gap="$3">
                  <Circle size="$3" backgroundColor="$yellow4">
                    <Bell size={20} color="#F59E0B" />
                  </Circle>
                  <Text fontSize="$4" fontWeight="$6" lineHeight={20}>{t("Push Notifications")}</Text>
                </XStack>
                <Switch
                  size="$2"
                  checked={settings.pushEnabled}
                  onCheckedChange={() => toggleNotification('pushEnabled')}
                ><Switch.Thumb animation="bouncy" /></Switch>
              </XStack>

              <Separator marginVertical="$2" />

              <Text fontSize="$4" fontWeight="$6" marginVertical="$4">
                {t("Alert Types")}
              </Text>

              <YStack gap="$4">
                {/* <XStack alignItems="center" justifyContent="space-between" paddingVertical="$2.5">
                  <XStack alignItems="center" gap="$3">
                    <Circle size="$2.5" backgroundColor="$blue4">
                      <Calendar size={16} color="#3B82F6" />
                    </Circle>
                    <Text>{t("Bill Reminders")}</Text>
                  </XStack>
                  <Switch
                    size="$2"
                    checked={settings.billReminders}
                    disabled={!settings.pushEnabled}
                    onCheckedChange={() => toggleNotification('billReminders')}
                  ><Switch.Thumb animation="bouncy" /></Switch>
                </XStack> */}

                {/* Log Reminders */}
                <XStack alignItems="center" justifyContent="space-between" paddingVertical="$2.5">
                  <XStack alignItems="center" gap="$3">
                    <Circle size="$2.5" backgroundColor="$cyan4">
                      <Clock size={16} color="#06B6D4" />
                    </Circle>
                    <Text>{t("Log Reminders")}</Text>
                  </XStack>
                  <Switch
                    size="$2"
                    checked={settings.logReminders}
                    disabled={!settings.pushEnabled}
                    onCheckedChange={() => toggleNotification('logReminders')}
                  ><Switch.Thumb animation="bouncy" /></Switch>
                </XStack>

                {/* Budget Alerts */}
                <XStack alignItems="center" justifyContent="space-between" paddingVertical="$2.5">
                  <XStack alignItems="center" gap="$3">
                    <Circle size="$2.5" backgroundColor="$green4">
                      <DollarSign size={16} color="#10B981" />
                    </Circle>
                    <Text>{t("Budget Alerts")}</Text>
                  </XStack>
                  <Switch
                    size="$2"
                    checked={settings.budgetAlerts}
                    disabled={!settings.pushEnabled}
                    onCheckedChange={() => toggleNotification('budgetAlerts')}
                  ><Switch.Thumb animation="bouncy" /></Switch>
                </XStack>

                {/* Weekly Reports (active) */}
                <XStack alignItems="center" justifyContent="space-between" paddingVertical="$2.5">
                  <XStack alignItems="center" gap="$3">
                    <Circle size="$2.5" backgroundColor="$red4">
                      <Calendar size={16} color="#EF4444" />
                    </Circle>
                    <Text>{t("Weekly Reports")}</Text>
                  </XStack>
                  <Switch
                    size="$2"
                    checked={settings.weeklyReports}
                    disabled={!settings.pushEnabled}
                    onCheckedChange={() => toggleNotification('weeklyReports')}
                  ><Switch.Thumb animation="bouncy" /></Switch>
                </XStack>

                {/* Bill Due Reminders (hidden feature) */}
                {/* <XStack alignItems="center" justifyContent="space-between" paddingVertical="$2.5">
                  <XStack alignItems="center" gap="$3">
                    <Circle size="$2.5" backgroundColor="$blue4">
                      <Calendar size={16} color="#3B82F6" />
                    </Circle>
                    <XStack gap="$2" alignItems="center">
                      <Text>{t("Bill Due Reminders")}</Text>
                      <Text fontSize="$2" color="$gray6">{t("Coming Soon")}</Text>
                    </XStack>
                  </XStack>
                  <Switch size="$2" disabled={true} checked={false}><Switch.Thumb /></Switch>
                </XStack> */}

                {/* Family Updates (hidden) */}
                {/* <XStack alignItems="center" justifyContent="space-between" paddingVertical="$2.5">
                  <XStack alignItems="center" gap="$3">
                    <Circle size="$2.5" backgroundColor="$purple4">
                      <Users size={16} color="#8B5CF6" />
                    </Circle>
                    <XStack gap="$2" alignItems="center">
                      <Text>{t("Family Updates")}</Text>
                      <Text fontSize="$2" color="$gray6">{t("Coming Soon")}</Text>
                    </XStack>
                  </XStack>
                  <Switch size="$2" disabled={true} checked={false}><Switch.Thumb /></Switch>
                </XStack> */}
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
        </ScrollView>
      </YStack>
    </SafeAreaView>
  );
} 
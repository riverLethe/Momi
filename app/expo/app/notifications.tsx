import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeftIcon, DollarSign, Calendar, Clock } from "lucide-react-native";
import {
  Button,
  H2,
  Text,
  XStack,
  YStack,
  Card,
  Switch,
  Circle,
  ScrollView,
  Separator,
} from "tamagui";

import { useNotifications } from "@/providers/NotificationProvider";
import { useTranslation } from "react-i18next";

export default function NotificationsScreen() {
  const router = useRouter();
  const { settings, updateSettings } = useNotifications();
  const { t } = useTranslation();

  const toggleNotification = (key: keyof typeof settings) => {
    updateSettings({ [key]: !settings[key] });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <YStack flex={1} padding="$2" gap="$6">
        <XStack alignItems="center">
          <Button
            size="$3"
            circular
            borderRadius="$2"
            chromeless
            onPress={() => router.back()}
            icon={<ChevronLeftIcon size={20} />}
            pressStyle={{
              backgroundColor: "transparent",
              opacity: 0.5,
              borderColor: "transparent",
            }}
          />
        </XStack>

        <YStack flex={1} paddingHorizontal="$4" paddingTop="$4">
          <YStack alignItems="center" gap="$2" marginTop="$4">
            <H2>{t("Notification Settings")}</H2>
            <Text color="$gray10" textAlign="center">
              {t("Customize which notifications you want to receive")}
            </Text>
          </YStack>

          <ScrollView flex={1} contentContainerStyle={{ paddingVertical: 24 }}>
            <Card backgroundColor="$gray1" borderRadius="$4" borderWidth={1} borderColor="$gray4">

              <YStack>
                {/* Log Reminders */}
                <XStack
                  alignItems="center"
                  justifyContent="space-between"
                  padding="$4"
                  onPress={() => settings.pushEnabled && toggleNotification('logReminders')}
                  opacity={settings.pushEnabled ? 1 : 0.6}
                  pressStyle={settings.pushEnabled ? { opacity: 0.8 } : {}}
                >
                  <XStack alignItems="center" gap="$3">
                    <Circle size="$2.5" backgroundColor="$cyan4">
                      <Clock size={24} color="#06B6D4" />
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
                <Separator />

                {/* Budget Alerts */}
                <XStack
                  alignItems="center"
                  justifyContent="space-between"
                  padding="$4"
                  onPress={() => settings.pushEnabled && toggleNotification('budgetAlerts')}
                  opacity={settings.pushEnabled ? 1 : 0.6}
                  pressStyle={settings.pushEnabled ? { opacity: 0.8 } : {}}
                >
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
                <Separator />

                {/* Weekly Reports */}
                <XStack
                  alignItems="center"
                  justifyContent="space-between"
                  padding="$4"
                  onPress={() => settings.pushEnabled && toggleNotification('weeklyReports')}
                  opacity={settings.pushEnabled ? 1 : 0.6}
                  pressStyle={settings.pushEnabled ? { opacity: 0.8 } : {}}
                >
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
              </YStack>
            </Card>

            <Card padding="$4" backgroundColor="$blue2" marginTop="$5" >
              <Text color="$blue11" fontWeight="$6">
                {t("Notification Delivery")}
              </Text>
              <Text color="$blue11" fontSize="$3" marginTop="$2">
                {t("We'll only send you notifications during daytime hours (8:00 AM - 10:00 PM) based on your device's time zone.")}
              </Text>
            </Card>
          </ScrollView>
        </YStack>
      </YStack>
    </SafeAreaView >
  );
} 
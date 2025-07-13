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
  useTheme,
} from "tamagui";

import { useNotifications } from "@/providers/NotificationProvider";
import { useTranslation } from "react-i18next";

export default function NotificationsScreen() {
  const router = useRouter();
  const { settings, updateSettings } = useNotifications();
  const { t } = useTranslation();
  const theme = useTheme();

  const toggleNotification = (key: keyof typeof settings) => {
    updateSettings({ [key]: !settings[key] });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background?.get() }} edges={['top']}>
      <YStack flex={1} padding="$2" gap="$6" backgroundColor="$background">
        <XStack alignItems="center">
          <Button
            size="$3"
            circular
            borderRadius="$2"
            chromeless
            onPress={() => router.back()}
            icon={<ChevronLeftIcon size={20} color={theme.color?.get()} />}
            pressStyle={{
              backgroundColor: "transparent",
              opacity: 0.5,
              borderColor: "transparent",
            }}
          />
        </XStack>

        <YStack flex={1} paddingHorizontal="$4" paddingTop="$4">
          <YStack alignItems="center" gap="$2" marginTop="$4">
            <H2 color="$color">{t("Notification Settings")}</H2>
            <Text color="$color10" textAlign="center">
              {t("Manage your notification preferences")}
            </Text>
          </YStack>

          <ScrollView flex={1} contentContainerStyle={{ paddingVertical: 24 }}>
            <Card backgroundColor="$card" borderRadius="$4" borderWidth={1} borderColor="$borderColor">

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
                    <Text color="$color">{t("Log Reminders")}</Text>
                  </XStack>
                  <Switch
                    size="$3"
                    checked={settings.logReminders}
                    disabled={!settings.pushEnabled}
                    onCheckedChange={() => toggleNotification('logReminders')}
                    backgroundColor={settings.logReminders ? "$blue9" : "$gray5"}
                  >
                    <Switch.Thumb
                      animation="bouncy"
                      backgroundColor="white"
                      scale={settings.logReminders ? 0.9 : 0.8}
                    />
                  </Switch>
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
                    <Circle size="$2.5" backgroundColor="$yellow4">
                      <DollarSign size={16} color="#F59E0B" />
                    </Circle>
                    <Text color="$color">{t("Budget Alerts")}</Text>
                  </XStack>
                  <Switch
                    size="$3"
                    checked={settings.budgetAlerts}
                    disabled={!settings.pushEnabled}
                    onCheckedChange={() => toggleNotification('budgetAlerts')}
                    backgroundColor={settings.budgetAlerts ? "$blue9" : "$gray5"}
                  >
                    <Switch.Thumb
                      animation="bouncy"
                      backgroundColor="white"
                      scale={settings.budgetAlerts ? 0.9 : 0.8}
                    />
                  </Switch>
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
                    <Text color="$color">{t("Weekly Reports")}</Text>
                  </XStack>
                  <Switch
                    size="$3"
                    checked={settings.weeklyReports}
                    disabled={!settings.pushEnabled}
                    onCheckedChange={() => toggleNotification('weeklyReports')}
                    backgroundColor={settings.weeklyReports ? "$blue9" : "$gray5"}
                  >
                    <Switch.Thumb
                      animation="bouncy"
                      backgroundColor="white"
                      scale={settings.weeklyReports ? 0.9 : 0.8}
                    />
                  </Switch>
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
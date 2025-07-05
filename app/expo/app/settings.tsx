import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Moon, Sun, Globe, ChevronDown, Clock, ChevronLeftIcon, RefreshCwOff } from "lucide-react-native";
import {
  Button,
  H2,
  Text,
  XStack,
  YStack,
  Card,
  Switch,
  Select,
  Adapt,
  Sheet,
  useTheme as useTamaguiTheme,
  Separator,
} from "tamagui";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/providers/I18nProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useSyncSettings } from "@/hooks/useSyncSettings";

// 内联格式化函数
const formatLastSync = (date: Date): string => {
  const now = new Date();
  const timeDiff = now.getTime() - date.getTime();
  const minutes = Math.floor(timeDiff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} ${days > 1 ? 'days' : 'day'} ago`;
  if (hours > 0) return `${hours} ${hours > 1 ? 'hours' : 'hour'} ago`;
  if (minutes > 0) return `${minutes} ${minutes > 1 ? 'minutes' : 'minute'} ago`;
  return "Just now";
};

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const { actualTheme, setThemeMode } = useTheme();
  const { isAuthenticated } = useAuth();
  const {
    performManualSync,
    lastSyncTime,
  } = useSyncSettings();
  const tamaguiTheme = useTamaguiTheme();

  const getThemeIcon = () => {
    return actualTheme === 'dark'
      ? <Moon size={24} color={tamaguiTheme.color?.get()} />
      : <Sun size={24} color={tamaguiTheme.color?.get()} />;
  };

  const handleManualSync = async () => {
    try {
      await performManualSync();
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <YStack flex={1} padding="$2" gap="$6" backgroundColor="$background">
        <XStack alignItems="center">
          <Button
            size="$3"
            circular
            borderRadius="$2"
            chromeless
            onPress={() => router.back()}
            icon={<ChevronLeftIcon size={20} color={tamaguiTheme.color?.get()} />}
            pressStyle={{
              backgroundColor: "transparent",
              opacity: 0.5,
              borderColor: "transparent",
            }}
          />
        </XStack>

        <YStack flex={1} paddingHorizontal="$4" paddingTop="$4">
          <YStack alignItems="center" gap="$2" marginTop="$4">
            <H2 color="$color">{t("App Settings")}</H2>


            {/* Last sync info in footer style */}
            {
              isAuthenticated && (<XStack gap="$1" alignItems="center" justifyContent="center" backgroundColor="transparent">
                <Clock size={10} color={tamaguiTheme.color11?.get()} />
                <Text fontSize="$2" color="$color11" opacity={0.7} textAlign="center">
                  {t("Last Sync")}: {lastSyncTime ? formatLastSync(lastSyncTime) : t("Never synced")}
                </Text>
              </XStack>)
            }
          </YStack>

          <YStack gap="$5" marginTop="$6" flex={1}>
            <Card borderRadius="$4" backgroundColor="$card">
              <XStack padding="$4" alignItems="center" justifyContent="space-between">
                <XStack alignItems="center" gap="$2">
                  {getThemeIcon()}
                  <Text fontSize="$4" color="$color">{t("Theme")}</Text>
                </XStack>

                <Switch
                  size="$3"
                  checked={actualTheme === 'dark'}
                  onCheckedChange={(val) => {
                    setThemeMode(val ? 'dark' : 'light');
                  }}
                  backgroundColor={actualTheme === 'dark' ? "$blue9" : "$gray5"}
                >
                  <Switch.Thumb
                    backgroundColor="white"
                    scale={actualTheme === 'dark' ? 0.9 : 0.8}
                  />
                </Switch>
              </XStack>

              <Separator />

              <XStack paddingHorizontal="$4" paddingVertical="$2" alignItems="center" justifyContent="space-between">
                <XStack alignItems="center" gap="$2">
                  <Globe size={20} />
                  <Text fontSize="$4" color="$color">{t("Language")}</Text>
                </XStack>

                <Select value={language} onValueChange={setLanguage}>
                  <Select.Trigger width={120} borderRadius="$4">
                    <Select.Value placeholder={t("Select language")}>
                      {language === "en" ? t("English") :
                        language === "zh" ? t("中文") :
                          language === "es" ? t("Español") : t("System")}
                    </Select.Value>
                    <Select.Icon>
                      <ChevronDown size={20} />
                    </Select.Icon>
                  </Select.Trigger>
                  <Adapt platform="touch">
                    <Sheet modal snapPoints={[30]}>
                      <Sheet.Frame>
                        <Sheet.ScrollView>
                          <Adapt.Contents />
                        </Sheet.ScrollView>
                      </Sheet.Frame>
                      <Sheet.Overlay />
                    </Sheet>
                  </Adapt>
                  <Select.Content>
                    <Select.ScrollUpButton />
                    <Select.Viewport>
                      <Select.Group>
                        <Select.Item index={0} value="system">
                          <Select.ItemText>{t("System")}</Select.ItemText>
                        </Select.Item>
                        <Select.Item index={1} value="en">
                          <Select.ItemText>{t("English")}</Select.ItemText>
                        </Select.Item>
                        <Select.Item index={2} value="zh">
                          <Select.ItemText>{t("中文")}</Select.ItemText>
                        </Select.Item>
                        <Select.Item index={3} value="es">
                          <Select.ItemText>{t("Español")}</Select.ItemText>
                        </Select.Item>
                      </Select.Group>
                    </Select.Viewport>
                    <Select.ScrollDownButton />
                  </Select.Content>
                </Select>
              </XStack>


            </Card>
          </YStack>

          <YStack flex={1} />

          <YStack alignItems="center" marginBottom="$6" gap="$2">
            {/* App version information */}
            <Text color="$color11">
              MomiQ v1.0.0
            </Text>
            <Text fontSize="$2" color="$color9" >
              © 2025 MomiQ Finance Inc.
            </Text>
          </YStack>
        </YStack>
      </YStack>
    </SafeAreaView>
  );
} 
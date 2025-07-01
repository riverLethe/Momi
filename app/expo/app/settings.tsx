import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeftIcon, Moon, Sun, Globe } from "lucide-react-native";
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
} from "tamagui";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/providers/I18nProvider";
import { useTheme } from "@/providers/ThemeProvider";

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const { themeMode, actualTheme, setThemeMode } = useTheme();
  const tamaguiTheme = useTamaguiTheme();

  const getThemeIcon = () => {
    // Show moon or sun icon based on the actual rendered theme.
    return actualTheme === 'dark'
      ? <Moon size={24} color={tamaguiTheme.color?.get()} />
      : <Sun size={24} color={tamaguiTheme.color?.get()} />;
  };

  const getThemeDisplayText = () => {
    switch (themeMode) {
      case 'dark':
        return t("Dark");
      case 'light':
        return t("Light");
      case 'system':
      default:
        return t("System");
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
          </YStack>

          <YStack gap="$5" marginTop="$6" flex={1}>
            <Card padding="$4" borderRadius="$4" backgroundColor="$card">
              <XStack alignItems="center" justifyContent="space-between" height={50}>
                <XStack alignItems="center" gap="$2">
                  {getThemeIcon()}
                  <Text fontSize="$4" color="$color">{t("Theme")}</Text>
                </XStack>

                <Switch
                  size="$3"
                  checked={actualTheme === 'dark'}
                  onCheckedChange={(val) => setThemeMode(val ? 'dark' : 'light')}
                  backgroundColor={actualTheme === 'dark' ? "$blue9" : "$gray5"}
                >
                  <Switch.Thumb
                    animation="bouncy"
                    backgroundColor="white"
                    scale={actualTheme === 'dark' ? 0.9 : 0.8}
                  />
                </Switch>
              </XStack>
            </Card>

            <Card padding="$4" borderRadius="$4" backgroundColor="$card">
              <XStack alignItems="center" justifyContent="space-between">
                <XStack alignItems="center" gap="$2">
                  <Globe size={20} color="$blue9" />
                  <Text fontSize="$4" color="$color">{t("Language")}</Text>
                </XStack>

                <Select value={language} onValueChange={setLanguage}>
                  <Select.Trigger width={120} borderRadius="$4">
                    <Select.Value placeholder={t("Select language")}>
                      {language === "en" ? t("English") :
                        language === "zh" ? t("中文") :
                          language === "es" ? t("Español") : t("System")}
                    </Select.Value>
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

            <YStack flex={1} />

            <YStack alignItems="center" marginBottom="$6">
              <Text color="$color11">
                MomiQ v1.0.0
              </Text>
              <Text fontSize="$2" color="$color9" marginTop="$2">
                © 2023 MomiQ Finance Inc.
              </Text>
            </YStack>
          </YStack>
        </YStack>
      </YStack>
    </SafeAreaView>
  );
} 
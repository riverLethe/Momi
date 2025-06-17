import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Moon, Sun, Globe } from "lucide-react-native";
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
} from "tamagui";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/providers/I18nProvider";

export default function SettingsScreen() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);

  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <YStack flex={1} padding="$4">
        <XStack alignItems="center" marginBottom="$4">
          <Button
            size="$3"
            circular
            icon={<ArrowLeft size={24} color="#000" />}
            onPress={() => router.back()}
          />
          <H2 marginLeft="$2">{t("App Settings")}</H2>
        </XStack>

        <YStack gap="$4">
          <Card padding="$4" elevate>
            <Text fontSize="$5" fontWeight="$6" marginBottom="$4">
              {t("Display")}
            </Text>

            <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
              <XStack alignItems="center" gap="$2">
                {darkMode ? (
                  <Moon size={24} color="#6B7280" />
                ) : (
                  <Sun size={24} color="#F59E0B" />
                )}
                <Text fontSize="$4">{t("Dark Mode")}</Text>
              </XStack>
              <Switch
                size="$2"
                checked={darkMode}
                onCheckedChange={(checked) => setDarkMode(checked)}
              ><Switch.Thumb animation="bouncy" /></Switch>
            </XStack>
          </Card>

          <Card padding="$4" elevate>
            <Text fontSize="$5" fontWeight="$6" marginBottom="$4">
              {t("Language")}
            </Text>

            <XStack alignItems="center" justifyContent="space-between">
              <XStack alignItems="center" gap="$2">
                <Globe size={24} color="#3B82F6" />
                <Text fontSize="$4">{t("Language")}</Text>
              </XStack>
              
              <Select value={language} onValueChange={setLanguage}>
                <Select.Trigger width={120}>
                  <Select.Value placeholder={t("Select language")}>
                    {language === "en" ? t("English") : 
                     language === "zh" ? t("中文") : 
                     language === "es" ? t("Español") : t("English")}
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
                      <Select.Item index={0} value="en">
                        <Select.ItemText>{t("English")}</Select.ItemText>
                      </Select.Item>
                      <Select.Item index={1} value="zh">
                        <Select.ItemText>{t("中文")}</Select.ItemText>
                      </Select.Item>
                      <Select.Item index={2} value="es">
                        <Select.ItemText>{t("Español")}</Select.ItemText>
                      </Select.Item>
                    </Select.Group>
                  </Select.Viewport>
                  <Select.ScrollDownButton />
                </Select.Content>
              </Select>
            </XStack>
          </Card>

          <Card padding="$4" elevate>
            <Text fontSize="$5" fontWeight="$6" marginBottom="$2">
              {t("About")}
            </Text>
            <Text color="$gray10">
            MomiQ v1.0.0
            </Text>
            <Text fontSize="$2" color="$gray8" marginTop="$2">
              © 2023 MomiQ Finance Inc.
            </Text>
          </Card>
        </YStack>
      </YStack>
    </SafeAreaView>
  );
} 
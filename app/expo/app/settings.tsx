import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Moon, Sun, Globe, ChevronDown, Clock, ChevronLeftIcon, RefreshCwOff, RefreshCw, Download } from "lucide-react-native";
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
import { apiClient } from "@/utils/api";
import { getAuthToken } from "@/utils/userPreferences.utils";

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const { actualTheme, setThemeMode } = useTheme();
  const { isAuthenticated } = useAuth();
  const {
    performManualSync,
    getLastSyncText,
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

  const handleFetchRemoteBills = async () => {
    try {
      console.log('开始获取远程账单信息...');
      
      // 检查用户是否已登录
      if (!isAuthenticated) {
        alert('请先登录后再获取远程账单');
        return;
      }

      // 获取认证token
      const token = await getAuthToken();
      if (!token) {
        alert('认证失败，请重新登录');
        return;
      }

      // 调用API获取远程账单数据
      const bills = await apiClient.sync.downloadBills(token);
      
      console.log('成功获取远程账单:', bills);
      alert(`成功获取 ${bills.length} 条远程账单数据！\n\n数据已在控制台输出，可查看详细信息。`);
      
    } catch (error) {
      console.error('获取远程账单失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      alert(`获取远程账单失败: ${errorMessage}`);
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
                  {t("Last Sync")}: {getLastSyncText()}
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

              {/* <Separator />
              
              <XStack paddingHorizontal="$4" paddingVertical="$3" alignItems="center" justifyContent="space-between">
                <XStack alignItems="center" gap="$2">
                  <Download size={20} color={tamaguiTheme.color?.get()} />
                  <Text fontSize="$4" color="$color">{t("获取远程账单")}</Text>
                </XStack>
                <Button
                  size="$3"
                  onPress={handleFetchRemoteBills}
                  backgroundColor="$blue9"
                  color="white"
                  borderRadius="$3"
                  paddingHorizontal="$3"
                  pressStyle={{
                    backgroundColor: "$blue10",
                    scale: 0.95,
                  }}
                >
                  <Text color="white" fontSize="$3">{t("获取")}</Text>
                </Button>
              </XStack> */}

              {/* {isAuthenticated && (
                <>
                  <Separator />
                  <XStack paddingHorizontal="$4" paddingVertical="$3" alignItems="center" justifyContent="space-between">
                    <XStack alignItems="center" gap="$2">
                      <RefreshCwOff size={20} />
                      <Text fontSize="$4" color="$color">{t("Manual Sync")}</Text>
                    </XStack>
                    <Button
                      size="$2"
                      onPress={handleManualSync}
                      chromeless
                      backgroundColor="$gray3"
                      height="$3"
                      width="$3"
                      icon={<RefreshCw size={20} />}
                    >
                    </Button>
                  </XStack>
                </>
              )} */}


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
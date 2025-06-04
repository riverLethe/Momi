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

export default function SettingsScreen() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("en");

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
          <H2 marginLeft="$2">App Settings</H2>
        </XStack>

        <YStack space="$4">
          <Card padding="$4" elevate>
            <Text fontSize="$5" fontWeight="$6" marginBottom="$4">
              Display
            </Text>

            <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
              <XStack alignItems="center" space="$2">
                {darkMode ? (
                  <Moon size={24} color="#6B7280" />
                ) : (
                  <Sun size={24} color="#F59E0B" />
                )}
                <Text fontSize="$4">Dark Mode</Text>
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
              Language
            </Text>

            <XStack alignItems="center" justifyContent="space-between">
              <XStack alignItems="center" space="$2">
                <Globe size={24} color="#3B82F6" />
                <Text fontSize="$4">Language</Text>
              </XStack>
              
              <Select value={language} onValueChange={setLanguage}>
                <Select.Trigger width={120}>
                  <Select.Value placeholder="Select language">
                    {language === "en" ? "English" : 
                     language === "zh" ? "中文" : 
                     language === "es" ? "Español" : "English"}
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
                        <Select.ItemText>English</Select.ItemText>
                      </Select.Item>
                      <Select.Item index={1} value="zh">
                        <Select.ItemText>中文</Select.ItemText>
                      </Select.Item>
                      <Select.Item index={2} value="es">
                        <Select.ItemText>Español</Select.ItemText>
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
              About
            </Text>
            <Text color="$gray10">
              Momi v1.0.0
            </Text>
            <Text fontSize="$2" color="$gray8" marginTop="$2">
              © 2023 Momi Finance Inc.
            </Text>
          </Card>
        </YStack>
      </YStack>
    </SafeAreaView>
  );
} 
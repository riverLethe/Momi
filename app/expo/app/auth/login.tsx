import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Apple, ChevronLeftIcon } from "lucide-react-native";
import {
  View,
  Text,
  Button,
  XStack,
  YStack,
  H1,
  Paragraph,
  useTheme,
} from "tamagui";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "@/providers/AuthProvider";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { WeChatIcon } from "@/components/ui/WeChatIcon";
import { useGoogleConfig } from "@/hooks/useGoogleConfig";
import { useLocale } from "@/i18n/useLocale";

export default function LoginScreen() {
  const router = useRouter();
  const { loginWithGoogle, loginWithApple, loginWithWeChat, isLoading } = useAuth();
  const { t } = useTranslation();
  const { isGoogleConfigured } = useGoogleConfig();
  const { locale } = useLocale();
  const theme = useTheme();

  const isChinese = locale.startsWith("zh");

  const handleGoogleLogin = async () => {
    try {
      const success = await loginWithGoogle();
      if (success) {
        router.back();
      }
    } catch (error) {
      Alert.alert(t("Login Failed"), t("Google login failed. Please try again."));
    }
  };

  const handleAppleLogin = async () => {
    try {
      const success = await loginWithApple();
      if (success) {
        router.back();
      }
    } catch (error) {
      Alert.alert(t("Login Failed"), t("Apple login failed. Please try again."));
    }
  };

  const handleWeChatLogin = async () => {
    try {
      const success = await loginWithWeChat();
      if (success) {
        router.back();
      }
    } catch (error) {
      Alert.alert(t("Login Failed"), t("WeChat login failed. Please try again."));
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <YStack flex={1} backgroundColor="$background">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <YStack flex={1}>
            {/* Header */}
            <XStack padding="$2" paddingBottom="$2" alignItems="center">

              <Button size="$3"
                circular borderRadius="$2"
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

            {/* Content Container */}
            <YStack flex={1} paddingHorizontal="$4" paddingTop="$4">
              {/* Title Section */}
              <YStack marginBottom="$8" alignItems="center">
                <H1 fontSize="$8" fontWeight="$8" color="$color" marginBottom="$3" textAlign="center">
                  {t("Welcome back")}
                </H1>
                <Paragraph
                  color="$color10"
                  fontSize="$4"
                  textAlign="center"
                  lineHeight="$5"
                  maxWidth={280}
                >
                  {t("Sign in to continue and sync your data")}
                </Paragraph>
              </YStack>

              {/* Social Login Section */}
              <YStack marginBottom="$8" alignItems="center">
                <Button
                  size="$5"
                  width="100%"
                  backgroundColor="$card"
                  borderColor="$borderColor"
                  borderWidth={1}
                  borderRadius="$4"
                  marginBottom="$4"
                  onPress={handleGoogleLogin}
                  disabled={isLoading}
                  icon={<GoogleIcon size={24} />}
                >
                  <Text color="$color" fontWeight="$6" fontSize="$4">
                    {isLoading ? t("Signing in...") : t("Continue with Google")}
                  </Text>
                </Button>

                {Platform.OS === "ios" && (
                  <Button
                    size="$5"
                    width="100%"
                    backgroundColor="#000"
                    borderRadius="$4"
                    marginBottom="$4"
                    onPress={handleAppleLogin}
                    disabled={isLoading}
                    icon={<Apple size={24} color="white" />}
                    pressStyle={{ backgroundColor: "$black8" }}
                    hoverStyle={{ backgroundColor: "$black6" }}
                  >
                    <Text color="white" fontWeight="$6" fontSize="$4">
                      {isLoading ? t("Signing in...") : t("Continue with Apple")}
                    </Text>
                  </Button>
                )}

                <Button
                  size="$5"
                  width="100%"
                  backgroundColor="$green9"
                  borderRadius="$4"
                  onPress={handleWeChatLogin}
                  hoverStyle={{ backgroundColor: "$green10" }}
                  pressStyle={{ backgroundColor: "$green11" }}
                  disabled={isLoading}
                  icon={<WeChatIcon size={24} color="white" />}
                >
                  <Text color="white" fontWeight="$6" fontSize="$4">
                    {t("Continue with WeChat")}
                  </Text>
                </Button>
              </YStack>

              {/* Footer */}
              <YStack marginTop="auto" marginBottom="$6" alignItems="center">
                <Paragraph color="$color10" fontSize="$3" textAlign="center" lineHeight="$4">
                  {t("By signing in, you agree to our")}{"\n"}
                  <Text color="$blue9" textDecorationLine="underline">
                    {t("Terms of Service")}
                  </Text>
                  {" " + t("and") + " "}
                  <Text color="$blue9" textDecorationLine="underline">
                    {t("Privacy Policy")}
                  </Text>
                </Paragraph>
              </YStack>
            </YStack>
          </YStack>
        </KeyboardAvoidingView>
      </YStack>
    </SafeAreaView>
  );
}

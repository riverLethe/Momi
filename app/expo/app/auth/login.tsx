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
} from "tamagui";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "@/providers/AuthProvider";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { useGoogleConfig } from "@/hooks/useGoogleConfig";
import { useLocale } from "@/i18n/useLocale";

export default function LoginScreen() {
  const router = useRouter();
  const { loginWithGoogle, loginWithApple, loginWithWeChat, isLoading } = useAuth();
  const { t } = useTranslation();
  const { isGoogleConfigured } = useGoogleConfig();
  const { locale } = useLocale();

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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
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
              icon={<ChevronLeftIcon size={20} />}
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
              <H1 fontSize="$8" fontWeight="$8" color="$gray12" marginBottom="$3" textAlign="center">
                {t("Welcome back")}
              </H1>
              <Paragraph
                color="$gray10"
                fontSize="$4"
                textAlign="center"
                lineHeight="$5"
                maxWidth={280}
              >
                {t("Sign in to continue and sync your data")}
              </Paragraph>
            </YStack>

            {/* Social Login Section */}
            <YStack gap="$3" marginBottom="$6">

              {/* WeChat Login - only for Chinese locale */}
              {isChinese && (
                <Button
                  size="$5"
                  backgroundColor="#1AAD19"
                  borderRadius="$4"
                  onPress={handleWeChatLogin}
                  disabled={isLoading}
                  hoverStyle={{ backgroundColor: "#179b16" }}
                  pressStyle={{ backgroundColor: "#128C15" }}
                >
                  <XStack alignItems="center" justifyContent="center" gap="$3">
                    <Ionicons name="logo-wechat" size={24} color="white" />

                    <Text fontWeight="$6" color="white" fontSize="$4">
                      {t("Continue with WeChat")}
                    </Text>
                  </XStack>
                </Button>
              )}
              {Platform.OS === "ios" && (
                <Button
                  size="$5"
                  backgroundColor="$gray12"
                  borderRadius="$4"
                  onPress={handleAppleLogin}
                  disabled={isLoading}
                  pressStyle={{ backgroundColor: "$gray11" }}
                  hoverStyle={{ backgroundColor: "$gray11" }}
                >
                  <XStack alignItems="center" justifyContent="center" gap="$3">
                    <Apple size={20} color="white" fill="white" />
                    <Text fontWeight="$6" color="white" fontSize="$4">
                      {t("Continue with Apple")}
                    </Text>
                  </XStack>
                </Button>
              )}

              {isGoogleConfigured && (
                <Button
                  size="$5"
                  backgroundColor="$background"
                  borderWidth={1.5}
                  borderColor="$gray6"
                  borderRadius="$4"
                  onPress={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <XStack alignItems="center" justifyContent="center" gap="$3">
                    <GoogleIcon size={20} />
                    <Text fontWeight="$6" color="$gray12" fontSize="$4">
                      {t("Continue with Google")}
                    </Text>
                  </XStack>
                </Button>
              )}

            </YStack>

            {/* Spacer */}
            <View flex={1} />

            {/* Footer */}
            <YStack paddingBottom="$6" alignItems="center">
              <Text color="$gray9" fontSize="$2" textAlign="center" lineHeight="$3">
                {t("By continuing, you agree to our Terms of Service and Privacy Policy")}
              </Text>
            </YStack>
          </YStack>
        </YStack>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

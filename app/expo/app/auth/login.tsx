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
  Text,
  Button,
  XStack,
  YStack,
  H1,
  Paragraph,
  useTheme,
  H2,
} from "tamagui";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/providers/AuthProvider";
import { GoogleIcon } from "@/components/ui/GoogleIcon";

export default function LoginScreen() {
  const router = useRouter();
  const { loginWithGoogle, loginWithApple, loginWithWeChat } = useAuth();
  const { t } = useTranslation();
  const theme = useTheme();


  const handleGoogleLogin = async () => {
    try {
      const success = await loginWithGoogle();
      if (success) {
        // 使用 setTimeout 确保状态更新后再导航
        setTimeout(() => {
          router.back();
        }, 100);
      }
    } catch (error) {
      Alert.alert(t("Login Failed"), t("Google login failed. Please try again."));
    }
  };

  const handleAppleLogin = async () => {
    try {
      const success = await loginWithApple();
      if (success) {
        // 使用 setTimeout 确保状态更新后再导航
        setTimeout(() => {
          router.back();
        }, 100);
      }
    } catch (error) {
      Alert.alert(t("Login Failed"), t("Apple login failed. Please try again."));
    }
  };

  const handleWeChatLogin = async () => {
    try {
      const success = await loginWithWeChat();
      if (success) {
        // 使用 setTimeout 确保状态更新后再导航
        setTimeout(() => {
          router.back();
        }, 100);
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
              <YStack alignItems="center" gap="$2" marginTop="$4">
                <H2 color="$color">{t("Welcome back")}</H2>
                <Text color="$color10" textAlign="center">
                  {t("Sign in to continue and sync your data")}
                </Text>
              </YStack>

              {/* Social Login Section */}
              <YStack marginVertical="$8" alignItems="center">


                {Platform.OS === "ios" && (
                  <Button
                    size="$5"
                    width="100%"
                    backgroundColor="#000"
                    borderRadius="$4"
                    marginBottom="$4"
                    onPress={handleAppleLogin}
                    icon={<Apple size={24} color="white" />}
                    pressStyle={{ backgroundColor: "$black8" }}
                    hoverStyle={{ backgroundColor: "$black6" }}
                  >
                    <Text color="white" fontWeight="$6" fontSize="$4">
                      {t("Continue with Apple")}
                    </Text>
                  </Button>
                )}
                <Button
                  size="$5"
                  width="100%"
                  backgroundColor="$card"
                  borderColor="$borderColor"
                  borderWidth={1}
                  borderRadius="$4"
                  marginBottom="$4"
                  onPress={handleGoogleLogin}
                  icon={<GoogleIcon size={24} />}
                >
                  <Text color="$color" fontWeight="$6" fontSize="$4">
                    {t("Continue with Google")}
                  </Text>
                </Button>

                {/* <Button
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
                </Button> */}
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

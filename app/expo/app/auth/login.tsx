import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Mail, Apple } from "lucide-react-native";
import {
  View,
  Text,
  Button,
  XStack,
  YStack,
  H1,
  Paragraph,
  Input,
  Separator,
} from "tamagui";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/providers/AuthProvider";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { useGoogleConfig } from "@/hooks/useGoogleConfig";

export default function LoginScreen() {
  const router = useRouter();
  const { login, loginWithGoogle, loginWithApple, isLoading } = useAuth();
  const { t } = useTranslation();
  const { isGoogleConfigured } = useGoogleConfig();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailValid, setEmailValid] = useState(true);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert(t("Error"), t("Please enter both email and password"));
      return;
    }

    if (!validateEmail(email)) {
      setEmailValid(false);
      Alert.alert(t("Error"), t("Please enter a valid email address"));
      return;
    }

    setEmailValid(true);
    const success = await login(email, password);
    if (success) {
      router.back();
    } else {
      Alert.alert(t("Login Failed"), t("Please check your credentials and try again."));
    }
  };

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <YStack padding="$4" flex={1}>
          <Button
            chromeless
            onPress={() => router.back()}
            marginBottom="$6"
            alignSelf="flex-start"
            padding="$0"
          >
            <ArrowLeft size={24} color="#1F2937" />
          </Button>

          <H1 marginBottom="$2">{t("Welcome back")}</H1>
          <Paragraph color="$gray10" marginBottom="$8">
            {t("Sign in to continue and sync your data")}
          </Paragraph>


          {/* Email Login Form */}
          <YStack gap="$4">
            <YStack>
              <Text color="$gray11" marginBottom="$1">
                {t("Email")}
              </Text>
              <Input
                backgroundColor="$background"
                padding="$4"
                borderRadius="$4"
                borderWidth={1}
                borderColor={!emailValid ? "$red8" : "$gray4"}
                placeholder={t("Enter your email")}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (!emailValid) setEmailValid(true);
                }}
              />
              {!emailValid && (
                <Text color="$red10" fontSize="$2" marginTop="$1">
                  {t("Please enter a valid email address")}
                </Text>
              )}
            </YStack>

            <YStack>
              <Text color="$gray11" marginBottom="$1">
                {t("Password")}
              </Text>
              <Input
                backgroundColor="$background"
                padding="$4"
                borderRadius="$4"
                borderWidth={1}
                borderColor="$gray4"
                placeholder={t("Enter your password")}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </YStack>
          </YStack>

          {/* Social Login Buttons */}
          <YStack gap="$3" marginBottom="$6">


            <Button
              marginTop="$8"
              backgroundColor={isLoading ? "$gray8" : "$blue9"}
              onPress={handleEmailLogin}
              disabled={isLoading}
              hoverStyle={{ backgroundColor: "$blue8" }}
              pressStyle={{ backgroundColor: "$blue10" }}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <XStack alignItems="center" justifyContent="center" gap="$2">
                  <Mail size={20} color="white" />
                  <Text color="white" fontWeight="$6" fontSize="$4">
                    {t("Sign in with Email")}
                  </Text>
                </XStack>
              )}
            </Button>

            {/* Divider */}
            <XStack alignItems="center" gap="$3" marginVertical="$3">
              <Separator flex={1} />
              <Text color="$gray10" fontSize="$2">
                {t("Or")}
              </Text>
              <Separator flex={1} />
            </XStack>
            {Platform.OS === "ios" && (
              <Button
                backgroundColor="$background"
                borderWidth={1}
                borderColor="$gray4"
                onPress={handleAppleLogin}
                disabled={isLoading}
                hoverStyle={{ backgroundColor: "$gray2" }}
                pressStyle={{ backgroundColor: "$gray3" }}
              >
                <XStack alignItems="center" justifyContent="center" gap="$3">
                  <Apple size={20} color="#000000" />
                  <Text fontWeight="$6" color="$black">
                    {t("Continue with Apple")}
                  </Text>
                </XStack>
              </Button>
            )}

            {isGoogleConfigured && (
              <Button
                backgroundColor="$background"
                borderWidth={1}
                borderColor="$gray4"
                onPress={handleGoogleLogin}
                disabled={isLoading}
                hoverStyle={{ backgroundColor: "$gray2" }}
                pressStyle={{ backgroundColor: "$gray3" }}
              >
                <XStack alignItems="center" justifyContent="center" gap="$3">
                  <GoogleIcon size={20} />
                  <Text fontWeight="$6" color="$gray12">
                    {t("Continue with Google")}
                  </Text>
                </XStack>
              </Button>
            )}
          </YStack>
        </YStack>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

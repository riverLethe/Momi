import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Mail, Apple, Eye, EyeOff } from "lucide-react-native";
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
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailLogin, setShowEmailLogin] = useState(false);

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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <YStack flex={1}>
          {/* Header */}
          <XStack padding="$4" paddingBottom="$2" alignItems="center">
            <Button
              chromeless
              onPress={() => router.back()}
              padding="$2"
              borderRadius="$8"
              backgroundColor="$gray2"
            >
              <ArrowLeft size={20} color="#1F2937" />
            </Button>
          </XStack>

          {/* Content Container */}
          <YStack flex={1} paddingHorizontal="$6" paddingTop="$4">
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
            {!showEmailLogin && (
              <YStack gap="$3" marginBottom="$6">
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
                      <Apple size={20} color="white" />
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
                    hoverStyle={{ backgroundColor: "$gray2", borderColor: "$gray8" }}
                    pressStyle={{ backgroundColor: "$gray3" }}
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
            )}

            {/* Divider */}
            {!showEmailLogin && (Platform.OS === "ios" || isGoogleConfigured) && (
              <XStack alignItems="center" gap="$4" marginBottom="$6">
                <Separator flex={1} backgroundColor="$gray6" />
                <Text color="$gray9" fontSize="$3" fontWeight="$5">
                  {t("Or")}
                </Text>
                <Separator flex={1} backgroundColor="$gray6" />
              </XStack>
            )}

            {/* Email Login Toggle */}
            {!showEmailLogin ? (
              <Button
                size="$5"
                backgroundColor="$background"
                borderWidth={1.5}
                borderColor="$gray6"
                borderRadius="$4"
                onPress={() => setShowEmailLogin(true)}
                hoverStyle={{ backgroundColor: "$gray2", borderColor: "$gray8" }}
                pressStyle={{ backgroundColor: "$gray3" }}
              >
                <XStack alignItems="center" justifyContent="center" gap="$3">
                  <Mail size={20} color="#6B7280" />
                  <Text fontWeight="$6" color="$gray11" fontSize="$4">
                    {t("Sign in with Email")}
                  </Text>
                </XStack>
              </Button>
            ) : (
              /* Email Login Form */
              <YStack gap="$4" marginTop="$2">
                <YStack gap="$2">
                  <Text color="$gray11" fontSize="$3" fontWeight="$6">
                    {t("Email")}
                  </Text>
                  <Input
                    size="$5"
                    backgroundColor="$gray1"
                    borderWidth={1.5}
                    borderColor={!emailValid ? "$red8" : "$gray5"}
                    borderRadius="$4"
                    placeholder={t("Enter your email")}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (!emailValid) setEmailValid(true);
                    }}
                    focusStyle={{
                      borderColor: !emailValid ? "$red8" : "$blue8",
                      backgroundColor: "$background"
                    }}
                  />
                  {!emailValid && (
                    <Text color="$red10" fontSize="$2" marginTop="$1">
                      {t("Please enter a valid email address")}
                    </Text>
                  )}
                </YStack>

                <YStack gap="$2">
                  <Text color="$gray11" fontSize="$3" fontWeight="$6">
                    {t("Password")}
                  </Text>
                  <XStack position="relative">
                    <Input
                      flex={1}
                      size="$5"
                      backgroundColor="$gray1"
                      borderWidth={1.5}
                      borderColor="$gray5"
                      borderRadius="$4"
                      placeholder={t("Enter your password")}
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                      focusStyle={{
                        borderColor: "$blue8",
                        backgroundColor: "$background"
                      }}
                    />
                    <Button
                      position="absolute"
                      right="$2"
                      top="50%"
                      transform={[{ translateY: -12 }]}
                      chromeless
                      size="$2"
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff size={20} color="#9CA3AF" />
                      ) : (
                        <Eye size={20} color="#9CA3AF" />
                      )}
                    </Button>
                  </XStack>
                </YStack>

                <Button
                  size="$5"
                  backgroundColor={isLoading ? "$gray8" : "$blue9"}
                  borderRadius="$4"
                  marginTop="$2"
                  onPress={handleEmailLogin}
                  disabled={isLoading}
                  hoverStyle={{ backgroundColor: "$blue8" }}
                  pressStyle={{ backgroundColor: "$blue10" }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text color="white" fontWeight="$7" fontSize="$4">
                      {t("Sign in with Email")}
                    </Text>
                  )}
                </Button>

                {/* Back to social login */}
                <Button
                  chromeless
                  marginTop="$2"
                  onPress={() => setShowEmailLogin(false)}
                >
                  <Text color="$gray10" fontSize="$3" textAlign="center">
                    {t("Back to other options")}
                  </Text>
                </Button>
              </YStack>
            )}

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

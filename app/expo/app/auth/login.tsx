import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import {
  View,
  Text,
  Button,
  XStack,
  YStack,
  H1,
  Paragraph,
  Input,
  Form,
} from "tamagui";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/providers/AuthProvider";

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const { t } = useTranslation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert(t("Error"), t("Please enter both username and password"));
      return;
    }

    const success = await login(username, password);
    if (success) {
      router.back();
    } else {
      Alert.alert(t("Login Failed"), t("Please check your credentials and try again."));
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
            {t("Sign in to continue")}
          </Paragraph>

          <YStack space="$4">
            <YStack>
              <Text color="$gray11" marginBottom="$1">
                {t("Username")}
              </Text>
              <Input
                backgroundColor="$background"
                padding="$4"
                borderRadius="$4"
                borderWidth={1}
                borderColor="$gray4"
                placeholder={t("Enter your username")}
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
              />
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

          <Button
            marginTop="$8"
            borderRadius="$4"
            padding="$4"
            backgroundColor={isLoading ? "$gray8" : "$blue9"}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text color="white" fontWeight="$6" fontSize="$5">
                {t("Login")}
              </Text>
            )}
          </Button>

          <XStack marginTop="$8" justifyContent="center" alignItems="center">
            <Text color="$gray10">{t("Don't have an account?")} </Text>
            <Button
              chromeless
              onPress={() => router.push("/auth/register" as any)}
            >
              <Text color="$blue9" fontWeight="$6">
                {t("Sign up")}
              </Text>
            </Button>
          </XStack>
        </YStack>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

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
} from "tamagui";

import { useAuth } from "@/providers/AuthProvider";

export default function RegisterScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRegister = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    // In a real app, you would register the user with your backend
    // For this demo, we'll just log them in directly
    const success = await login(username, password);
    if (success) {
      router.replace("/(tabs)");
    } else {
      Alert.alert(
        "Registration Failed",
        "An error occurred. Please try again."
      );
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

          <H1 marginBottom="$2">Create Account</H1>
          <Paragraph color="$gray10" marginBottom="$8">
            Sign up to start tracking your finances
          </Paragraph>

          <YStack space="$4">
            <YStack>
              <Text color="$gray11" marginBottom="$1">
                Username
              </Text>
              <Input
                backgroundColor="$background"
                padding="$4"
                borderRadius="$4"
                borderWidth={1}
                borderColor="$gray4"
                placeholder="Enter your username"
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
              />
            </YStack>

            <YStack>
              <Text color="$gray11" marginBottom="$1">
                Password
              </Text>
              <Input
                backgroundColor="$background"
                padding="$4"
                borderRadius="$4"
                borderWidth={1}
                borderColor="$gray4"
                placeholder="Create a password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </YStack>

            <YStack>
              <Text color="$gray11" marginBottom="$1">
                Confirm Password
              </Text>
              <Input
                backgroundColor="$background"
                padding="$4"
                borderRadius="$4"
                borderWidth={1}
                borderColor="$gray4"
                placeholder="Confirm your password"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </YStack>
          </YStack>

          <Button
            marginTop="$8"
            borderRadius="$4"
            padding="$4"
            backgroundColor={isLoading ? "$gray8" : "$blue9"}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text color="white" fontWeight="$6" fontSize="$5">
                Create Account
              </Text>
            )}
          </Button>

          <XStack marginTop="$8" justifyContent="center">
            <Text color="$gray10">Already have an account? </Text>
            <Button
              chromeless
              padding="$0"
              onPress={() => router.push("/auth/login" as any)}
            >
              <Text color="$blue9" fontWeight="$6">
                Sign in
              </Text>
            </Button>
          </XStack>
        </YStack>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

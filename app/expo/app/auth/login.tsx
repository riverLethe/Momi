import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "tamagui";
import { useRouter, Link } from "expo-router";
import { Mail, Lock, Eye, EyeOff } from "lucide-react-native";
import { useLanguage } from "@/hooks/useLanguage";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t("Error"), t("Please fill in all fields"));
      return;
    }

    // TODO: Implement actual login logic
    // For now, just navigate to home
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6">
        {/* Header */}
        <View className="mt-12 mb-8">
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            {t("Welcome Back")}
          </Text>
          <Text className="text-base text-gray-600">
            {t("Sign in to continue managing your finances")}
          </Text>
        </View>

        {/* Form */}
        <View className="space-y-4">
          {/* Email Input */}
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">
              {t("Email")}
            </Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg px-4 py-3">
              <Mail size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-base text-gray-900"
                placeholder={t("Enter your email")}
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Password Input */}
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">
              {t("Password")}
            </Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg px-4 py-3">
              <Lock size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-base text-gray-900"
                placeholder={t("Enter your password")}
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff size={20} color="#6B7280" />
                ) : (
                  <Eye size={20} color="#6B7280" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity className="self-end">
            <Text className="text-sm text-blue-500">
              {t("Forgot Password?")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Login Button */}
        <View className="mt-8">
          <Button
            size="$4"
            onPress={handleLogin}
            className="bg-blue-500 w-full"
          >
            {t("Sign In")}
          </Button>
        </View>

        {/* Register Link */}
        <View className="flex-row justify-center items-center mt-6">
          <Text className="text-gray-600">{t("Don't have an account?")}</Text>
          <Link href="/auth/register" asChild>
            <TouchableOpacity className="ml-2">
              <Text className="text-blue-500 font-medium">{t("Sign Up")}</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

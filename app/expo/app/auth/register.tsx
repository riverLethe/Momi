import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "tamagui";
import { useRouter, Link } from "expo-router";
import { Mail, Lock, Eye, EyeOff, User } from "lucide-react-native";
import { useLanguage } from "@/hooks/useLanguage";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert(t("Error"), t("Please fill in all fields"));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t("Error"), t("Passwords do not match"));
      return;
    }

    // TODO: Implement actual registration logic
    // For now, just navigate to home
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mt-12 mb-8">
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            {t("Create Account")}
          </Text>
          <Text className="text-base text-gray-600">
            {t("Start managing your finances smartly")}
          </Text>
        </View>

        {/* Form */}
        <View className="space-y-4">
          {/* Name Input */}
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">
              {t("Name")}
            </Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg px-4 py-3">
              <User size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-base text-gray-900"
                placeholder={t("Enter your name")}
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          </View>

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
                placeholder={t("Create a password")}
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

          {/* Confirm Password Input */}
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">
              {t("Confirm Password")}
            </Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg px-4 py-3">
              <Lock size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-base text-gray-900"
                placeholder={t("Confirm your password")}
                placeholderTextColor="#9CA3AF"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color="#6B7280" />
                ) : (
                  <Eye size={20} color="#6B7280" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Register Button */}
        <View className="mt-8">
          <Button
            size="$4"
            onPress={handleRegister}
            className="bg-blue-500 w-full"
          >
            {t("Create Account")}
          </Button>
        </View>

        {/* Login Link */}
        <View className="flex-row justify-center items-center mt-6 mb-8">
          <Text className="text-gray-600">{t("Already have an account?")}</Text>
          <Link href="/auth/login" asChild>
            <TouchableOpacity className="ml-2">
              <Text className="text-blue-500 font-medium">{t("Sign In")}</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

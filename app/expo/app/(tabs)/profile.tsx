import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  User,
  Users,
  Wallet,
  Target,
  Download,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
  Globe,
} from "lucide-react-native";
import { Card, LanguageSelector } from "@/components/ui";
import { useAppStore } from "@/hooks/useStore";
import { useLanguage } from "@/hooks/useLanguage";

export default function ProfilePage() {
  const { user, logout } = useAppStore();
  const { t } = useLanguage();

  const menuItems = [
    {
      title: t("My Family Spaces"),
      icon: Users,
      onPress: () => router.push("/family"),
      description: t("Manage family members and shared transactions"),
    },
    {
      title: t("My Budgets"),
      icon: Target,
      onPress: () => router.push("/budgets"),
      description: t("Set and manage personal budgets"),
    },
    {
      title: t("Payment Accounts"),
      icon: Wallet,
      onPress: () => router.push("/accounts"),
      description: t("Manage bank cards and payment methods"),
    },
    {
      title: t("Export Data"),
      icon: Download,
      onPress: () => router.push("/export"),
      description: t("Export transaction data"),
    },
    {
      title: t("Notification Settings"),
      icon: Bell,
      onPress: () => router.push("/notifications"),
      description: t("Manage push notifications"),
    },
    {
      title: t("Help & Feedback"),
      icon: HelpCircle,
      onPress: () => router.push("/help"),
      description: t("Get help and submit feedback"),
    },
  ];

  const handleLogout = () => {
    logout();
    router.replace("/auth/login");
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* 用户信息卡片 */}
        <Card className="mx-4 mt-4">
          <View className="flex-row items-center">
            <View className="w-16 h-16 bg-primary-500 rounded-full items-center justify-center mr-4">
              <User size={32} color="#ffffff" />
            </View>
            <View className="flex-1">
              <Text className="text-xl font-semibold text-gray-900 mb-1">
                {user?.nickname || t("User")}
              </Text>
              <Text className="text-gray-500">
                {user?.email || "user@example.com"}
              </Text>
              <Text className="text-sm text-gray-400 mt-1">
                ID: {user?.id || "USER001"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/profile/edit")}
              className="p-2"
            >
              <ChevronRight size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </Card>

        {/* 语言设置卡片 */}
        <Card className="mx-4 mt-4">
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3">
              <Globe size={20} color="#6b7280" />
            </View>
            <Text className="font-medium text-gray-900 flex-1">
              Language / 语言
            </Text>
          </View>
          <LanguageSelector />
        </Card>

        {/* 菜单列表 */}
        <View className="mt-6">
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={item.onPress}
              className="bg-white border-b border-gray-100 px-4 py-4"
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3">
                  <item.icon size={20} color="#6b7280" />
                </View>
                <View className="flex-1">
                  <Text className="font-medium text-gray-900 mb-1">
                    {item.title}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    {item.description}
                  </Text>
                </View>
                <ChevronRight size={20} color="#6b7280" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* 退出登录 */}
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-white mx-4 mt-6 mb-6 rounded-lg px-4 py-4"
        >
          <View className="flex-row items-center justify-center">
            <LogOut size={20} color="#ef4444" />
            <Text className="text-red-500 font-medium ml-2">{t("Logout")}</Text>
          </View>
        </TouchableOpacity>

        {/* 版本信息 */}
        <View className="items-center pb-6">
          <Text className="text-gray-400 text-sm">Momi v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

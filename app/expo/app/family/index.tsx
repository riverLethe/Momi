import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import { Button, Input, Dialog } from "tamagui";
import {
  ArrowLeft,
  Plus,
  Users,
  UserPlus,
  LogOut,
  Settings,
  Copy,
} from "lucide-react-native";
import { useLanguage } from "@/hooks/useLanguage";
import { useFamilyStore, useAppStore } from "@/hooks/useStore";
import * as Clipboard from "expo-clipboard";

export default function FamilySpacePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { familySpaces, setFamilySpaces } = useFamilyStore();
  const { currentFamilySpace, setCurrentFamilySpace, setCurrentView } =
    useAppStore();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const handleCreateFamily = async () => {
    if (!familyName.trim()) {
      Alert.alert(t("Error"), t("Please enter a family name"));
      return;
    }

    // TODO: 调用 API 创建家庭空间
    const newFamily = {
      id: Date.now().toString(),
      name: familyName,
      creatorId: "current-user-id",
      memberCount: 1,
      createdAt: new Date().toISOString(),
    };

    setFamilySpaces([...familySpaces, newFamily]);
    setShowCreateDialog(false);
    setFamilyName("");

    // 自动切换到新创建的家庭空间
    setCurrentFamilySpace(newFamily);
    setCurrentView("family");

    Alert.alert(t("Success"), t("Family space created successfully"));
  };

  const handleJoinFamily = async () => {
    if (!inviteCode.trim()) {
      Alert.alert(t("Error"), t("Please enter an invite code"));
      return;
    }

    // TODO: 调用 API 加入家庭空间
    Alert.alert(t("Success"), t("Joined family space successfully"));
    setShowJoinDialog(false);
    setInviteCode("");
  };

  const handleSelectFamily = (family: any) => {
    setCurrentFamilySpace(family);
    setCurrentView("family");
    router.back();
  };

  const handleGenerateInviteCode = async (familyId: string) => {
    // TODO: 调用 API 生成邀请码
    const mockInviteCode = `FAM${familyId.substring(0, 6).toUpperCase()}`;
    await Clipboard.setStringAsync(mockInviteCode);
    Alert.alert(t("Success"), t("Invite code copied to clipboard"));
  };

  const handleLeaveFamily = (familyId: string) => {
    Alert.alert(
      t("Leave Family Space"),
      t("Are you sure you want to leave this family space?"),
      [
        { text: t("Cancel"), style: "cancel" },
        {
          text: t("Leave"),
          style: "destructive",
          onPress: () => {
            // TODO: 调用 API 离开家庭空间
            setFamilySpaces(familySpaces.filter((f) => f.id !== familyId));
            if (currentFamilySpace?.id === familyId) {
              setCurrentFamilySpace(null);
              setCurrentView("personal");
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: t("Family Spaces"),
          headerTitleAlign: "center",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="p-2">
              <ArrowLeft size={24} color="#000" />
            </TouchableOpacity>
          ),
        }}
      />

      <SafeAreaView className="flex-1 bg-gray-50">
        <ScrollView className="flex-1 px-4">
          {/* 当前激活的家庭空间 */}
          {currentFamilySpace && (
            <View className="mt-4 mb-6">
              <Text className="text-sm text-gray-600 mb-2">
                {t("Active Family Space")}
              </Text>
              <View className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 bg-blue-500 rounded-full items-center justify-center mr-3">
                      <Users size={24} color="#fff" />
                    </View>
                    <View>
                      <Text className="text-lg font-semibold text-gray-900">
                        {currentFamilySpace.name}
                      </Text>
                      <Text className="text-sm text-gray-600">
                        {t("{{count}} members", {
                          count: currentFamilySpace.memberCount || 1,
                        })}
                      </Text>
                    </View>
                  </View>
                  <View className="w-3 h-3 bg-green-500 rounded-full" />
                </View>
              </View>
            </View>
          )}

          {/* 家庭空间列表 */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              {t("My Family Spaces")}
            </Text>

            {familySpaces.length === 0 ? (
              <View className="bg-white rounded-lg p-8 items-center">
                <Users size={48} color="#9CA3AF" />
                <Text className="text-gray-600 mt-4 text-center">
                  {t("You haven't joined any family spaces yet")}
                </Text>
              </View>
            ) : (
              familySpaces.map((family) => (
                <TouchableOpacity
                  key={family.id}
                  onPress={() => handleSelectFamily(family)}
                  className="bg-white rounded-lg p-4 mb-3 border border-gray-200"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center mr-3">
                        <Users size={24} color="#6B7280" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-medium text-gray-900">
                          {family.name}
                        </Text>
                        <Text className="text-sm text-gray-600">
                          {t("{{count}} members", {
                            count: family.memberCount || 1,
                          })}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center">
                      {family.creatorId === "current-user-id" && (
                        <TouchableOpacity
                          onPress={() => handleGenerateInviteCode(family.id)}
                          className="p-2 mr-2"
                        >
                          <UserPlus size={20} color="#3B82F6" />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        onPress={() => handleLeaveFamily(family.id)}
                        className="p-2"
                      >
                        <LogOut size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* 操作按钮 */}
          <View className="mb-8">
            <Button
              size="$4"
              onPress={() => setShowCreateDialog(true)}
              icon={Plus}
              className="bg-blue-500 mb-3"
            >
              {t("Create Family Space")}
            </Button>

            <Button
              size="$4"
              onPress={() => setShowJoinDialog(true)}
              variant="outlined"
              icon={UserPlus}
            >
              {t("Join with Invite Code")}
            </Button>
          </View>
        </ScrollView>

        {/* 创建家庭空间对话框 */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <Dialog.Portal>
            <Dialog.Overlay />
            <Dialog.Content className="bg-white rounded-lg p-6 mx-4">
              <Dialog.Title className="text-lg font-semibold mb-4">
                {t("Create Family Space")}
              </Dialog.Title>

              <Input
                value={familyName}
                onChangeText={setFamilyName}
                placeholder={t("Enter family name")}
                className="mb-4"
              />

              <View className="flex-row justify-end space-x-3">
                <Button
                  variant="outlined"
                  onPress={() => setShowCreateDialog(false)}
                >
                  {t("Cancel")}
                </Button>
                <Button onPress={handleCreateFamily} className="bg-blue-500">
                  {t("Create")}
                </Button>
              </View>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog>

        {/* 加入家庭空间对话框 */}
        <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
          <Dialog.Portal>
            <Dialog.Overlay />
            <Dialog.Content className="bg-white rounded-lg p-6 mx-4">
              <Dialog.Title className="text-lg font-semibold mb-4">
                {t("Join Family Space")}
              </Dialog.Title>

              <Input
                value={inviteCode}
                onChangeText={setInviteCode}
                placeholder={t("Enter invite code")}
                className="mb-4"
                autoCapitalize="characters"
              />

              <View className="flex-row justify-end space-x-3">
                <Button
                  variant="outlined"
                  onPress={() => setShowJoinDialog(false)}
                >
                  {t("Cancel")}
                </Button>
                <Button onPress={handleJoinFamily} className="bg-blue-500">
                  {t("Join")}
                </Button>
              </View>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog>
      </SafeAreaView>
    </>
  );
}

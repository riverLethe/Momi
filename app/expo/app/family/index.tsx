import React, { useState, useEffect } from "react";
import {
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Plus,
  Users,
  Copy,
  ChevronRight,
  Trash,
} from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import {
  View,
  Text,
  Button,
  XStack,
  YStack,
  Input,
  Card,
  H3,
  H4,
  Paragraph,
  Circle,
  Separator,
} from "tamagui";

import { useAuth } from "@/providers/AuthProvider";
import { useViewStore } from "@/stores/viewStore";
import { FamilySpace } from "@/types/family.types";
import {
  getFamilySpaces,
  createFamilySpace,
  joinFamilySpace,
  deleteFamilySpace,
  getUserFamilySpaces
} from "@/utils/family.utils";

export default function FamilySpacesScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { currentFamilySpace, setCurrentFamilySpace } = useViewStore();

  const [familySpaces, setFamilySpaces] = useState<FamilySpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // 重定向，如果未登录
  useEffect(() => {
    if (!isAuthenticated) {
      Alert.alert(
        "需要登录",
        "你需要登录后才能管理家庭空间。",
        [
          { text: "取消", onPress: () => router.back() },
          { text: "登录", onPress: () => router.push("/auth/login") },
        ]
      );
    } else {
      loadFamilySpaces();
    }
  }, [isAuthenticated]);

  // 加载家庭空间
  const loadFamilySpaces = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userSpaces = await getUserFamilySpaces(user.id);
      setFamilySpaces(userSpaces);
    } catch (error) {
      console.error("Failed to load family spaces:", error);
      Alert.alert("错误", "加载家庭空间失败");
    } finally {
      setLoading(false);
    }
  };

  // 创建家庭空间
  const handleCreateFamily = async () => {
    if (!user) return;

    if (!newFamilyName.trim()) {
      Alert.alert("错误", "请输入家庭名称");
      return;
    }

    try {
      setIsProcessing(true);
      const newFamilySpace = await createFamilySpace(newFamilyName.trim(), user);

      setFamilySpaces([...familySpaces, newFamilySpace]);
      setNewFamilyName("");
      setShowCreateForm(false);

      // 设置为当前家庭空间
      setCurrentFamilySpace(newFamilySpace);

      Alert.alert("成功", `家庭空间"${newFamilySpace.name}"已创建！`);
    } catch (error) {
      console.error("Failed to create family space:", error);
      Alert.alert("错误", "创建家庭空间失败");
    } finally {
      setIsProcessing(false);
    }
  };

  // 加入家庭空间
  const handleJoinFamily = async () => {
    if (!user) return;

    if (!inviteCode.trim()) {
      Alert.alert("错误", "请输入邀请码");
      return;
    }

    try {
      setIsProcessing(true);
      const joinedSpace = await joinFamilySpace(inviteCode.trim(), user);

      if (!joinedSpace) {
        Alert.alert("错误", "无效的邀请码");
        return;
      }

      // 检查空间是否已经在列表中
      if (!familySpaces.some(space => space.id === joinedSpace.id)) {
        setFamilySpaces([...familySpaces, joinedSpace]);
      }

      setInviteCode("");
      setShowJoinForm(false);

      Alert.alert("成功", `你已加入家庭空间"${joinedSpace.name}"！`);
    } catch (error) {
      console.error("Failed to join family space:", error);
      Alert.alert("错误", "加入家庭空间失败");
    } finally {
      setIsProcessing(false);
    }
  };

  // 复制邀请码
  const copyInviteCode = async (code: string) => {
    await Clipboard.setStringAsync(code);
    Alert.alert("已复制", "邀请码已复制到剪贴板");
  };

  // 选择家庭空间
  const handleSelectFamily = (familySpace: FamilySpace) => {
    setCurrentFamilySpace(familySpace);
    router.back();
  };

  // 删除家庭空间
  const handleDeleteFamily = async (familySpace: FamilySpace) => {
    if (!user) return;

    Alert.alert(
      "确认删除",
      `确定要删除"${familySpace.name}"吗？此操作无法撤销。`,
      [
        { text: "取消", style: "cancel" },
        {
          text: "删除",
          style: "destructive",
          onPress: async () => {
            try {
              setIsProcessing(true);
              const success = await deleteFamilySpace(familySpace.id);

              if (success) {
                setFamilySpaces(familySpaces.filter(f => f.id !== familySpace.id));

                if (familySpace.id === currentFamilySpace?.id) {
                  setCurrentFamilySpace(null);
                }

                Alert.alert("成功", "家庭空间已删除");
              } else {
                Alert.alert("错误", "删除家庭空间失败");
              }
            } catch (error) {
              console.error("Failed to delete family space:", error);
              Alert.alert("错误", "删除家庭空间失败");
            } finally {
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };

  if (!isAuthenticated) {
    return null; // 如果未登录则不渲染
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <XStack
        alignItems="center"
        padding="$4"
        borderBottomWidth={1}
        borderBottomColor="$gray4"
      >
        <Button
          chromeless
          onPress={() => router.back()}
          marginRight="$4"
        >
          <ArrowLeft size={24} color="#1F2937" />
        </Button>
        <H3>家庭空间</H3>
      </XStack>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {/* 创建/加入按钮 */}
        <XStack marginBottom="$6">
          <Button
            flex={1}
            marginRight="$2"
            backgroundColor="$blue9"
            borderRadius="$4"
            alignItems="center"
            onPress={() => {
              setShowCreateForm(true);
              setShowJoinForm(false);
            }}
            disabled={isProcessing}
          >
            <Plus size={24} color="#FFFFFF" />
            <Text color="white" fontWeight="$6" marginTop="$1">创建</Text>
          </Button>

          <Button
            flex={1}
            marginLeft="$2"
            backgroundColor="$purple9"
            borderRadius="$4"
            alignItems="center"
            onPress={() => {
              setShowJoinForm(true);
              setShowCreateForm(false);
            }}
            disabled={isProcessing}
          >
            <Users size={24} color="#FFFFFF" />
            <Text color="white" fontWeight="$6" marginTop="$1">加入</Text>
          </Button>
        </XStack>

        {/* 创建表单 */}
        {showCreateForm && (
          <Card padding="$4" marginBottom="$6" elevate>
            <Text fontWeight="$7" marginBottom="$3">创建家庭空间</Text>
            <Input
              backgroundColor="$gray3"
              padding="$3"
              borderRadius="$4"
              marginBottom="$3"
              placeholder="输入家庭名称"
              value={newFamilyName}
              onChangeText={setNewFamilyName}
              disabled={isProcessing}
            />
            <Button
              backgroundColor="$blue9"
              borderRadius="$4"
              onPress={handleCreateFamily}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text color="white" textAlign="center" fontWeight="$6">
                  创建
                </Text>
              )}
            </Button>
          </Card>
        )}

        {/* 加入表单 */}
        {showJoinForm && (
          <Card padding="$4" marginBottom="$6" elevate>
            <Text fontWeight="$7" marginBottom="$3">加入家庭空间</Text>
            <Input
              backgroundColor="$gray3"
              padding="$3"
              borderRadius="$4"
              marginBottom="$3"
              placeholder="输入邀请码"
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
              disabled={isProcessing}
            />
            <Button
              backgroundColor="$purple9"
              borderRadius="$4"
              onPress={handleJoinFamily}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text color="white" textAlign="center" fontWeight="$6">加入</Text>
              )}
            </Button>
          </Card>
        )}

        {/* 家庭空间列表 */}
        <Text fontWeight="$7" fontSize="$5" marginBottom="$3">你的家庭空间</Text>

        {loading ? (
          <YStack alignItems="center" paddingVertical="$8">
            <ActivityIndicator size="small" color="#3B82F6" />
            <Text marginTop="$2" color="$gray10">加载家庭空间中...</Text>
          </YStack>
        ) : familySpaces.length === 0 ? (
          <Card padding="$6" alignItems="center">
            <Text color="$gray10" textAlign="center">
              你还没有加入任何家庭空间。
            </Text>
          </Card>
        ) : (
          familySpaces.map((family) => (
            <Card
              key={family.id}
              marginBottom="$3"
              overflow="hidden"
              elevate
            >
              <Button
                borderBottomWidth={1}
                borderBottomColor="$gray3"
                chromeless
                justifyContent="flex-start"
                onPress={() => handleSelectFamily(family)}
                disabled={isProcessing}
              >
                <XStack alignItems="center" justifyContent="space-between" width="100%">
                  <YStack>
                    <Text fontWeight="$7" fontSize="$5">{family.name}</Text>
                    <Text color="$gray10">
                      {family.members.length} 成员
                    </Text>
                  </YStack>
                  <ChevronRight size={20} color="#9CA3AF" />
                </XStack>
              </Button>

              <YStack padding="$4" backgroundColor="$gray2">
                <XStack justifyContent="space-between" alignItems="center" marginBottom="$2">
                  <Text color="$gray10">邀请码:</Text>
                  <XStack alignItems="center">
                    <Text fontWeight="$6" marginRight="$2">
                      {family.inviteCode}
                    </Text>
                    <Button
                      chromeless
                      onPress={() => copyInviteCode(family.inviteCode)}
                      disabled={isProcessing}
                    >
                      <Copy size={16} color="#3B82F6" />
                    </Button>
                  </XStack>
                </XStack>

                <XStack justifyContent="space-between" alignItems="center">
                  <Text color="$gray10">创建者:</Text>
                  <Text>{family.createdBy === user?.id ? `${family.creatorName} (你)` : family.creatorName}</Text>
                </XStack>
              </YStack>

              {family.createdBy === user?.id && (
                <Button
                  backgroundColor="$red2"
                  flexDirection="row"
                  alignItems="center"
                  justifyContent="center"
                  onPress={() => handleDeleteFamily(family)}
                  disabled={isProcessing}
                >
                  <Trash size={16} color="#EF4444" />
                  <Text color="#EF4444" marginLeft="$1">
                    解散家庭空间
                  </Text>
                </Button>
              )}
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

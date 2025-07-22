import React, { useState, useEffect } from "react";
import {
  Sheet,
  XStack,
  YStack,
  Text,
  Button,
  Separator,
  ScrollView,
  H4,
  Avatar,
} from "tamagui";
import { Alert, RefreshControl } from "react-native";
import { FamilyJoinRequest } from "@/types/family.types";
import { apiClient } from "@/utils/api";
import { getAuthToken } from "@/utils/userPreferences.utils";
import { Check, X, User } from "lucide-react-native";
import { useAuth } from "@/providers/AuthProvider";
import { useTranslation } from "react-i18next";

export const GlobalJoinRequestsListener: React.FC = () => {
  const { user, isAuthenticated, updateUser } = useAuth();
  const { t } = useTranslation();
  const [requests, setRequests] = useState<FamilyJoinRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [lastRequestCount, setLastRequestCount] = useState(0);

  // 获取所有家庭空间的待处理加入请求
  const fetchAllJoinRequests = async (showLoading = true) => {
    if (!isAuthenticated || !user?.family || user.family.createdBy !== user.id) {
      return;
    }

    try {
      if (showLoading) setLoading(true);
      const token = await getAuthToken();
      if (!token) return;

      const response = await apiClient.family.getPendingJoinRequests(token, user.family.id);
      if (response.success) {
        const newRequests = response.requests || [];
        setRequests(newRequests);

        // 如果有新的请求，自动打开 sheet
        if (newRequests.length > 0 && newRequests.length > lastRequestCount) {
          setSheetOpen(true);
        }
        setLastRequestCount(newRequests.length);
      }
    } catch (error) {
      console.error("Error fetching join requests:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // 处理加入请求
  const handleJoinRequest = async (requestId: string, action: 'approve' | 'reject') => {
    setProcessingRequestId(requestId);
    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await apiClient.family.handleJoinRequest(token, requestId, action);
      if (response.success) {
        Alert.alert(t("Success"), response.message);

        // 如果是批准请求，需要刷新用户的家庭信息
        if (action === 'approve') {
          try {
            // 重新获取用户信息，包含最新的家庭成员数据
            const updatedUserData = await apiClient.auth.getProfile(token);
            if (updatedUserData && updatedUserData.family) {
              // 更新 AuthProvider 中的用户信息
              updateUser(updatedUserData);
            }
          } catch (error) {
            console.error("Error refreshing user family data:", error);
          }
        }

        // 刷新请求列表
        await fetchAllJoinRequests(false);

        // 如果没有更多请求，关闭 sheet
        const remainingRequests = requests.filter(req => req.id !== requestId);
        if (remainingRequests.length === 0) {
          setSheetOpen(false);
        }
      } else {
        Alert.alert(t("Error"), response.error || t("Failed to process request"));
      }
    } catch (error) {
      console.error("Error handling join request:", error);
      Alert.alert(t("Error"), t("Failed to process request"));
    } finally {
      setProcessingRequestId(null);
    }
  };

  // 确认处理请求
  const confirmHandleRequest = (request: FamilyJoinRequest, action: 'approve' | 'reject') => {
    const actionText = action === 'approve' ? t("Approve") : t("Reject");
    const confirmText = action === 'approve'
      ? t("Are you sure you want to approve")
      : t("Are you sure you want to reject");

    Alert.alert(
      `${actionText} ${t("Join Request")}`,
      `${confirmText} ${request.username}${t("'s join request?")}`,
      [
        { text: t("Cancel"), style: "cancel" },
        {
          text: actionText,
          style: action === 'reject' ? 'destructive' : 'default',
          onPress: () => handleJoinRequest(request.id, action),
        },
      ]
    );
  };

  // 下拉刷新
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllJoinRequests(false);
    setRefreshing(false);
  };

  // 稍后处理
  const handleLater = () => {
    setSheetOpen(false);
  };

  useEffect(() => {
    if (isAuthenticated && user?.family && user.family.createdBy === user.id) {
      fetchAllJoinRequests();

      // 设置定期检查新请求（每30秒）
      const interval = setInterval(() => {
        fetchAllJoinRequests(false);
      }, 300000);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user?.family]);

  // 如果用户未登录或不是家庭创建者，不渲染任何内容
  if (!isAuthenticated || !user?.family || user.family.createdBy !== user.id) {
    return null;
  }

  return (
    <Sheet
      modal
      open={sheetOpen}
      onOpenChange={setSheetOpen}
      snapPoints={[45]}
      dismissOnSnapToBottom
    >
      <Sheet.Overlay />
      <Sheet.Handle />
      <Sheet.Frame padding="$4" paddingBottom="$0">
        <YStack flex={1} gap="$3">
          {/* 标题区域 */}
          <YStack  >
            <XStack alignItems="center" gap="$3" marginBottom="$2">
              <H4 color="$color" fontWeight="600">{t("New Join Requests")}</H4>
            </XStack>
            <Text fontSize="$3" color="$gray11">
              {requests.length} {t("users want to join your family space")}
            </Text>
          </YStack>

          <Separator borderColor="$borderColor" />

          {/* 内容区域 */}
          <YStack flex={1}>
            {loading ? (
              <YStack flex={1} justifyContent="center" alignItems="center">
                <Text color="$gray10" fontSize="$4">{t("Loading...")}</Text>
              </YStack>
            ) : (
              <ScrollView
                flex={1}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
              >
                <YStack borderRadius="$3" overflow="hidden">
                  {requests.map((request, index) => (
                    <React.Fragment key={request.id}>
                      <XStack backgroundColor="$card" alignItems="center" justifyContent="space-between" width="100%">
                        <XStack paddingHorizontal="$3" alignItems="center" gap="$3" flex={1}>


                          <YStack flex={1}>
                            <Text fontSize="$3" fontWeight="500" lineHeight={20} color="$color">
                              {request.username}
                            </Text>
                            {request.userEmail && (
                              <Text fontSize="$2" color="$color9" lineHeight={16}>
                                {request.userEmail}
                              </Text>
                            )}
                          </YStack>
                        </XStack>

                        {/* 操作按钮 */}
                        <XStack>
                          <Button
                            size="$3"
                            backgroundColor="$green9"
                            borderWidth={0}
                            pressStyle={{ backgroundColor: "$green10", scale: 0.95 }}
                            disabled={processingRequestId === request.id}
                            onPress={() => confirmHandleRequest(request, 'approve')}
                            opacity={processingRequestId === request.id ? 0.5 : 1}
                            width={50}
                            height={50}
                            borderRadius="$0"
                            margin="$0"
                          >
                            <Check size={16} color="white" />
                          </Button>

                          <Button
                            backgroundColor="$red9"
                            borderWidth={0}
                            pressStyle={{ backgroundColor: "$red10", scale: 0.95 }}
                            disabled={processingRequestId === request.id}
                            onPress={() => confirmHandleRequest(request, 'reject')}
                            opacity={processingRequestId === request.id ? 0.5 : 1}
                            width={50}
                            height={50}
                            borderRadius="$0"
                            margin="$0"
                            padding="$0"
                          >
                            <X size={16} color="white" />
                          </Button>
                        </XStack>
                      </XStack>
                      {index < requests.length - 1 && (
                        <Separator />
                      )}
                    </React.Fragment>
                  ))}
                </YStack>
              </ScrollView>
            )}
          </YStack>

          {/* 底部按钮 */}
          <YStack paddingHorizontal="$4" paddingBottom="$4" paddingTop="$3">
            <Separator borderColor="$borderColor" marginBottom="$3" />
            <Button
              size="$4"
              backgroundColor="$gray4"
              color="$gray11"
              borderWidth={0}
              borderRadius="$3"
              pressStyle={{ backgroundColor: "$gray5" }}
              onPress={handleLater}
            >
              {t("Handle Later")}
            </Button>
          </YStack>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
};

export default GlobalJoinRequestsListener;
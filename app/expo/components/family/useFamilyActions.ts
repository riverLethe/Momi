import { useState } from "react";
import { Alert } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useAuth } from "@/providers/AuthProvider";
import { useViewStore } from "@/stores/viewStore";
import { FamilyMember, FamilySpace } from "@/types/family.types";
import { getUserFamilySpaces } from "@/utils/family.utils";
import { apiClient } from "@/utils/api";
import { getAuthToken } from "@/utils/userPreferences.utils";
import { useTranslation } from "react-i18next";

export const useFamilyActions = () => {
  const { user } = useAuth();
  const { setCurrentFamilySpace } = useViewStore();
  const { t } = useTranslation();

  // 为不同操作创建独立的加载状态
  const [isLoadingFamilySpace, setIsLoadingFamilySpace] = useState(false);
  const [isCreatingFamily, setIsCreatingFamily] = useState(false);
  const [isJoiningFamily, setIsJoiningFamily] = useState(false);
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isRefreshingCode, setIsRefreshingCode] = useState(false);
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  const [isDissolvingFamily, setIsDissolvingFamily] = useState(false);
  const [isLeavingFamily, setIsLeavingFamily] = useState(false);

  // 保持向后兼容的通用 isProcessing 状态
  const isProcessing =
    isLoadingFamilySpace ||
    isCreatingFamily ||
    isJoiningFamily ||
    isUpdatingName ||
    isRefreshingCode ||
    isRemovingMember ||
    isDissolvingFamily ||
    isLeavingFamily;

  // Load family space
  const loadFamilySpace = async () => {
    if (!user) return null;

    try {
      setIsLoadingFamilySpace(true);
      const userSpaces = await getUserFamilySpaces(user.id);
      const currentFamily = userSpaces.length > 0 ? userSpaces[0] : null;
      if (currentFamily) {
        setCurrentFamilySpace(currentFamily);
      }
      return currentFamily;
    } catch (error) {
      console.error("Failed to load family space:", error);
      Alert.alert(t("Error"), t("Failed to load family space"));
      return null;
    } finally {
      setIsLoadingFamilySpace(false);
    }
  };

  // Create family space with default name
  const createFamilySpaceWithDefaultName = async () => {
    try {
      setIsCreatingFamily(true);
      const token = await getAuthToken();

      if (!token) {
        Alert.alert(t("Error"), t("Please login first"));
        return null;
      }

      const defaultFamilyName = `${user?.name || "User"}'s Family`;
      const response = await apiClient.family.createFamilySpace(token, {
        name: defaultFamilyName,
      });

      setCurrentFamilySpace(response.data);
      Alert.alert(t("Success"), t("Family feature enabled successfully"));
      return response.data;
    } catch (error) {
      console.error("Error enabling family feature:", error);
      Alert.alert(t("Error"), t("Failed to enable family feature"));
      return null;
    } finally {
      setIsCreatingFamily(false);
    }
  };

  // Join family with code - 两步确认流程
  const joinFamilyWithCode = async (joinCode: string) => {
    if (!joinCode.trim()) {
      Alert.alert(t("Error"), t("Please enter invite code"));
      return null;
    }

    if (joinCode.length !== 7) {
      Alert.alert(t("Error"), t("Invite code must be 7 characters"));
      return null;
    }

    setIsJoiningFamily(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        Alert.alert(t("Error"), t("Please login first"));
        return null;
      }

      // 第一步：查找家庭信息
      const lookupResponse = await apiClient.family.getFamilyByInviteCode(
        token,
        joinCode.toUpperCase()
      );

      if (!lookupResponse.success || !lookupResponse.data) {
        Alert.alert(t("Error"), t("Invalid invite code"));
        return null;
      }

      const familyInfo = lookupResponse.data;

      // 检查是否已经是成员
      if (familyInfo.isAlreadyMember) {
        Alert.alert(t("Info"), t("You are already a member of this family"));
        return null;
      }

      // 第二步：显示家庭信息确认对话框
      return new Promise<FamilySpace | null>((resolve) => {
        const memberCount = familyInfo.members?.length || 0;
        const creatorName =
          familyInfo.members?.find((m: FamilyMember) => m.isCreator)?.name ||
          "Unknown";

        Alert.alert(
          t("Join Family"),
          t("Family: {{name}}\nCreated by: {{creator}}\nMembers: {{count}}\n\nDo you want to send a join request to this family?", {
            name: familyInfo.name,
            creator: creatorName,
            count: memberCount
          }),
          [
            {
              text: t("Cancel"),
              style: "cancel",
              onPress: () => resolve(null),
            },
            {
              text: t("Send Request"),
              onPress: async () => {
                try {
                  // 发送加入请求
                  const joinResponse = await apiClient.family.requestJoinFamily(
                    token,
                    joinCode.toUpperCase()
                  );

                  Alert.alert(
                    t("Success"),
                    t("Join request sent! Waiting for approval from family creator.")
                  );
                  resolve(null); // 不设置当前家庭空间，因为还未被批准
                } catch (error) {
                    console.error("Error sending join request:", error);
                    Alert.alert(t("Error"), t("Failed to send join request"));
                    resolve(null);
                  }
              },
            },
          ]
        );
      });
    } catch (error) {
      console.error("Error looking up family:", error);
      Alert.alert(
        t("Error"),
        t("Failed to find family. Please check your invite code.")
      );
      return null;
    } finally {
      setIsJoiningFamily(false);
    }
  };

  // Update family name
  const updateFamilyName = async (
    familySpace: FamilySpace,
    newName: string
  ) => {
    if (!newName.trim()) return null;

    try {
      setIsUpdatingName(true);
      const token = await getAuthToken();
      if (!token) {
        Alert.alert(t("Error"), t("Please login first"));
        return null;
      }

      // 立即更新本地数据并显示成功
      const updatedSpace = { ...familySpace, name: newName.trim() };
      setCurrentFamilySpace(updatedSpace);
      Alert.alert(t("Success"), t("Family name updated"));

      // 后台发起请求
      (async () => {
        try {
          const response = await apiClient.family.updateFamilyName(
            token,
            familySpace.id,
            newName.trim()
          );

          if (!response.success) {
            console.error("Background family name update failed");
            // 如果后台请求失败，可以考虑回滚本地数据或者重试
            // 这里暂时只记录错误，不影响用户体验
          } else {
            console.info("Background family name update completed successfully");
          }
        } catch (error) {
          console.error("Background family name update error:", error);
          // 同样，后台错误不影响用户体验
        }
      })();

      return updatedSpace;
    } catch (error) {
      console.error("Error updating family name:", error);
      Alert.alert(t("Error"), t("Failed to update family name, please try again"));
      return null;
    } finally {
      setIsUpdatingName(false);
    }
  };

  // Copy invite code
  const copyInviteCode = async (familySpace: FamilySpace) => {
    try {
      await Clipboard.setStringAsync(familySpace.inviteCode);
      Alert.alert(t("Success"), t("Invite code copied to clipboard"));
    } catch (error) {
      console.error("Error copying invite code:", error);
      Alert.alert(t("Error"), t("Failed to copy invite code"));
    }
  };

  // Refresh invite code
  const refreshInviteCode = async (familySpace: FamilySpace) => {
    return new Promise<FamilySpace | null>((resolve) => {
      Alert.alert(
        t("Refresh Invite Code"),
        t("Are you sure you want to refresh the invite code? The old invite code will become invalid."),
        [
          { text: t("Cancel"), style: "cancel", onPress: () => resolve(null) },
          {
            text: t("Refresh"),
            onPress: async () => {
              try {
                setIsRefreshingCode(true);
                const token = await getAuthToken();
                if (!token) {
                  Alert.alert(t("Error"), t("Please login first"));
                  resolve(null);
                  return;
                }

                const response =
                  await apiClient.family.refreshInviteCode(token);

                if (response.inviteCode) {
                  const updatedSpace = {
                    ...familySpace,
                    inviteCode: response.inviteCode,
                  };
                  setCurrentFamilySpace(updatedSpace);
                  Alert.alert(t("Success"), t("Invite code refreshed"));
                  resolve(updatedSpace);
                } else {
                  Alert.alert(t("Error"), t("Failed to refresh invite code"));
                  resolve(null);
                }
              } catch (error) {
                console.error("Error refreshing invite code:", error);
                Alert.alert(t("Error"), t("Failed to refresh invite code"));
                resolve(null);
              } finally {
                setIsRefreshingCode(false);
              }
            },
          },
        ]
      );
    });
  };

  // Remove member
  const removeMember = async (familySpace: FamilySpace, memberId: string) => {
    const memberToRemove = familySpace.members.find((m) => m.id === memberId);
    if (!memberToRemove) return null;

    return new Promise<FamilySpace | null>((resolve) => {
      Alert.alert(
        t("Remove Member"),
        t("Are you sure you want to remove {{name}} from the family?", { name: memberToRemove.name }),
        [
          { text: t("Cancel"), style: "cancel", onPress: () => resolve(null) },
          {
            text: t("Remove"),
            style: "destructive",
            onPress: async () => {
              try {
                setIsRemovingMember(true);
                const token = await getAuthToken();
                if (!token) {
                  Alert.alert(t("Error"), t("Please login first"));
                  resolve(null);
                  return;
                }

                // 立即更新本地数据并显示成功
                const updatedMembers = familySpace.members.filter(
                  (m) => m.id !== memberId
                );
                const updatedSpace = {
                  ...familySpace,
                  members: updatedMembers,
                };
                Alert.alert(t("Success"), t("Member removed successfully"));
                resolve(updatedSpace);

                // 后台发起请求
                (async () => {
                  try {
                    const response = await apiClient.family.removeMember(
                      token,
                      familySpace.id,
                      memberId
                    );

                    if (!response.success) {
                      console.error("Background remove member failed");
                      // 如果后台请求失败，可以考虑重试或者记录错误
                      // 这里暂时只记录错误，不影响用户体验
                    } else {
                      console.info("Background remove member completed successfully");
                    }
                  } catch (error) {
                    console.error("Background remove member error:", error);
                    // 同样，后台错误不影响用户体验
                  }
                })();
              } catch (error) {
                console.error("Failed to remove member:", error);
                Alert.alert(t("Error"), t("Failed to remove member"));
                resolve(null);
              } finally {
                setIsRemovingMember(false);
              }
            },
          },
        ]
      );
    });
  };

  // Dissolve family
  const dissolveFamily = async (familySpace: FamilySpace) => {
    return new Promise<boolean>((resolve) => {
      Alert.alert(
        t("Dissolve Family"),
        t("Are you sure you want to dissolve \"{{name}}\"? This action cannot be undone and all members will be removed.", { name: familySpace.name }),
        [
          { text: t("Cancel"), style: "cancel", onPress: () => resolve(false) },
          {
            text: t("Dissolve"),
            style: "destructive",
            onPress: async () => {
              try {
                setIsDissolvingFamily(true);
                const token = await getAuthToken();
                if (!token) {
                  Alert.alert(t("Error"), t("Please login first"));
                  resolve(false);
                  return;
                }

                // 立即更新本地数据并显示成功
                setCurrentFamilySpace(null);
                Alert.alert(t("Success"), t("Family dissolved successfully"));
                resolve(true);

                // 后台发起请求
                (async () => {
                  try {
                    const response = await apiClient.family.deleteFamilySpace(
                      token,
                      familySpace.id
                    );

                    if (!response.success) {
                      console.error("Background family dissolution failed");
                      // 如果后台请求失败，可以考虑重试或者记录错误
                      // 这里暂时只记录错误，不影响用户体验
                    } else {
                      console.info("Background family dissolution completed successfully");
                    }
                  } catch (error) {
                    console.error("Background family dissolution error:", error);
                    // 同样，后台错误不影响用户体验
                  }
                })();
              } catch (error) {
                console.error("Error dissolving family:", error);
                Alert.alert(t("Error"), t("Failed to dissolve family"));
                resolve(false);
              } finally {
                setIsDissolvingFamily(false);
              }
            },
          },
        ]
      );
    });
  };

  // Leave family
  const leaveFamily = async (familySpace: FamilySpace) => {
    return new Promise<boolean>((resolve) => {
      Alert.alert(
        t("Leave Family"),
        t("Are you sure you want to leave \"{{name}}\"?", { name: familySpace.name }),
        [
          { text: t("Cancel"), style: "cancel", onPress: () => resolve(false) },
          {
            text: t("Leave"),
            style: "destructive",
            onPress: async () => {
              try {
                setIsLeavingFamily(true);
                const token = await getAuthToken();
                if (!token) {
                  Alert.alert(t("Error"), t("Please login first"));
                  resolve(false);
                  return;
                }

                // 立即更新本地数据并显示成功
                setCurrentFamilySpace(null);
                Alert.alert(t("Success"), t("Left family successfully"));
                resolve(true);

                // 后台发起请求
                (async () => {
                  try {
                    const response = await apiClient.family.leaveFamilySpace(
                      token,
                      familySpace.id
                    );

                    if (!response.success) {
                      console.error("Background leave family failed");
                      // 如果后台请求失败，可以考虑重试或者记录错误
                      // 这里暂时只记录错误，不影响用户体验
                    } else {
                      console.info("Background leave family completed successfully");
                    }
                  } catch (error) {
                    console.error("Background leave family error:", error);
                    // 同样，后台错误不影响用户体验
                  }
                })();
              } catch (error) {
                console.error("Error leaving family:", error);
                Alert.alert(t("Error"), t("Failed to leave family"));
                resolve(false);
              } finally {
                setIsLeavingFamily(false);
              }
            },
          },
        ]
      );
    });
  };

  return {
    // 向后兼容的通用状态
    isProcessing,

    // 独立的加载状态
    isLoadingFamilySpace,
    isCreatingFamily,
    isJoiningFamily,
    isUpdatingName,
    isRefreshingCode,
    isRemovingMember,
    isDissolvingFamily,
    isLeavingFamily,

    // 函数
    loadFamilySpace,
    createFamilySpaceWithDefaultName,
    joinFamilyWithCode,
    updateFamilyName,
    copyInviteCode,
    refreshInviteCode,
    removeMember,
    dissolveFamily,
    leaveFamily,
  };
};

import { useState } from "react";
import { Alert } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useAuth } from "@/providers/AuthProvider";
import { useViewStore } from "@/stores/viewStore";
import { FamilySpace } from "@/types/family.types";
import { getUserFamilySpaces } from "@/utils/family.utils";
import { apiClient } from "@/utils/api";
import { getAuthToken } from "@/utils/userPreferences.utils";

export const useFamilyActions = () => {
  const { user } = useAuth();
  const { setCurrentFamilySpace } = useViewStore();
  
  const [isProcessing, setIsProcessing] = useState(false);

  // Load family space
  const loadFamilySpace = async () => {
    if (!user) return null;

    try {
      const userSpaces = await getUserFamilySpaces(user.id);
      const currentFamily = userSpaces.length > 0 ? userSpaces[0] : null;
      if (currentFamily) {
        setCurrentFamilySpace(currentFamily);
      }
      return currentFamily;
    } catch (error) {
      console.error("Failed to load family space:", error);
      Alert.alert("Error", "Failed to load family space");
      return null;
    }
  };

  // Create family space with default name
  const createFamilySpaceWithDefaultName = async () => {
    try {
      setIsProcessing(true);
      const token = await getAuthToken();

      if (!token) {
        Alert.alert("Error", "Please login first");
        return null;
      }

      const defaultFamilyName = `${user?.name || 'User'}'s Family`;
      const response = await apiClient.family.createFamilySpace(token, {
        name: defaultFamilyName
      });

      setCurrentFamilySpace(response.data);
      Alert.alert("Success", "Family feature enabled successfully");
      return response.data;
    } catch (error) {
      console.error('Error enabling family feature:', error);
      Alert.alert("Error", "Failed to enable family feature");
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  // Join family with code
  const joinFamilyWithCode = async (joinCode: string) => {
    if (!joinCode.trim()) {
      Alert.alert("Error", "Please enter invite code");
      return null;
    }

    if (joinCode.length !== 6) {
      Alert.alert("Error", "Invite code must be 6 characters");
      return null;
    }

    setIsProcessing(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        Alert.alert("Error", "Please login first");
        return null;
      }

      const response = await apiClient.family.joinFamilySpace(token, joinCode.toUpperCase());
      setCurrentFamilySpace(response.data);
      Alert.alert("Success", "Successfully joined family");
      return response.data;
    } catch (error) {
      console.error("Error joining family:", error);
      Alert.alert("Error", "Failed to join family. Please check your invite code.");
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  // Update family name
  const updateFamilyName = async (familySpace: FamilySpace, newName: string) => {
    if (!newName.trim()) return null;

    try {
      setIsProcessing(true);
      const token = await getAuthToken();
      if (!token) {
        Alert.alert("Error", "Please login first");
        return null;
      }

      const response = await apiClient.family.updateFamilyName(token, familySpace.id, newName.trim());

      if (response.success) {
        const updatedSpace = { ...familySpace, name: newName.trim() };
        setCurrentFamilySpace(updatedSpace);
        Alert.alert("Success", "Family name updated");
        return updatedSpace;
      } else {
        Alert.alert("Error", "Failed to update family name");
        return null;
      }
    } catch (error) {
      console.error('Error updating family name:', error);
      Alert.alert("Error", "Failed to update family name, please try again");
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  // Copy invite code
  const copyInviteCode = async (familySpace: FamilySpace) => {
    try {
      await Clipboard.setStringAsync(familySpace.inviteCode);
      Alert.alert("Success", "Invite code copied to clipboard");
    } catch (error) {
      console.error("Error copying invite code:", error);
      Alert.alert("Error", "Failed to copy invite code");
    }
  };

  // Refresh invite code
  const refreshInviteCode = async (familySpace: FamilySpace) => {
    return new Promise<FamilySpace | null>((resolve) => {
      Alert.alert(
        "Refresh Invite Code",
        "Are you sure you want to refresh the invite code? The old invite code will become invalid.",
        [
          { text: "Cancel", style: "cancel", onPress: () => resolve(null) },
          {
            text: "Refresh",
            onPress: async () => {
              try {
                setIsProcessing(true);
                const token = await getAuthToken();
                if (!token) {
                  Alert.alert("Error", "Please login first");
                  resolve(null);
                  return;
                }

                const response = await apiClient.family.refreshInviteCode(token);

                if (response.inviteCode) {
                  const updatedSpace = { ...familySpace, inviteCode: response.inviteCode };
                  setCurrentFamilySpace(updatedSpace);
                  Alert.alert("Success", "Invite code refreshed");
                  resolve(updatedSpace);
                } else {
                  Alert.alert("Error", "Failed to refresh invite code");
                  resolve(null);
                }
              } catch (error) {
                console.error("Error refreshing invite code:", error);
                Alert.alert("Error", "Failed to refresh invite code");
                resolve(null);
              } finally {
                setIsProcessing(false);
              }
            }
          }
        ]
      );
    });
  };

  // Remove member
  const removeMember = async (familySpace: FamilySpace, memberId: string) => {
    const memberToRemove = familySpace.members.find(m => m.id === memberId);
    if (!memberToRemove) return null;

    return new Promise<FamilySpace | null>((resolve) => {
      Alert.alert(
        "Remove Member",
        `Are you sure you want to remove ${memberToRemove.name} from the family?`,
        [
          { text: "Cancel", style: "cancel", onPress: () => resolve(null) },
          {
            text: "Remove",
            style: "destructive",
            onPress: async () => {
              try {
                setIsProcessing(true);
                const token = await getAuthToken();
                if (!token) {
                  Alert.alert("Error", "Please login first");
                  resolve(null);
                  return;
                }

                const response = await apiClient.family.removeMember(token, familySpace.id, memberId);

                if (response.success) {
                  const updatedMembers = familySpace.members.filter(m => m.id !== memberId);
                  const updatedSpace = { ...familySpace, members: updatedMembers };
                  Alert.alert("Success", "Member removed successfully");
                  resolve(updatedSpace);
                } else {
                  Alert.alert("Error", "Failed to remove member");
                  resolve(null);
                }
              } catch (error) {
                console.error("Failed to remove member:", error);
                Alert.alert("Error", "Failed to remove member");
                resolve(null);
              } finally {
                setIsProcessing(false);
              }
            }
          }
        ]
      );
    });
  };

  // Dissolve family
  const dissolveFamily = async (familySpace: FamilySpace) => {
    return new Promise<boolean>((resolve) => {
      Alert.alert(
        "Dissolve Family",
        `Are you sure you want to dissolve "${familySpace.name}"? This action cannot be undone and all members will be removed.`,
        [
          { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
          {
            text: "Dissolve",
            style: "destructive",
            onPress: async () => {
              try {
                setIsProcessing(true);
                const token = await getAuthToken();
                if (!token) {
                  Alert.alert("Error", "Please login first");
                  resolve(false);
                  return;
                }

                const response = await apiClient.family.deleteFamilySpace(token, familySpace.id);

                if (response.success) {
                  setCurrentFamilySpace(null);
                  Alert.alert("Success", "Family dissolved successfully");
                  resolve(true);
                } else {
                  Alert.alert("Error", "Failed to dissolve family");
                  resolve(false);
                }
              } catch (error) {
                console.error("Error dissolving family:", error);
                Alert.alert("Error", "Failed to dissolve family");
                resolve(false);
              } finally {
                setIsProcessing(false);
              }
            }
          }
        ]
      );
    });
  };

  // Leave family
  const leaveFamily = async (familySpace: FamilySpace) => {
    return new Promise<boolean>((resolve) => {
      Alert.alert(
        "Leave Family",
        `Are you sure you want to leave "${familySpace.name}"?`,
        [
          { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
          {
            text: "Leave",
            style: "destructive",
            onPress: async () => {
              try {
                setIsProcessing(true);
                const token = await getAuthToken();
                if (!token) {
                  Alert.alert("Error", "Please login first");
                  resolve(false);
                  return;
                }

                const response = await apiClient.family.leaveFamilySpace(token, familySpace.id);

                if (response.success) {
                  setCurrentFamilySpace(null);
                  Alert.alert("Success", "Left family successfully");
                  resolve(true);
                } else {
                  Alert.alert("Error", "Failed to leave family");
                  resolve(false);
                }
              } catch (error) {
                console.error("Error leaving family:", error);
                Alert.alert("Error", "Failed to leave family");
                resolve(false);
              } finally {
                setIsProcessing(false);
              }
            }
          }
        ]
      );
    });
  };

  return {
    isProcessing,
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
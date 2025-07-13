import React, { useState, useEffect } from "react";
import {
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeftIcon,
  Copy,
  Trash,
  UserPlus,
  LogOut,
  Settings,
  Edit3,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
} from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import {
  Text,
  Button,
  XStack,
  YStack,
  Card,
  H2,
  useTheme,
  Input,
} from "tamagui";
import AddFamilyMemberSheet from "@/components/family/AddFamilyMemberSheet";

import { useAuth } from "@/providers/AuthProvider";
import { useViewStore } from "@/stores/viewStore";
import { FamilySpace } from "@/types/family.types";
import {
  getFamilySpaces,
  createFamilySpace,
  joinFamilySpace,
  deleteFamilySpace,
  getUserFamilySpaces,
  leaveFamilySpace
} from "@/utils/family.utils";
import { apiClient } from "@/utils/api";
import { getAuthToken } from "@/utils/userPreferences.utils";

export default function FamilySpacesScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { currentFamilySpace, setCurrentFamilySpace } = useViewStore();
  const theme = useTheme();

  const [familySpace, setFamilySpace] = useState<FamilySpace | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [addMemberSheetOpen, setAddMemberSheetOpen] = useState(false);
  const [familyFeatureEnabled, setFamilyFeatureEnabled] = useState(false);
  const [joinCode, setJoinCode] = useState("");



  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      Alert.alert(
        "Login Required",
        "You need to log in to manage family spaces.",
        [
          { text: "Cancel", onPress: () => router.back() },
          { text: "Login", onPress: () => router.push("/auth/login") },
        ]
      );
    } else {
      loadFamilySpace();
    }
  }, [isAuthenticated]);

  // Load family space
  const loadFamilySpace = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userSpaces = await getUserFamilySpaces(user.id);
      // 用户只有一个家庭，取第一个
      const currentFamily = userSpaces.length > 0 ? userSpaces[0] : null;
      setFamilySpace(currentFamily);
      setFamilyFeatureEnabled(!!currentFamily);
      if (currentFamily) {
        setCurrentFamilySpace(currentFamily);
      }
    } catch (error) {
      console.error("Failed to load family space:", error);
      Alert.alert("Error", "Failed to load family space");
    } finally {
      setLoading(false);
    }
  };

  // Handle add member
  const handleAddMember = () => {
    setAddMemberSheetOpen(true);
  };

  // Handle member addition success
  const handleMemberAdded = () => {
    loadFamilySpace(); // Reload family space to get latest member info
  };

  // Generate 6-digit invite code
  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Create family space
  const createFamilySpace = async () => {
    try {
      setIsProcessing(true);
      const inviteCode = generateInviteCode();
      const token = await getAuthToken();
      
      if (!token) {
        Alert.alert("Error", "Please login first");
        return;
      }

      const response = await apiClient.family.createFamilySpace(token, {
        name: `${user?.name || 'User'}'s Family`,
        inviteCode: inviteCode
      });

      setFamilySpace(response.data);
      setFamilyFeatureEnabled(true);
      Alert.alert("Success", "Family feature enabled");
    } catch (error) {
      console.error('Error creating family:', error);
      Alert.alert("Error", "Failed to enable family feature");
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle family feature
  const toggleFamilyFeature = async () => {
    if (!familyFeatureEnabled) {
      // Enable family feature - automatically create default family
      await createFamilySpace();
    } else {
      // Disable family feature
      setFamilyFeatureEnabled(false);
      setFamilySpace(null);
    }
  };

  const joinFamilyWithCode = async () => {
    if (!joinCode.trim()) {
      Alert.alert("Error", "Please enter invite code");
      return;
    }

    if (joinCode.length !== 6) {
      Alert.alert("Error", "Invite code must be 6 characters");
      return;
    }

    setIsProcessing(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        Alert.alert("Error", "Please login first");
        return;
      }

      const response = await apiClient.family.joinFamilySpace(token, joinCode.toUpperCase());
      setFamilySpace(response.data);
      setJoinCode("");
      Alert.alert("Success", "Successfully joined family");
    } catch (error) {
      console.error("Error joining family:", error);
      Alert.alert("Error", "Failed to join family, please check if invite code is correct");
    } finally {
      setIsProcessing(false);
    }
  };





  // Handle remove member
  const handleRemoveMember = async (memberId: string) => {
    if (!familySpace || !user) return;

    const memberToRemove = familySpace.members.find(m => m.id === memberId);
    if (!memberToRemove) return;

    Alert.alert(
      "Remove Member",
      `Are you sure you want to remove ${memberToRemove.name} from the family?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              setIsProcessing(true);
              const token = await getAuthToken();
              if (!token) {
                Alert.alert("Error", "Please login first");
                return;
              }

              const response = await fetch('/api/family/members', {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  familyId: familySpace.id,
                  memberId: memberId
                })
              });

              if (response.ok) {
                const updatedMembers = familySpace.members.filter(m => m.id !== memberId);
                setFamilySpace({ ...familySpace, members: updatedMembers });
                Alert.alert("Success", "Member removed from family");
              } else {
                Alert.alert("Error", "Failed to remove member");
              }
            } catch (error) {
              console.error("Failed to remove member:", error);
              Alert.alert("Error", "Failed to remove member");
            } finally {
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };

  // Copy invite code
  const copyInviteCode = async () => {
    if (familySpace?.inviteCode) {
      await Clipboard.setStringAsync(familySpace.inviteCode);
      Alert.alert("Copied", "Invite code copied to clipboard");
    }
  };

  // Refresh invite code
  const refreshInviteCode = async () => {
    if (!familySpace?.id || !user) return;

    setIsProcessing(true);
    try {
      const newInviteCode = generateInviteCode();
      const token = await getAuthToken();
      if (!token) {
        Alert.alert("Error", "Please login first");
        return;
      }

      const updatedSpace = await apiClient.family.refreshInviteCode(token, newInviteCode);
      setFamilySpace(updatedSpace);
      Alert.alert("Success", "Invite code updated");
    } catch (error) {
      console.error('Error refreshing invite code:', error);
      Alert.alert("Error", "Failed to update invite code");
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete family space
  const handleDeleteFamily = async () => {
    if (!user || !familySpace) return;

    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete "${familySpace.name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setIsProcessing(true);
              const success = await deleteFamilySpace(familySpace.id);

              if (success) {
                setFamilySpace(null);
                setCurrentFamilySpace(null);
                Alert.alert("Success", "Family space deleted");
              } else {
                Alert.alert("Error", "Failed to delete family space");
              }
            } catch (error) {
              console.error("Failed to delete family space:", error);
              Alert.alert("Error", "Failed to delete family space");
            } finally {
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };

  // Leave family space
  const handleLeaveFamily = async () => {
    if (!user || !familySpace) return;

    Alert.alert(
      "Confirm Leave",
      `Are you sure you want to leave "${familySpace.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            try {
              setIsProcessing(true);
              const success = await leaveFamilySpace(familySpace.id, user.id);

              if (success) {
                setFamilySpace(null);
                setCurrentFamilySpace(null);
                Alert.alert("Success", "Left family space");
              } else {
                Alert.alert("Error", "Failed to leave family space");
              }
            } catch (error) {
              console.error("Failed to leave family space:", error);
              Alert.alert("Error", "Failed to leave family space");
            } finally {
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };

  if (!isAuthenticated) {
    return null; // Don't render if not authenticated
  }

  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background?.get() }} edges={['top']}>
        <YStack flex={1} padding="$2" gap="$6" backgroundColor="$background">
          <XStack alignItems="center">
            <Button size="$3"
              circular borderRadius="$2"
              chromeless
              onPress={() => router.back()}
              icon={<ChevronLeftIcon size={20} color={theme.color?.get()} />}
              pressStyle={{
                backgroundColor: "transparent",
                opacity: 0.5,
                borderColor: "transparent",
              }}
            />
          </XStack>
          <YStack flex={1} paddingHorizontal="$4" paddingTop="$4">
            <YStack alignItems="center" gap="$2" marginTop="$4">
              <H2 color="$color">Family Management</H2>
              <Text color="$color10" textAlign="center">
                Manage your family and members
              </Text>
            </YStack>

            <YStack gap="$5" marginTop="$6">
              {/* Family Feature Toggle */}
              <Card padding="$4" backgroundColor="$card">
                <XStack justifyContent="space-between" alignItems="center">
                  <YStack flex={1}>
                    <Text fontWeight="$6" color="$color">Family Feature</Text>
                    <Text color="$color10" fontSize="$3">
                      {familyFeatureEnabled ? "Family feature is enabled" : "Enable family feature to create or join a family"}
                    </Text>
                  </YStack>
                  <Button
                    chromeless
                    onPress={toggleFamilyFeature}
                    disabled={isProcessing}
                  >
                    {familyFeatureEnabled ? (
                      <ToggleRight size={24} color={theme.green9?.get()} />
                    ) : (
                      <ToggleLeft size={24} color={theme.gray9?.get()} />
                    )}
                  </Button>
                </XStack>
              </Card>

              {!familyFeatureEnabled ? (
                <YStack gap="$4">
                  <Card padding="$6" alignItems="center" backgroundColor="$card">
                    <Text color="$color10" textAlign="center" marginBottom="$4">
                      Enable family feature above to start managing your family.
                    </Text>
                  </Card>
                  
                  {/* Join Family Option when feature is disabled */}
                  <Card padding="$6" alignItems="center" backgroundColor="$card">
                    <Text fontSize="$4" fontWeight="600" color="$color" marginBottom="$4">
                       Join Existing Family
                     </Text>
                     <Text fontSize="$2" color="$gray10" textAlign="center" marginBottom="$4">
                       If you have a family invite code, you can join directly
                     </Text>
                    <XStack gap="$2" alignItems="center" width="100%">
                      <Input
                        flex={1}
                        placeholder="Enter invite code"
                        value={joinCode}
                        onChangeText={setJoinCode}
                        autoCapitalize="characters"
                        maxLength={6}
                      />
                      <Button
                        backgroundColor="$green9"
                        onPress={joinFamilyWithCode}
                        disabled={!joinCode.trim() || isProcessing}
                      >
                        <Text color="white">Join</Text>
                      </Button>
                    </XStack>
                  </Card>
                </YStack>
              ) : loading ? (
                <YStack alignItems="center" paddingVertical="$8">
                  <ActivityIndicator size="small" color={theme.blue9?.get()} />
                  <Text marginTop="$2" color="$color10">Loading family...</Text>
                </YStack>
              ) : !familySpace ? (
                <YStack gap="$4">
                  <Card padding="$6" alignItems="center" backgroundColor="$card">
                    <Text fontSize="$4" fontWeight="600" color="$color" marginBottom="$4">
                      Family Management
                    </Text>
                    
                    {/* Enable Family Feature */}
                    <YStack gap="$2" marginBottom="$4" alignItems="center">
                      <Text fontSize="$3" fontWeight="500" color="$color">Enable Family Feature</Text>
                      <Text fontSize="$2" color="$gray10" textAlign="center" marginBottom="$2">
                        This will automatically create your family space
                      </Text>
                      <Button
                        backgroundColor="$blue9"
                        onPress={createFamilySpace}
                        disabled={isProcessing}
                      >
                        <Text color="white">Enable Family Feature</Text>
                      </Button>
                    </YStack>
                    
                    {/* Join Family */}
                    <YStack gap="$2">
                      <Text fontSize="$3" fontWeight="500" color="$color">Or Join Existing Family</Text>
                      <XStack gap="$2" alignItems="center">
                        <Input
                          flex={1}
                          placeholder="Enter invite code"
                          value={joinCode}
                          onChangeText={setJoinCode}
                          autoCapitalize="characters"
                        />
                        <Button
                          backgroundColor="$green9"
                          onPress={joinFamilyWithCode}
                          disabled={!joinCode.trim() || isProcessing}
                        >
                          <Text color="white">Join</Text>
                        </Button>
                      </XStack>
                    </YStack>
                  </Card>
                </YStack>
              ) : familySpace && familySpace.members.length < 2 ? (
                <YStack gap="$4">
                  <Card padding="$6" alignItems="center" backgroundColor="$card">
                    <Text color="$color10" textAlign="center" marginBottom="$4">
                      Your family needs more members to be fully functional.
                    </Text>
                    <Text color="$color10" textAlign="center" fontSize="$3">
                      Share the invite code below to invite more members.
                    </Text>
                  </Card>

                  <Card padding="$4" backgroundColor="$card">
                    <XStack justifyContent="space-between" alignItems="center" marginBottom="$3">
                      <Text color="$color10">Invite Code:</Text>
                      <XStack alignItems="center" gap="$2">
                        <Text fontWeight="$6" color="$color">
                          {familySpace.inviteCode}
                        </Text>
                        <Button
                          chromeless
                          onPress={copyInviteCode}
                          disabled={isProcessing}
                        >
                          <Copy size={16} color={theme.blue9?.get()} />
                        </Button>
                        <Button
                          chromeless
                          onPress={refreshInviteCode}
                          disabled={isProcessing}
                        >
                          <RefreshCw size={16} color={theme.green9?.get()} />
                        </Button>
                      </XStack>
                    </XStack>

                    <Button
                      backgroundColor="$blue2"
                      flexDirection="row"
                      alignItems="center"
                      justifyContent="center"
                      onPress={handleAddMember}
                      disabled={isProcessing}
                    >
                      <UserPlus size={16} color={theme.blue9?.get()} />
                      <Text color={theme.blue9?.get()} marginLeft="$1">
                        Add Member
                      </Text>
                    </Button>
                  </Card>
                </YStack>
              ) : familySpace ? (
                <Card
                  marginBottom="$3"
                  overflow="hidden"
                  elevate
                  backgroundColor="$card"
                >
                  {/* Family Header */}
                  <YStack padding="$4" borderBottomWidth={1} borderBottomColor="$borderColor">
                    <XStack alignItems="center" justifyContent="space-between">
                      <XStack alignItems="center" gap="$3" flex={1}>
                        <YStack flex={1}>
                          <Text fontWeight="$7" fontSize="$6" color="$color">{familySpace.name}</Text>
                          <Text color="$color10">
                            {familySpace.members.length} members
                          </Text>
                        </YStack>
                      </XStack>
                    </XStack>
                  </YStack>

                  <YStack padding="$4" backgroundColor="$backgroundSoft">
                    <XStack justifyContent="space-between" alignItems="center" marginBottom="$2">
                      <Text color="$color10">Invite Code:</Text>
                      <XStack alignItems="center" gap="$2">
                        <Text fontWeight="$6" color="$color">
                          {familySpace.inviteCode}
                        </Text>
                        <Button
                          chromeless
                          onPress={copyInviteCode}
                          disabled={isProcessing}
                        >
                          <Copy size={16} color={theme.blue9?.get()} />
                        </Button>
                        <Button
                          chromeless
                          onPress={refreshInviteCode}
                          disabled={isProcessing}
                        >
                          <RefreshCw size={16} color={theme.green9?.get()} />
                        </Button>
                      </XStack>
                    </XStack>

                    <XStack justifyContent="space-between" alignItems="center" marginBottom="$2">
                      <Text color="$color10">Creator:</Text>
                      <Text color="$color">{familySpace.createdBy === user?.id ? `${familySpace.creatorName} (You)` : familySpace.creatorName}</Text>
                    </XStack>

                    <Text color="$color10" fontWeight="$6" marginTop="$3" marginBottom="$2">Family Members:</Text>
                    {familySpace.members.map((member) => (
                      <YStack key={member.id} paddingVertical="$2" paddingHorizontal="$2" marginBottom="$1" backgroundColor="$background" borderRadius="$2">
                        <XStack justifyContent="space-between" alignItems="center">
                          <Text color="$color" fontWeight={member.isCreator ? "$6" : "$4"}>
                            {member.name} {member.id === user?.id ? "(You)" : ""} {member.isCreator ? "(Creator)" : ""}
                          </Text>
                          {familySpace.createdBy === user?.id && member.id !== user?.id && (
                            <Button
                              size="$2"
                              backgroundColor="$red2"
                              onPress={() => handleRemoveMember(member.id)}
                              disabled={isProcessing}
                            >
                              <Text color={theme.red9?.get()} fontSize="$1">Remove</Text>
                            </Button>
                          )}
                        </XStack>
                      </YStack>
                    ))}
                  </YStack>

                  {/* Family Actions */}
                  <YStack padding="$4" gap="$3">
                    {familySpace.createdBy === user?.id ? (
                      <>
                        <Button
                          backgroundColor="$blue2"
                          flexDirection="row"
                          alignItems="center"
                          justifyContent="center"
                          onPress={handleAddMember}
                          disabled={isProcessing}
                        >
                          <UserPlus size={16} color={theme.blue9?.get()} />
                          <Text color={theme.blue9?.get()} marginLeft="$1">
                            Add Member
                          </Text>
                        </Button>

                        <Button
                          backgroundColor="$red2"
                          flexDirection="row"
                          alignItems="center"
                          justifyContent="center"
                          onPress={handleDeleteFamily}
                          disabled={isProcessing}
                        >
                          <Trash size={16} color={theme.red9?.get()} />
                          <Text color={theme.red9?.get()} marginLeft="$1">
                            Dissolve Family
                          </Text>
                        </Button>
                      </>
                    ) : (
                      <Button
                        backgroundColor="$orange2"
                        flexDirection="row"
                        alignItems="center"
                        justifyContent="center"
                        onPress={handleLeaveFamily}
                        disabled={isProcessing}
                      >
                        <LogOut size={16} color={theme.orange9?.get()} />
                        <Text color={theme.orange9?.get()} marginLeft="$1">
                          Leave Family
                        </Text>
                      </Button>
                    )}
                  </YStack>
                </Card>
              ) : null}
            </YStack>
          </YStack>

        </YStack>
      </SafeAreaView>

      {/* Sheet components */}
      <AddFamilyMemberSheet
        open={addMemberSheetOpen}
        onOpenChange={setAddMemberSheetOpen}
        family={familySpace}
        onMemberAdded={handleMemberAdded}
      />
    </>
  );
}

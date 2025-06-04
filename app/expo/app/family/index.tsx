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

// Mock family spaces data
const MOCK_FAMILY_SPACES: FamilySpace[] = [
  {
    id: "1",
    name: "My Family",
    createdBy: "user_1",
    creatorName: "John",
    members: [
      {
        id: "user_1",
        username: "John",
        isCreator: true,
        joinedAt: new Date("2023-01-01"),
      },
      {
        id: "user_2",
        username: "Jane",
        isCreator: false,
        joinedAt: new Date("2023-01-02"),
      },
    ],
    inviteCode: "FAM123",
    createdAt: new Date("2023-01-01"),
  },
];

export default function FamilySpacesScreen() {
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();
  const { currentFamilySpace, setCurrentFamilySpace } = useViewStore();

  const [familySpaces, setFamilySpaces] = useState<FamilySpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState("");

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      Alert.alert(
        "Login Required",
        "You need to login to manage family spaces.",
        [
          { text: "Cancel", onPress: () => router.back() },
          { text: "Login", onPress: () => router.push("/auth/login") },
        ]
      );
    } else {
      // Simulate loading family spaces
      setTimeout(() => {
        setFamilySpaces(MOCK_FAMILY_SPACES);
        setLoading(false);
      }, 1000);
    }
  }, [isLoggedIn]);

  const handleCreateFamily = () => {
    if (!newFamilyName.trim()) {
      Alert.alert("Error", "Please enter a family name");
      return;
    }

    // Mock creating a family space
    const newFamilySpace: FamilySpace = {
      id: `family_${Date.now()}`,
      name: newFamilyName.trim(),
      createdBy: user?.id || "",
      creatorName: user?.username || "",
      members: [
        {
          id: user?.id || "",
          username: user?.username || "",
          isCreator: true,
          joinedAt: new Date(),
        },
      ],
      inviteCode: `FAM${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date(),
    };

    setFamilySpaces([...familySpaces, newFamilySpace]);
    setNewFamilyName("");
    setShowCreateForm(false);

    // Set this as the current family space
    setCurrentFamilySpace(newFamilySpace);

    Alert.alert("Success", `Family space "${newFamilyName}" created!`);
  };

  const handleJoinFamily = () => {
    if (!inviteCode.trim()) {
      Alert.alert("Error", "Please enter an invite code");
      return;
    }

    // Mock joining a family space
    // In a real app, you would validate the code with your backend
    Alert.alert("Success", "You have joined the family space!");
    setInviteCode("");
    setShowJoinForm(false);
  };

  const copyInviteCode = async (code: string) => {
    await Clipboard.setStringAsync(code);
    Alert.alert("Copied", "Invite code copied to clipboard");
  };

  const handleSelectFamily = (familySpace: FamilySpace) => {
    setCurrentFamilySpace(familySpace);
    router.back();
  };

  if (!isLoggedIn) {
    return null; // Prevent rendering if not logged in
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
        <H3>Family Spaces</H3>
      </XStack>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {/* Create/Join Buttons */}
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
          >
            <Plus size={24} color="#FFFFFF" />
            <Text color="white" fontWeight="$6" marginTop="$1">Create</Text>
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
          >
            <Users size={24} color="#FFFFFF" />
            <Text color="white" fontWeight="$6" marginTop="$1">Join</Text>
          </Button>
        </XStack>

        {/* Create Form */}
        {showCreateForm && (
          <Card padding="$4" marginBottom="$6" elevate>
            <Text fontWeight="$7" marginBottom="$3">Create Family Space</Text>
            <Input
              backgroundColor="$gray3"
              padding="$3"
              borderRadius="$4"
              marginBottom="$3"
              placeholder="Enter family name"
              value={newFamilyName}
              onChangeText={setNewFamilyName}
            />
            <Button
              backgroundColor="$blue9"
              borderRadius="$4"
              onPress={handleCreateFamily}
            >
              <Text color="white" textAlign="center" fontWeight="$6">
                Create
              </Text>
            </Button>
          </Card>
        )}

        {/* Join Form */}
        {showJoinForm && (
          <Card padding="$4" marginBottom="$6" elevate>
            <Text fontWeight="$7" marginBottom="$3">Join Family Space</Text>
            <Input
              backgroundColor="$gray3"
              padding="$3"
              borderRadius="$4"
              marginBottom="$3"
              placeholder="Enter invite code"
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
            />
            <Button
              backgroundColor="$purple9"
              borderRadius="$4"
              onPress={handleJoinFamily}
            >
              <Text color="white" textAlign="center" fontWeight="$6">Join</Text>
            </Button>
          </Card>
        )}

        {/* Family Spaces List */}
        <Text fontWeight="$7" fontSize="$5" marginBottom="$3">Your Family Spaces</Text>

        {loading ? (
          <YStack alignItems="center" paddingVertical="$8">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text marginTop="$2" color="$gray10">Loading family spaces...</Text>
          </YStack>
        ) : familySpaces.length === 0 ? (
          <Card padding="$6" alignItems="center">
            <Text color="$gray10" textAlign="center">
              You haven't joined any family spaces yet.
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
              >
                <XStack alignItems="center" justifyContent="space-between" width="100%">
                  <YStack>
                    <Text fontWeight="$7" fontSize="$5">{family.name}</Text>
                    <Text color="$gray10">
                      {family.members.length} members
                    </Text>
                  </YStack>
                  <ChevronRight size={20} color="#9CA3AF" />
                </XStack>
              </Button>

              <YStack padding="$4" backgroundColor="$gray2">
                <XStack justifyContent="space-between" alignItems="center" marginBottom="$2">
                  <Text color="$gray10">Invite Code:</Text>
                  <XStack alignItems="center">
                    <Text fontWeight="$6" marginRight="$2">
                      {family.inviteCode}
                    </Text>
                    <Button 
                      chromeless
                      onPress={() => copyInviteCode(family.inviteCode)}
                    >
                      <Copy size={16} color="#3B82F6" />
                    </Button>
                  </XStack>
                </XStack>

                <XStack justifyContent="space-between" alignItems="center">
                  <Text color="$gray10">Created by:</Text>
                  <Text>{family.creatorName} (You)</Text>
                </XStack>
              </YStack>

              {family.createdBy === user?.id && (
                <Button
                  backgroundColor="$red2"
                  flexDirection="row"
                  alignItems="center"
                  justifyContent="center"
                  onPress={() => {
                    Alert.alert(
                      "Confirm Deletion",
                      `Are you sure you want to delete "${family.name}"? This action cannot be undone.`,
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Delete",
                          style: "destructive",
                          onPress: () => {
                            setFamilySpaces(
                              familySpaces.filter((f) => f.id !== family.id)
                            );
                            if (family.id === currentFamilySpace?.id) {
                              setCurrentFamilySpace(null);
                            }
                          },
                        },
                      ]
                    );
                  }}
                >
                  <Trash size={16} color="#EF4444" />
                  <Text color="#EF4444" marginLeft="$1">
                    Dissolve Family Space
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

import React, { useState } from "react";
import { Alert, ActivityIndicator } from "react-native";
import {
  Sheet,
  Button,
  Text,
  XStack,
  YStack,
  Input,
  H4,
  useTheme,
} from "tamagui";
import { Mail, User, UserPlus } from "lucide-react-native";
import { addMemberByEmail, addMemberById } from "@/utils/family.utils";
import { FamilySpace } from "@/types/family.types";
import { useTranslation } from "react-i18next";

interface AddFamilyMemberSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  family: FamilySpace | null;
  onMemberAdded?: () => void;
}

export default function AddFamilyMemberSheet({
  open,
  onOpenChange,
  family,
  onMemberAdded,
}: AddFamilyMemberSheetProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const [addByEmail, setAddByEmail] = useState(true);
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const resetForm = () => {
    setEmail("");
    setUserId("");
    setAddByEmail(true);
    setIsProcessing(false);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleAddByEmail = async () => {
    if (!family) return;

    if (!email.trim() || !email.includes("@")) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    try {
      setIsProcessing(true);
      const success = await addMemberByEmail(family.id, email.trim());

      if (success) {
        Alert.alert("Success", `Invitation sent to ${email}`);
        onMemberAdded?.();
        handleClose();
      } else {
        Alert.alert("Error", "User not found for this email");
      }
    } catch (error) {
      console.error("Failed to add member by email:", error);
      Alert.alert("Error", "Failed to add member");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddById = async () => {
    if (!family) return;

    if (!userId.trim()) {
      Alert.alert("Error", "Please enter a user ID");
      return;
    }

    try {
      setIsProcessing(true);
      const success = await addMemberById(family.id, userId.trim());

      if (success) {
        Alert.alert("Success", `Added user ID: ${userId}`);
        onMemberAdded?.();
        handleClose();
      } else {
        Alert.alert("Error", "User not found for this ID");
      }
    } catch (error) {
      console.error("Failed to add member by ID:", error);
      Alert.alert("错误", "添加成员失败");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!family) return null;

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[70]}
      dismissOnSnapToBottom
    >
      <Sheet.Overlay
        animation="lazy"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
      />
      <Sheet.Handle />
      <Sheet.Frame
        padding="$4"
        justifyContent="flex-start"
        backgroundColor="$background"
      >
        <YStack gap="$4" flex={1}>
          <YStack alignItems="center" gap="$2">
            <H4 color="$color">Add Family Member</H4>
            <Text color="$color10" textAlign="center">
              {family.name} - Add New Member
            </Text>
          </YStack>

          {/* Add method selection */}
          <XStack gap="$3">
            <Button
              flex={1}
              backgroundColor={addByEmail ? "$blue9" : "$gray4"}
              borderRadius="$4"
              onPress={() => setAddByEmail(true)}
              disabled={isProcessing}
            >
              <Mail size={18} color={addByEmail ? "#FFFFFF" : theme.color?.get()} />
              <Text color={addByEmail ? "white" : "$color"} marginLeft="$1">
                By Email
              </Text>
            </Button>

            <Button
              flex={1}
              backgroundColor={!addByEmail ? "$blue9" : "$gray4"}
              borderRadius="$4"
              onPress={() => setAddByEmail(false)}
              disabled={isProcessing}
            >
              <User size={18} color={!addByEmail ? "#FFFFFF" : theme.color?.get()} />
              <Text color={!addByEmail ? "white" : "$color"} marginLeft="$1">
                By User ID
              </Text>
            </Button>
          </XStack>

          {/* Form content */}
          <YStack gap="$3" flex={1}>
            {addByEmail ? (
              <>
                <Text color="$color10">Enter the email address of the member to add</Text>
                <Input
                  backgroundColor="$backgroundSoft"
                  padding="$3"
                  borderRadius="$4"
                  placeholder="example@email.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  disabled={isProcessing}
                  color="$color"
                  borderColor="$color10"
                />
              </>
            ) : (
              <>
                <Text color="$color10">Enter the user ID of the member to add</Text>
                <Input
                  backgroundColor="$backgroundSoft"
                  padding="$3"
                  borderRadius="$4"
                  placeholder="User ID"
                  value={userId}
                  onChangeText={setUserId}
                  disabled={isProcessing}
                  color="$color"
                  borderColor="$color10"
                />
              </>
            )}

            {/* Tips */}
            <YStack gap="$2" backgroundColor="$backgroundSoft" padding="$3" borderRadius="$4">
              <Text fontWeight="$6" color="$color" fontSize="$3">
                Tips
              </Text>
              <Text color="$color10" fontSize="$2">
                • You can also share the invite code for members to join themselves
              </Text>
              <Text color="$color10" fontSize="$2">
                • Invite Code: <Text fontWeight="$6" color="$color">{family.inviteCode}</Text>
              </Text>
              <Text color="$color10" fontSize="$2">
                • Only the family creator can add or remove members
              </Text>
            </YStack>
          </YStack>

          {/* Action buttons */}
          <YStack gap="$3">
            <Button
              backgroundColor="$blue9"
              color="white"
              onPress={addByEmail ? handleAddByEmail : handleAddById}
              disabled={isProcessing}
              size="$4"
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <UserPlus size={18} color="#FFFFFF" />
                  <Text color="white" fontWeight="$6" marginLeft="$1">
                    Add Member
                  </Text>
                </>
              )}
            </Button>

            <Button
              backgroundColor="$gray4"
              color="$color"
              onPress={handleClose}
              disabled={isProcessing}
            >
              <Text color="$color">Cancel</Text>
            </Button>
          </YStack>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
}
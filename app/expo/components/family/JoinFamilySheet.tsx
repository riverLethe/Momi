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
  Card,
} from "tamagui";
import { Users, Check, X } from "lucide-react-native";
import { useAuth } from "@/providers/AuthProvider";
import { joinFamilySpace, getFamilyByInviteCode } from "@/utils/family.utils";
import { FamilySpace } from "@/types/family.types";
import { useTranslation } from "react-i18next";

interface JoinFamilySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFamilyJoined?: (family: FamilySpace) => void;
}

export default function JoinFamilySheet({
  open,
  onOpenChange,
  onFamilyJoined,
}: JoinFamilySheetProps) {
  const { user } = useAuth();
  const theme = useTheme();
  const { t } = useTranslation();

  const [inviteCode, setInviteCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [previewFamily, setPreviewFamily] = useState<(FamilySpace & { isAlreadyMember?: boolean }) | null>(null);
  const [joinStep, setJoinStep] = useState<'input' | 'preview'>('input');

  const resetForm = () => {
    setInviteCode("");
    setIsProcessing(false);
    setIsLookingUp(false);
    setPreviewFamily(null);
    setJoinStep('input');
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleLookupFamily = async () => {
    if (!user) return;

    if (!inviteCode.trim()) {
      Alert.alert("Error", "Please enter an invite code");
      return;
    }

    try {
      setIsLookingUp(true);
      const familyInfo = await getFamilyByInviteCode(inviteCode.trim());

      if (!familyInfo) {
        Alert.alert("Error", "Invalid invite code, please check and try again");
        return;
      }

      setPreviewFamily(familyInfo);
      setJoinStep('preview');
    } catch (error) {
      console.error("Failed to lookup family space:", error);
      Alert.alert("Error", "Failed to find family space, please check your network connection");
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleConfirmJoin = async () => {
    if (!user || !previewFamily) return;

    try {
      setIsProcessing(true);
      const joinedSpace = await joinFamilySpace(inviteCode.trim(), user);

      if (!joinedSpace) {
        Alert.alert("Error", "Failed to join family space");
        return;
      }

      onFamilyJoined?.(joinedSpace);
      Alert.alert("Success", `You have joined family space "${joinedSpace.name}"!`);
      handleClose();
    } catch (error) {
      console.error("Failed to join family space:", error);
      Alert.alert("Error", "Failed to join family space");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackToInput = () => {
    setJoinStep('input');
    setPreviewFamily(null);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[50]}
      disableDrag
      dismissOnSnapToBottom={false}
      dismissOnOverlayPress={false}
    >
      <Sheet.Overlay />
      <Sheet.Handle />
      <Sheet.Frame padding="$4" paddingBottom="$0">
        <Sheet.ScrollView showsVerticalScrollIndicator={false}>
          <YStack gap="$4" flex={1}>
            <YStack alignItems="center" gap="$2">
              <Users size={32} />
              <H4 color="$color">Join Family Space</H4>
              <Text color="$color10" textAlign="center">
                {joinStep === 'input' ? 'Enter invite code to join an existing family space' : 'Confirm joining the following family space'}
              </Text>
            </YStack>

            {/* Form content */}
            <YStack gap="$3" flex={1}>
              {joinStep === 'input' && (
                <>
                  <Text color="$color10">Enter invite code</Text>
                  <Input
                    backgroundColor="$backgroundSoft"
                    padding="$3"
                    borderRadius="$4"
                    placeholder="FAM1234"
                    value={inviteCode}
                    onChangeText={setInviteCode}
                    autoCapitalize="characters"
                    disabled={isLookingUp}
                    color="$color"
                    borderColor="$color10"
                    maxLength={6}
                  />
                </>
              )}

              {joinStep === 'preview' && previewFamily && (
                <Card padding="$4" backgroundColor="$backgroundSoft" borderRadius="$4">
                  <YStack gap="$3">
                    <XStack alignItems="center" justifyContent="space-between">
                      <Text fontWeight="$7" fontSize="$5" color="$color">
                        {previewFamily.name}
                      </Text>
                      {previewFamily.isAlreadyMember && (
                        <XStack alignItems="center" gap="$1">
                          <Check size={16} color={theme.green9?.get()} />
                          <Text color="$green9" fontSize="$3">Joined</Text>
                        </XStack>
                      )}
                    </XStack>

                    <Text color="$color10">
                      Creator: {previewFamily.creatorName}
                    </Text>

                    <Text color="$color10">
                      Members: {previewFamily.members?.length || 0} people
                    </Text>

                    {previewFamily.members && previewFamily.members.length > 0 && (
                      <YStack gap="$2">
                        <Text color="$color10" fontSize="$3">Member list:</Text>
                        {previewFamily.members.slice(0, 3).map((member, index) => (
                          <Text key={index} color="$color" fontSize="$3">
                            • {member.username}{member.isCreator ? ' (Creator)' : ''}
                          </Text>
                        ))}
                        {previewFamily.members.length > 3 && (
                          <Text color="$color10" fontSize="$3">
                            And {previewFamily.members.length - 3} more members...
                          </Text>
                        )}
                      </YStack>
                    )}

                    {previewFamily.isAlreadyMember && (
                      <Card padding="$3" backgroundColor="$yellow2" borderRadius="$3">
                        <Text color="$yellow11" fontSize="$3" textAlign="center">
                          You are already a member of this family space
                        </Text>
                      </Card>
                    )}
                  </YStack>
                </Card>
              )}
            </YStack>

            {/* Action buttons */}
            <YStack gap="$3">
              {joinStep === 'input' && (
                <>
                  <Button
                    backgroundColor="$blue9"
                    color="white"
                    onPress={handleLookupFamily}
                    disabled={isLookingUp || !inviteCode.trim()}
                    size="$4"
                  >
                    {isLookingUp ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text color="white" fontWeight="$6">
                        Find Family Space
                      </Text>
                    )}
                  </Button>

                  <Button
                    backgroundColor="$gray4"
                    color="$color"
                    onPress={handleClose}
                    disabled={isLookingUp}
                  >
                    <Text color="$color">Cancel</Text>
                  </Button>
                </>
              )}

              {joinStep === 'preview' && (
                <>
                  {!previewFamily?.isAlreadyMember && (
                    <Button
                      backgroundColor="$green9"
                      color="white"
                      onPress={handleConfirmJoin}
                      disabled={isProcessing}
                      size="$4"
                    >
                      {isProcessing ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <XStack alignItems="center" gap="$2">
                          <Check size={18} color="white" />
                          <Text color="white" fontWeight="$6">
                            Confirm Join
                          </Text>
                        </XStack>
                      )}
                    </Button>
                  )}

                  <Button
                    backgroundColor="$gray4"
                    color="$color"
                    onPress={handleBackToInput}
                    disabled={isProcessing}
                  >
                    <XStack alignItems="center" gap="$2">
                      <X size={16} color={theme.color?.get()} />
                      <Text color="$color">
                        {previewFamily?.isAlreadyMember ? 'Close' : 'Re-enter'}
                      </Text>
                    </XStack>
                  </Button>
                </>
              )}
            </YStack>
          </YStack>
        </Sheet.ScrollView>
      </Sheet.Frame>
    </Sheet>
  );
}
import React from "react";
import { Card, XStack, YStack, Text, Button } from "tamagui";
import FamilyMembersList from "./FamilyMembersList";
import { FamilySpace } from "@/types/family.types";
import { Copy, RefreshCw, Trash2, UnlinkIcon } from "lucide-react-native";
import { Alert } from "react-native";
import { useFamilyActions } from "./useFamilyActions";
import * as Clipboard from "expo-clipboard";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/providers/AuthProvider";

interface FamilyInfoProps {
  familySpace: FamilySpace;
  onFamilyUpdated: (updatedSpace: FamilySpace) => void;
  onFamilyDeleted?: () => void;
}

export default function FamilyInfo({
  familySpace,
  onFamilyUpdated,
  onFamilyDeleted,
}: FamilyInfoProps) {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Check if current user is the owner
  const isOwner = familySpace.createdBy === user?.id;
  const { refreshInviteCode, isRefreshingCode, isDissolvingFamily, isLeavingFamily, dissolveFamily, leaveFamily } = useFamilyActions();

  const handleCopyInviteCode = async () => {
    if (!familySpace) return;

    await Clipboard.setStringAsync(familySpace.inviteCode);
    Alert.alert(t("Success"), t("Invite code copied to clipboard"));
  };

  const handleRefreshInviteCode = async () => {
    if (!familySpace) return;

    const result = await refreshInviteCode(familySpace);
    if (result && onFamilyUpdated) {
      onFamilyUpdated(result);
    }
  };


  // Handle dissolve family
  const handleDissolveFamily = async () => {
    const success = await dissolveFamily(familySpace);
    if (success) {
      onFamilyDeleted?.();
    }
  };

  // Handle leave family
  const handleLeaveFamily = async () => {
    const success = await leaveFamily(familySpace);
    if (success) {
      onFamilyDeleted?.();
    }
  };
  return (
    <YStack gap="$3" flex={1}>

      {/* Invite Code Display */}
      <Card
        backgroundColor="transparent"
        padding="$0"
      >
        <XStack justifyContent="space-between" alignItems="center" gap="$2" >
          <Text
            color="$color"
            fontSize="$4"
            fontWeight="bold"
            letterSpacing={2}
            backgroundColor="$blue3"
            flex={1}
            alignItems="center"
            paddingHorizontal="$4"
            paddingVertical="$3"
            borderRadius="$3"
          >
            {familySpace.inviteCode}
          </Text>
          <XStack gap="$2">
            <Button
              onPress={handleCopyInviteCode}
              icon={<Copy size={16} />}
              chromeless
              size="sm"
              backgroundColor="$card"
              height="$3"
              width="$3"
            >
            </Button>

            <Button
              size="$2"
              backgroundColor="$blue9"
              color="white"
              onPress={handleRefreshInviteCode}
              disabled={isRefreshingCode}
              pressStyle={{ opacity: 0.8 }}
              chromeless
              icon={<RefreshCw size={16} color="white" />}
              height="$3"
              width="$3"

            >
            </Button>
          </XStack>
        </XStack>
      </Card>

      <FamilyMembersList
        familySpace={familySpace}
        onFamilyUpdated={onFamilyUpdated}
      />


      {/* Action Buttons */}
      <XStack gap="$2" position="absolute" bottom={0} right={0}>

        {isOwner ? (
          <Button
            size="$4"
            backgroundColor="$red9"
            onPress={handleDissolveFamily}
            disabled={isDissolvingFamily}
            chromeless
            width="$4"
            icon={<UnlinkIcon size={16} color="white" />}
          />
        ) : (
          <Button
            size="$4"
            backgroundColor="$red9"
            onPress={handleLeaveFamily}
            disabled={isLeavingFamily}
            chromeless
            width="$4"
            icon={<Trash2 size={16} color="white" />}
          />
        )}
      </XStack>
    </YStack>
  );
}
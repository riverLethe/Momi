import React, { useState } from "react";
import { ActivityIndicator } from "react-native";
import {
  Text,
  Button,
  YStack,
  Card,
  H3,
  useTheme,
  Input,
  XStack,
} from "tamagui";
import { Crown, Users } from "lucide-react-native";
import { useFamilyActions } from "./useFamilyActions";
import { useTranslation } from "react-i18next";

interface FamilyFeatureSelectionProps {
  onFamilyCreated: () => void;
  onFamilyJoined: () => void;
}

export default function FamilyFeatureSelection({
  onFamilyCreated,
  onFamilyJoined,
}: FamilyFeatureSelectionProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { isProcessing, createFamilySpaceWithDefaultName, joinFamilyWithCode } = useFamilyActions();
  const [joinCode, setJoinCode] = useState("");

  const handleCreateFamily = async () => {
    const result = await createFamilySpaceWithDefaultName();
    if (result) {
      onFamilyCreated();
    }
  };

  const handleJoinFamily = async () => {
    const result = await joinFamilyWithCode(joinCode);
    if (result) {
      setJoinCode("");
      onFamilyJoined();
    }
  };

  return (
    <YStack gap="$4" marginTop="$6">
      {/* Create personal family */}
      <Card padding="$5" backgroundColor="$card" borderRadius="$4" elevate>
        <YStack alignItems="center" gap="$3">
          <Crown size={32} color={theme.blue9?.get()} />
          <H3 color="$color">{t("Create My Family")}</H3>
          <Text color="$color10" textAlign="center" fontSize="$3">
            {t("Create your family space and invite someone to join")}
          </Text>
          <Button
            backgroundColor="$blue9"
            color="white"
            size="$4"
            borderRadius="$3"
            onPress={handleCreateFamily}
            disabled={isProcessing}
            width="100%"
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text color="white" fontWeight="$6">Create Family</Text>
            )}
          </Button>
        </YStack>
      </Card>

      {/* Join other family */}
      <Card padding="$5" backgroundColor="$card" borderRadius="$4" elevate>
        <YStack gap="$4">
          <YStack alignItems="center" gap="$3">
            <Users size={32} color={theme.green9?.get()} />
            <H3 color="$color">Join Family</H3>
            <Text color="$color10" textAlign="center" fontSize="$3">
              Join someone else's family using an invite code
            </Text>
          </YStack>

          <XStack gap="$3">
            <Input
              placeholder="Enter 6-digit invite code"
              value={joinCode}
              onChangeText={setJoinCode}
              autoCapitalize="characters"
              maxLength={6}
              flex={1}
            />
            <Button
              backgroundColor="$green9"
              color="white"
              size="$4"
              borderRadius="$3"
              onPress={handleJoinFamily}
              disabled={!joinCode.trim() || isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text color="white" fontWeight="$6">{t("Search")}</Text>
              )}
            </Button>
          </XStack>
        </YStack>
      </Card>
    </YStack>
  );
}
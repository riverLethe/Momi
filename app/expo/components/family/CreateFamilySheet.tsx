import React, { useState } from "react";
import { Alert, ActivityIndicator } from "react-native";
import {
  Sheet,
  Button,
  Text,
  YStack,
  Input,
  H4,
} from "tamagui";
import { Plus } from "lucide-react-native";
import { useAuth } from "@/providers/AuthProvider";
import { createFamilySpace } from "@/utils/family.utils";
import { FamilySpace } from "@/types/family.types";
import { useTranslation } from "react-i18next";

interface CreateFamilySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFamilyCreated?: (family: FamilySpace) => void;
}

export default function CreateFamilySheet({
  open,
  onOpenChange,
  onFamilyCreated,
}: CreateFamilySheetProps) {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [familyName, setFamilyName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const resetForm = () => {
    setFamilyName("");
    setIsProcessing(false);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleCreateFamily = async () => {
    if (!user) return;

    if (!familyName.trim()) {
      Alert.alert("Error", "Please enter a family name");
      return;
    }

    try {
      setIsProcessing(true);
      const newFamilySpace = await createFamilySpace(familyName.trim(), user);

      onFamilyCreated?.(newFamilySpace);
      Alert.alert("Success", `Family space "${newFamilySpace.name}" has been created!`);
      handleClose();
    } catch (error) {
      console.error("Failed to create family space:", error);
      Alert.alert("Error", "Failed to create family space");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[50]}
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
            <Plus size={32} />
            <H4 color="$color">Create Family Space</H4>
            <Text color="$color10" textAlign="center">
              Create a new family space to manage shared expenses
            </Text>
          </YStack>

          {/* Form content */}
          <YStack gap="$3" flex={1}>
            <Text color="$color10">Enter family name</Text>
            <Input
              backgroundColor="$backgroundSoft"
              padding="$3"
              borderRadius="$4"
              placeholder="My Family"
              value={familyName}
              onChangeText={setFamilyName}
              disabled={isProcessing}
              color="$color"
              borderColor="$color10"
            />
          </YStack>

          {/* Action buttons */}
          <YStack gap="$3">
            <Button
              backgroundColor="$blue9"
              color="white"
              onPress={handleCreateFamily}
              disabled={isProcessing || !familyName.trim()}
              size="$4"
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text color="white" fontWeight="$6">
                  Create Family Space
                </Text>
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
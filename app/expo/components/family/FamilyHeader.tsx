import React, { useState } from "react";
import { Pressable } from "react-native";
import {
  Text,
  YStack,
  XStack,
  Input,
} from "tamagui";
import { useFamilyActions } from "./useFamilyActions";
import { FamilySpace } from "@/types/family.types";
import { useAuth } from "@/providers/AuthProvider";

interface FamilyHeaderProps {
  familySpace: FamilySpace;
  onFamilyUpdated: (updatedSpace: FamilySpace) => void;
}

export default function FamilyHeader({
  familySpace,
  onFamilyUpdated,
}: FamilyHeaderProps) {
  const { user } = useAuth();
  const { updateFamilyName, isProcessing } = useFamilyActions();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(familySpace.name);
  const [isPressed, setIsPressed] = useState(false);

  // Check if current user is the owner
  const isOwner = familySpace.createdBy === user?.id;
  // Handle family name edit
  const handleNameLongPress = () => {
    if (!isOwner) return
    setIsEditingName(true);
  };

  const handleNameSave = async () => {
    if (isProcessing) return
    if (!familySpace || !editedName.trim() || editedName === familySpace.name) {
      setIsEditingName(false);
      setEditedName(familySpace?.name || "");
      return;
    }

    const result = await updateFamilyName(familySpace, editedName.trim());
    if (result) {
      onFamilyUpdated(result);
    }
    setIsEditingName(false);
  };


  return (
    <XStack
      alignItems="center"
      justifyContent="space-between"
      flex={1}
      paddingRight="$2"
    >
      {/* Family Name */}
      <YStack flex={1}>
        {isEditingName ? (
          <Input
            value={editedName}
            onChangeText={setEditedName}
            onBlur={handleNameSave}
            onSubmitEditing={handleNameSave}
            placeholder="Family Name"
            borderWidth={0}
            autoFocus
          />
        ) : (
          <Pressable
            onLongPress={handleNameLongPress}
            delayLongPress={500}
            onPressIn={() => setIsPressed(true)}
            onPressOut={() => setIsPressed(false)}
            style={{
              opacity: isPressed ? 0.7 : 1,
              padding: 4,
              borderRadius: 4,
              paddingVertical: 11
            }}
          >
            <Text
              color="$color"
              fontSize="$4"
              numberOfLines={1}
            >
              {familySpace.name}
            </Text>
          </Pressable>
        )}
      </YStack>

    </XStack>
  );
}
import React from "react";
import {
  Text,
  Button,
  XStack,
  YStack,
  H3,
  useTheme,
  Sheet,
} from "tamagui";
import {
  Trash,
  LogOut,
} from "lucide-react-native";
import { FamilySpace } from "@/types/family.types";
import { useAuth } from "@/providers/AuthProvider";
import { useFamilyActions } from "./useFamilyActions";
import { useTranslation } from "react-i18next";

interface FamilyActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familySpace: FamilySpace | null;
  onFamilyAction: () => void;
}

export default function FamilyActionSheet({
  open,
  onOpenChange,
  familySpace,
  onFamilyAction,
}: FamilyActionSheetProps) {
  const { user } = useAuth();
  const theme = useTheme();
  const { dissolveFamily, leaveFamily, isDissolvingFamily, isLeavingFamily } = useFamilyActions();
  const { t } = useTranslation();

  const handleDissolveFamily = async () => {
    if (!familySpace) return;
    
    onOpenChange(false);
    const result = await dissolveFamily(familySpace);
    if (result) {
      onFamilyAction();
    }
  };

  const handleLeaveFamily = async () => {
    if (!familySpace) return;
    
    onOpenChange(false);
    const result = await leaveFamily(familySpace);
    if (result) {
      onFamilyAction();
    }
  };

  if (!familySpace) return null;

  const isCreator = familySpace.createdBy === user?.id;

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[30]}
      dismissOnSnapToBottom
    >
      <Sheet.Overlay />
      <Sheet.Handle />
      <Sheet.Frame padding="$4" backgroundColor="$background">
        <YStack gap="$3">
          <H3 color="$color" textAlign="center">{t("Family Actions")}</H3>

          {isCreator ? (
            <Button
              backgroundColor="$red2"
              onPress={handleDissolveFamily}
              disabled={isDissolvingFamily}
            >
              <XStack alignItems="center" gap="$2">
                <Trash size={16} color={theme.red9?.get()} />
                <Text color={theme.red9?.get()}>
                  {isDissolvingFamily ? t("Dissolving...") : t("Dissolve Family")}
                </Text>
              </XStack>
            </Button>
          ) : (
            <Button
              backgroundColor="$orange2"
              onPress={handleLeaveFamily}
              disabled={isLeavingFamily}
            >
              <XStack alignItems="center" gap="$2">
                <LogOut size={16} color={theme.orange9?.get()} />
                <Text color={theme.orange9?.get()}>
                  {isLeavingFamily ? t("Leaving...") : t("Leave Family")}
                </Text>
              </XStack>
            </Button>
          )}
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
}
import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  YStack,
  useTheme,
  Text,
  XStack,
  Button,
} from "tamagui";
import { useAuth } from "@/providers/AuthProvider";
import FamilyFeatureSelection from "@/components/family/FamilyFeatureSelection";
import FamilyInfo from "@/components/family/FamilyInfo";
import { FamilySpace } from "@/types/family.types";
import { SafeAreaView, TouchableWithoutFeedback, Keyboard } from "react-native";
import { ChevronLeftIcon } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import FamilyHeader from "@/components/family/FamilyHeader";

export default function FamilySpacesScreen() {
  const { user, updateUser } = useAuth();
  const [familySpace, setFamilySpace] = useState<FamilySpace | null>(user?.family || null);
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    // 直接使用用户的家庭信息初始化
    setFamilySpace(user?.family || null);
  }, [user?.family]);

  const handleFamilyUpdated = (updatedSpace: FamilySpace) => {
    setFamilySpace(updatedSpace);
    // 更新用户信息中的家庭字段
    if (user) {
      updateUser({ ...user, family: updatedSpace });
    }
  };

  const handleFamilyDeleted = () => {
    setFamilySpace(null);
    // 更新用户信息，移除家庭字段
    if (user) {
      updateUser({ ...user, family: null });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background?.get() }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <YStack flex={1} padding="$2" gap="$4" backgroundColor="$background">
          <XStack alignItems="center">
            <Button
              size="$3"
              circular
              borderRadius="$2"
              chromeless
              onPress={() => router.back()}
              icon={<ChevronLeftIcon size={20} color={theme.color?.get()} />}
              pressStyle={{
                backgroundColor: "transparent",
                opacity: 0.5,
                borderColor: "transparent",
              }}
            />
            {!familySpace ? (
              <Text fontSize="$4">{t("Family Space")}</Text>
            ) : (
              <FamilyHeader
                familySpace={familySpace}
                onFamilyUpdated={handleFamilyUpdated}
              />
            )}
          </XStack>
          <YStack flex={1} paddingHorizontal="$2">
            {familySpace ? (
              <FamilyInfo
                familySpace={familySpace}
                onFamilyUpdated={handleFamilyUpdated}
                onFamilyDeleted={handleFamilyDeleted}
              />
            ) : (
              <FamilyFeatureSelection
                onFamilyCreated={handleFamilyUpdated}
                onFamilyJoined={handleFamilyUpdated}
              />
            )}
          </YStack>
        </YStack>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

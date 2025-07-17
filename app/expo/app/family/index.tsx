import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  YStack,
  useTheme,
  Text,
  XStack,
  Button,
  Spinner,
} from "tamagui";
import { useFamilyActions } from "@/components/family/useFamilyActions";
import FamilyFeatureSelection from "@/components/family/FamilyFeatureSelection";
import FamilyInfo from "@/components/family/FamilyInfo";
import { FamilySpace } from "@/types/family.types";
import { SafeAreaView, TouchableWithoutFeedback, Keyboard } from "react-native";
import { ChevronLeftIcon } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import FamilyHeader from "@/components/family/FamilyHeader";

export default function FamilySpacesScreen() {
  const { loadFamilySpace, isLoadingFamilySpace } = useFamilyActions();
  const [familySpace, setFamilySpace] = useState<FamilySpace | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    loadFamilySpaceData();
  }, []);

  const loadFamilySpaceData = async () => {
    const space = await loadFamilySpace();
    setFamilySpace(space);
    setIsInitialLoading(false);
  };

  const handleFamilyUpdated = (updatedSpace: FamilySpace) => {
    setFamilySpace(updatedSpace);
  };

  const handleFamilyDeleted = () => {
    setFamilySpace(null);
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
            {isInitialLoading || isLoadingFamilySpace ? (
              <YStack flex={1} alignItems="center" justifyContent="center">
                <Spinner size="large" />
                <Text marginTop="$4">Loading family space...</Text>
              </YStack>
            ) : familySpace ? (
              <FamilyInfo
                familySpace={familySpace}
                onFamilyUpdated={handleFamilyUpdated}
                onFamilyDeleted={handleFamilyDeleted}
              />
            ) : (
              <FamilyFeatureSelection
                onFamilyCreated={loadFamilySpaceData}
                onFamilyJoined={loadFamilySpaceData}
              />
            )}
          </YStack>
        </YStack>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

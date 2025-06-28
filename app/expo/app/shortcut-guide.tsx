import React from "react";
import { SafeAreaView, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeftIcon } from "lucide-react-native";
import { Button, H2, Text, XStack, YStack, View, Circle } from "tamagui";
import { installQuickScreenshotBillShortcut } from '@/utils/shortcutInstaller';
import { useTranslation } from "react-i18next";

export default function ShortcutGuideScreen() {
    const router = useRouter();
    const { t } = useTranslation();

    const handleInstallShortcut = async () => {
        try {
            await installQuickScreenshotBillShortcut();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
            <YStack flex={1} padding="$2" gap="$6">
                <XStack alignItems="center">
                    <Button
                        size="$3"
                        circular
                        borderRadius="$2"
                        chromeless
                        onPress={() => router.back()}
                        icon={<ChevronLeftIcon size={20} />}
                        pressStyle={{
                            backgroundColor: "transparent",
                            opacity: 0.5,
                            borderColor: "transparent",
                        }}
                    />
                </XStack>

                <YStack flex={1} paddingHorizontal="$4" paddingTop="$4">
                    <YStack alignItems="center" gap="$2" marginTop="$4">
                        <H2>{t("Quick Screenshot Bill")}</H2>
                        <Text color="$gray10" textAlign="center">
                            {t("Easily add bills by taking screenshots of receipts")}
                        </Text>
                    </YStack>

                    <YStack gap="$6" marginTop="$6">
                        {/* How to use guide */}
                        <YStack gap="$5">
                            <YStack gap="$2">
                                <XStack alignItems="center" gap="$3">
                                    <Text color="$blue9" fontWeight="bold">1.</Text>
                                    <Text fontWeight="bold" fontSize="$4">{t("Add Shortcut")}</Text>
                                </XStack>
                                <Text color="$gray10">
                                    {t("Tap the 'Install Shortcut' button below to add this feature to your device")}
                                </Text>
                            </YStack>

                            <YStack gap="$2">
                                <XStack alignItems="center" gap="$3">
                                    <Text color="$blue9" fontWeight="bold">2.</Text>
                                    <Text fontWeight="bold" fontSize="$4">{t("Setup")}</Text>
                                </XStack>
                                <Text color="$gray10">
                                    {t("Go to your device Settings → Accessibility → Touch → Back Tap")}
                                </Text>
                                <Text color="$gray10">
                                    {t("Choose either Double Tap or Triple Tap, then select 'Quick Bill Screenshot'")}
                                </Text>
                            </YStack>

                            <YStack gap="$2">
                                <XStack alignItems="center" gap="$3">
                                    <Text color="$blue9" fontWeight="bold">3.</Text>
                                    <Text fontWeight="bold" fontSize="$4">{t("Usage")}</Text>
                                </XStack>
                                <Text color="$gray10">
                                    {t("When viewing a receipt or bill, simply double/triple tap the back of your device")}
                                </Text>
                                <Text color="$gray10">
                                    {t("The app will automatically open and process the screenshot for quick bill entry")}
                                </Text>
                            </YStack>
                        </YStack>

                        {/* Install Button */}
                        <Button
                            backgroundColor="$blue9"
                            color="white"
                            onPress={handleInstallShortcut}
                            marginTop="$4"
                            size="$4"
                        >
                            <Text color="white" fontWeight="$6">{t("Install Shortcut")}</Text>
                        </Button>
                    </YStack>
                </YStack>
            </YStack>
        </SafeAreaView>
    );
} 
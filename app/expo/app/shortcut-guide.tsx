import React from "react";
import { Image, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeftIcon } from "lucide-react-native";
import { Button, H2, Text, XStack, YStack, View, Circle, useTheme } from "tamagui";
import { installQuickScreenshotBillShortcut } from '@/utils/shortcutInstaller';
import { useTranslation } from "react-i18next";

export default function ShortcutGuideScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const theme = useTheme();

    const handleInstallShortcut = async () => {
        try {
            await installQuickScreenshotBillShortcut();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background?.get() }} edges={['top']}>
            <YStack flex={1} padding="$2" gap="$6" backgroundColor="$background">
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
                </XStack>

                <YStack flex={1} paddingHorizontal="$4" paddingTop="$4">
                    <YStack alignItems="center" gap="$2" marginTop="$4">
                        <H2 color="$color">{t("Quick Screenshot Bill")}</H2>
                        <Text color="$color10" textAlign="center">
                            {t("Easily add bills by taking screenshots of receipts")}
                        </Text>
                    </YStack>

                    <YStack gap="$6" marginTop="$6">
                        {/* How to use guide */}
                        <YStack gap="$5">
                            <YStack gap="$2">
                                <XStack alignItems="center" gap="$3">
                                    <Text color="$blue9" fontWeight="bold">1.</Text>
                                    <Text fontWeight="bold" fontSize="$4" color="$color">{t("Add Shortcut")}</Text>
                                </XStack>
                                <Text color="$color10">
                                    {t("Tap the 'Install Shortcut' button below to add this feature to your device")}
                                </Text>
                            </YStack>

                            <YStack gap="$2">
                                <XStack alignItems="center" gap="$3">
                                    <Text color="$blue9" fontWeight="bold">2.</Text>
                                    <Text fontWeight="bold" fontSize="$4" color="$color">{t("Setup")}</Text>
                                </XStack>
                                <Text color="$color10">
                                    {t("Go to your device Settings → Accessibility → Touch → Back Tap")}
                                </Text>
                                <Text color="$color10">
                                    {t("Choose either Double Tap or Triple Tap, then select 'Quick Bill Screenshot'")}
                                </Text>
                            </YStack>

                            <YStack gap="$2">
                                <XStack alignItems="center" gap="$3">
                                    <Text color="$blue9" fontWeight="bold">3.</Text>
                                    <Text fontWeight="bold" fontSize="$4" color="$color">{t("Usage")}</Text>
                                </XStack>
                                <Text color="$color10">
                                    {t("When viewing a receipt or bill, simply double/triple tap the back of your device")}
                                </Text>
                                <Text color="$color10">
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
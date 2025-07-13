import React from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeftIcon } from "lucide-react-native";
import { Button, H2, Text, XStack, YStack, Image, Circle, useTheme } from "tamagui";
import { useTranslation } from "react-i18next";

export default function WidgetGuideScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const theme = useTheme();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background?.get() }} edges={['top']}>
            <YStack flex={1} paddingVertical="$2" gap="$2" backgroundColor="$background">
                <XStack paddingHorizontal="$2" alignItems="center" gap="$2">
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
                    <Text fontWeight="bold" fontSize="$4" color="$color">
                        {t("iOS Widget Setup")}
                    </Text>
                </XStack>

                <YStack flex={1}>
                    <ScrollView
                        contentContainerStyle={{
                            paddingBottom: 100,
                            paddingHorizontal: 24,
                            paddingTop: 10,
                        }}
                    >
                        {/* How to use guide */}
                        <YStack gap="$5">
                            <YStack gap="$2">
                                <XStack alignItems="center" gap="$3">
                                    <Text color="$blue9" fontWeight="bold">
                                        1.
                                    </Text>
                                    <Text fontWeight="bold" fontSize="$4" color="$color">
                                        {t("Access Home Screen")}
                                    </Text>
                                </XStack>
                                <Text color="$color10">
                                    {t(
                                        "On your home screen where you want to add the widget, press and hold until apps start jiggling"
                                    )}
                                </Text>
                                <Image
                                    source={require("@/assets/images/guide/widget-1.png")}
                                    width="100%"
                                    height={800}
                                    borderRadius="$10"
                                    overflow="hidden"
                                    backgroundColor="$card"
                                    objectFit="cover"
                                    borderWidth="$2.5"
                                    borderColor="$borderColor"
                                    marginTop="$2"
                                />
                            </YStack>

                            <YStack gap="$2">
                                <XStack alignItems="center" gap="$3">
                                    <Text color="$blue9" fontWeight="bold">
                                        2.
                                    </Text>
                                    <Text fontWeight="bold" fontSize="$4" color="$color">
                                        {t("Add Widget")}
                                    </Text>
                                </XStack>
                                <Text color="$color10">
                                    {t("Tap the + button in the top left corner")}
                                </Text>

                                <Image
                                    source={require("@/assets/images/guide/widget-2.png")}
                                    width="100%"
                                    height={800}
                                    borderRadius="$10"
                                    overflow="hidden"
                                    backgroundColor="$card"
                                    objectFit="cover"
                                    borderWidth="$2.5"
                                    borderColor="$borderColor"
                                    marginTop="$2"
                                />
                            </YStack>

                            <YStack gap="$2">
                                <XStack alignItems="center" gap="$3">
                                    <Text color="$blue9" fontWeight="bold">
                                        3.
                                    </Text>
                                    <Text fontWeight="bold" fontSize="$4" color="$color">
                                        {t("Find MomiQ")}
                                    </Text>
                                </XStack>
                                <Text color="$color10">
                                    {t(
                                        "Scroll through the list or search for 'MomiQ' to find our widgets"
                                    )}
                                </Text>

                                <Image
                                    source={require("@/assets/images/guide/widget-3.png")}
                                    width="100%"
                                    height={800}
                                    borderRadius="$10"
                                    overflow="hidden"
                                    backgroundColor="$card"
                                    objectFit="cover"
                                    borderWidth="$2.5"
                                    borderColor="$borderColor"
                                    marginTop="$2"
                                />
                            </YStack>

                            <YStack gap="$2">
                                <XStack alignItems="center" gap="$3">
                                    <Text color="$blue9" fontWeight="bold">
                                        4.
                                    </Text>
                                    <Text fontWeight="bold" fontSize="$4" color="$color">
                                        {t("Select Widget")}
                                    </Text>
                                </XStack>
                                <Text color="$color10">
                                    {t(
                                        "Swipe left or right to choose the widget type, then tap 'Add Widget'"
                                    )}
                                </Text>

                                <Image
                                    source={require("@/assets/images/guide/widget-4.png")}
                                    width="100%"
                                    height={800}
                                    borderRadius="$10"
                                    overflow="hidden"
                                    backgroundColor="$card"
                                    objectFit="cover"
                                    borderWidth="$2.5"
                                    borderColor="$borderColor"
                                    marginTop="$2"
                                />
                            </YStack>

                            <YStack gap="$2">
                                <XStack alignItems="center" gap="$3">
                                    <Text color="$blue9" fontWeight="bold">
                                        5.
                                    </Text>
                                    <Text fontWeight="bold" fontSize="$4" color="$color">
                                        {t("Finish Setup")}
                                    </Text>
                                </XStack>
                                <Text color="$color10">
                                    {t("Tap 'Done' to complete adding the widget")}
                                </Text>
                            </YStack>

                            <YStack gap="$2">
                                <XStack alignItems="center" gap="$3">
                                    <Text color="$blue9" fontWeight="bold">
                                        6.
                                    </Text>
                                    <Text fontWeight="bold" fontSize="$4" color="$color">
                                        {t("Customize Widget")}
                                    </Text>
                                </XStack>
                                <Text color="$color10">
                                    {t(
                                        "Long press on the widget to edit and customize the displayed content"
                                    )}
                                </Text>
                            </YStack>

                            <YStack gap="$2">
                                <XStack alignItems="center" gap="$3">
                                    <Text color="$blue9" fontWeight="bold">
                                        7.
                                    </Text>
                                    <Text fontWeight="bold" fontSize="$4" color="$color">
                                        {t("Compatibility")}
                                    </Text>
                                </XStack>
                                <Text color="$color10">
                                    {t("Widgets are only supported on iOS 14 and above")}
                                </Text>
                            </YStack>
                        </YStack>
                    </ScrollView>
                </YStack>
            </YStack>
        </SafeAreaView>
    );
}

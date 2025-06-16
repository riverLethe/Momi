import React from "react";
import { Image, ScrollView } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { Text, View } from "tamagui";

/**
 * QuickBillDebugScreen – A lightweight page to verify Quick Bill AppIntent
 * deeplinks work as expected and that the temporary screenshot file path is
 * passed to React Native correctly.
 */
export default function QuickBillDebugScreen() {
  const params = useLocalSearchParams();
  const autoSend = params.autoSend === "1" || params.autoSend === "true";
  const tmpPathRaw =
    typeof params.tmpPath === "string" ? (params.tmpPath as string) : undefined;
  const tmpPath = tmpPathRaw ? decodeURIComponent(tmpPathRaw) : undefined;

  // Normalise URI so it is consumable by <Image />
  let imageUri: string | undefined = tmpPath;
  if (imageUri && !imageUri.startsWith("file://")) {
    imageUri = `file://${imageUri}`;
  }

  return (
    <>
      <Stack.Screen options={{ title: "Quick Bill Debug" }} />
      <ScrollView className="flex-1 p-4">
        <Text className="text-xl font-bold mb-4">Quick Bill Debug Page</Text>
        <View className="space-y-2">
          <Text>autoSend: {autoSend ? "true" : "false"}</Text>
          <Text selectable>{`tmpPath: ${tmpPath ?? "(none)"}`}</Text>
        </View>

        {imageUri ? (
          <>
            <Text className="mt-6 mb-2">Screenshot Preview</Text>
            <Image
              source={{ uri: imageUri }}
              style={{ width: "100%", height: 400, resizeMode: "contain" }}
            />
          </>
        ) : (
          <Text className="mt-6">No screenshot detected.</Text>
        )}
      </ScrollView>
    </>
  );
}

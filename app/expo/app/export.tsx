import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Download } from "lucide-react-native";
import { Button, H2, Text, View, XStack, YStack, Card } from "tamagui";

export default function ExportDataScreen() {
  const router = useRouter();

  const handleExport = (format: string) => {
    // TODO: Implement actual export functionality
    console.log(`Exporting in ${format} format`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <YStack flex={1} padding="$4">
        <XStack alignItems="center" marginBottom="$4">
          <Button
            size="$3"
            circular
            icon={<ArrowLeft size={24} color="#000" />}
            onPress={() => router.back()}
          />
          <H2 marginLeft="$2">Export Data</H2>
        </XStack>

        <YStack space="$4" marginTop="$4">
          <Card padding="$4" elevate>
            <Text fontSize="$5" fontWeight="$6" marginBottom="$2">
              Export Options
            </Text>
            <Text color="$gray10" marginBottom="$4">
              Choose a format to export your financial data
            </Text>

            <YStack space="$3">
              <Button
                icon={<Download size={20} color="#fff" />}
                backgroundColor="$blue9"
                onPress={() => handleExport("csv")}
              >
                <Text color="white" fontWeight="$6">Export as CSV</Text>
              </Button>
              
              <Button
                icon={<Download size={20} color="#fff" />}
                backgroundColor="$green9"
                onPress={() => handleExport("excel")}
              >
                <Text color="white" fontWeight="$6">Export as Excel</Text>
              </Button>
              
              <Button
                icon={<Download size={20} color="#fff" />}
                backgroundColor="$red9"
                onPress={() => handleExport("pdf")}
              >
                <Text color="white" fontWeight="$6">Export as PDF</Text>
              </Button>
            </YStack>
          </Card>
        </YStack>
      </YStack>
    </SafeAreaView>
  );
} 
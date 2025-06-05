import React from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Bell, ChevronRight } from "lucide-react-native";
import { 
  View, 
  Text, 
  Card, 
  Button, 
  XStack, 
  YStack, 
  Avatar, 
  Circle, 
  H5,
  H6,
  AnimatePresence,
  Paragraph,
  useTheme,
} from "tamagui";
import { LinearGradient } from "tamagui/linear-gradient";

import { useViewStore } from "@/stores/viewStore";
import { useAuth } from "@/providers/AuthProvider";

export default function HomeScreen() {
  const router = useRouter();
  const { viewMode, currentFamilySpace, setViewMode } = useViewStore();
  const { isLoggedIn, user } = useAuth();
  const theme = useTheme();

  // Toggle between personal and family view
  const toggleViewMode = () => {
    if (!isLoggedIn && viewMode === "personal") {
      // If user is not logged in and tries to switch to family view, prompt to login
      router.push("/auth/login");
      return;
    }

    setViewMode(viewMode === "personal" ? "family" : "personal");
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background?.get() }}>
      {/* Header */}
      <XStack 
        alignItems="center" 
        justifyContent="space-between"
        paddingHorizontal="$4" 
        paddingVertical="$3"
        backgroundColor="$background"
      >
        <XStack alignItems="center" space="$2">
          <Avatar circular size="$4">
            <Avatar.Fallback delayMs={600}>
              <View backgroundColor={isLoggedIn ? "$blue5" : "$gray5"} width="100%" height="100%" alignItems="center" justifyContent="center">
                <Text color={isLoggedIn ? "$blue11" : "$gray11"} fontSize="$6" fontWeight="bold">
                  {isLoggedIn && user?.username ? user.username.charAt(0).toUpperCase() : "G"}
                </Text>
              </View>
            </Avatar.Fallback>
          </Avatar>
          <Text fontSize="$4" fontWeight="$6" color="$color">
            {isLoggedIn ? user?.username : "Guest"}
          </Text>
        </XStack>

        <XStack alignItems="center" space="$3">
          <Button
            size="$2"
            backgroundColor={viewMode === "personal" ? "$blue5" : "$orange5"}
            pressStyle={{ scale: 0.97, opacity: 0.9 }}
            onPress={toggleViewMode}
          >
            <Text color={viewMode === "personal" ? "$blue11" : "$orange11"} fontWeight="$6">
              {viewMode === "personal"
                ? "Personal"
                : currentFamilySpace?.name || "Family"}
            </Text>
          </Button>

          <Button size="$2" circular pressStyle={{ scale: 0.92 }} backgroundColor="$backgroundHover" onPress={() => {}}>
            <Bell size={18} color={theme?.color?.get()} />
          </Button>
        </XStack>
      </XStack>

      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Financial Summary Card */}
        <Card
          marginTop="$4"
          marginHorizontal="$4"
          overflow="hidden"
          bordered
          elevate
          animation="bouncy"
          scale={1}
          pressStyle={{ scale: 0.98 }}
          borderRadius="$6"
        >
          <LinearGradient
            colors={viewMode === "personal" ? ['$blue4', '$blue6'] : ['$orange4', '$orange6']}
            start={[0, 0]}
            end={[1, 0]}
            borderRadius="$6"
          >
            <YStack padding="$4" space="$2">
              <H5 color="$color" fontWeight="$8" marginBottom="$1">
                {viewMode === "personal" ? "My Summary" : "Family Summary"}
              </H5>
              <XStack justifyContent="space-between" marginTop="$2">
                <YStack>
                  <Paragraph size="$2" color="$colorFocus">This Month</Paragraph>
                  <Text fontSize="$7" fontWeight="$8" color="$color">¥2,580</Text>
                </YStack>
                <YStack>
                  <Paragraph size="$2" color="$colorFocus" textAlign="right">Balance</Paragraph>
                  <Text fontSize="$7" fontWeight="$8" color="$green10">¥12,350</Text>
                </YStack>
              </XStack>
            </YStack>
          </LinearGradient>
        </Card>

        {/* Quick Actions */}
        <XStack justifyContent="space-between" marginTop="$5" marginHorizontal="$4" space="$3">
          <Button
            flex={1}
            height="$5.5"
            backgroundColor="$blue9"
            color="white"
            pressStyle={{ scale: 0.97, opacity: 0.9 }}
            iconAfter={
              <View style={{ width: 24, height: 24, position: 'absolute', right: 6, top: 16, opacity: 0.2 }}>
                <Circle size={48} backgroundColor="$blue10" />
              </View>
            }
            onPress={() => router.push("/bills/chat")}
          >
            <Text color="white" fontWeight="$7" fontSize="$3.5">
              AI Record
            </Text>
          </Button>

          <Button
            flex={1}
            height="$5.5"
            backgroundColor="$purple9"
            color="white"
            pressStyle={{ scale: 0.97, opacity: 0.9 }}
            iconAfter={
              <View style={{ width: 24, height: 24, position: 'absolute', right: -6, top: -10, opacity: 0.2 }}>
                <Circle size={48} backgroundColor="$purple10" />
              </View>
            }
            onPress={() => router.push("/bills/add")}
          >
            <Text color="white" fontWeight="$7" fontSize="$3.5">
              Manual Record
            </Text>
          </Button>
        </XStack>

        {/* Recent Transactions */}
        <YStack marginTop="$6" paddingHorizontal="$4">
          <XStack justifyContent="space-between" alignItems="center" marginBottom="$3">
            <H5 color="$color" fontWeight="$7">Recent Bills</H5>
            <Button
              chromeless
              padding="$1.5"
              height="auto"
              onPress={() => router.push("/bills")}
              pressStyle={{ opacity: 0.7 }}
            >
              <XStack alignItems="center" space="$1">
                <Text color="$blue9" fontWeight="$5">View All</Text>
                <ChevronRight size={16}  />
              </XStack>
            </Button>
          </XStack>

          {/* Example transactions */}
          <AnimatePresence>
            {[1, 2, 3].map((item) => (
              <Card
                key={item}
                marginBottom="$3"
                padding="$0"
                bordered
                borderRadius="$6"
                animation="bouncy"
                enterStyle={{ opacity: 0, y: 10, scale: 0.95 }}
                exitStyle={{ opacity: 0, y: -10, scale: 0.95 }}
                pressStyle={{ scale: 0.98 }}
                onPress={() => router.push(`/bills/details/${item}` as any)}
              >
                <XStack alignItems="center" justifyContent="space-between" padding="$4">
                  <XStack alignItems="center" space="$3">
                    <Circle 
                      size="$4.5" 
                      backgroundColor={item % 2 === 0 ? "$blue4" : "$green4"}
                    >
                      <Text fontSize="$5">🛒</Text>
                    </Circle>
                    <YStack>
                      <Text fontWeight="$6" color="$color">Groceries</Text>
                      <Text color="$colorFocus" fontSize="$2">Today, 14:30</Text>
                    </YStack>
                  </XStack>
                  <Text fontWeight="$7" color="$color">-¥128.50</Text>
                </XStack>
              </Card>
            ))}
          </AnimatePresence>
        </YStack>

        {/* Spending Analysis Preview */}
        <YStack marginTop="$5" marginHorizontal="$4" marginBottom="$8">
          <XStack justifyContent="space-between" alignItems="center" marginBottom="$3">
            <H5 color="$color" fontWeight="$7">Spending Analysis</H5>
            <Button
              chromeless
              padding="$1.5"
              height="auto"
              onPress={() => router.push("/reports")}
              pressStyle={{ opacity: 0.7 }}
            >
              <XStack alignItems="center" space="$1">
                <Text color="$blue9" fontWeight="$5">Details</Text>
                <ChevronRight size={16} />
              </XStack>
            </Button>
          </XStack>

          <Card 
            padding="$4" 
            bordered 
            borderRadius="$6"
            elevate
            animation="bouncy"
            scale={1}
            pressStyle={{ scale: 0.98 }}
            onPress={() => router.push("/reports")}
          >
            <H6 textAlign="center" marginBottom="$4" color="$color">Top Categories</H6>
            
            <XStack justifyContent="space-around">
              <YStack alignItems="center" space="$1">
                <Circle size="$5.5" backgroundColor="$blue4" marginBottom="$1">
                  <Text fontSize="$5">🍔</Text>
                </Circle>
                <Text color="$colorFocus" fontSize="$3">Food</Text>
                <Text fontWeight="$7" color="$color">¥850</Text>
              </YStack>
              
              <YStack alignItems="center" space="$1">
                <Circle size="$5.5" backgroundColor="$green4" marginBottom="$1">
                  <Text fontSize="$5">🚗</Text>
                </Circle>
                <Text color="$colorFocus" fontSize="$3">Transport</Text>
                <Text fontWeight="$7" color="$color">¥650</Text>
              </YStack>
              
              <YStack alignItems="center" space="$1">
                <Circle size="$5.5" backgroundColor="$purple4" marginBottom="$1">
                  <Text fontSize="$5">🛍️</Text>
                </Circle>
                <Text color="$colorFocus" fontSize="$3">Shopping</Text>
                <Text fontWeight="$7" color="$color">¥450</Text>
              </YStack>
            </XStack>
          </Card>
        </YStack>
      </ScrollView>
      
      {/* Bottom Tab Bar is rendered by layout file */}
    </SafeAreaView>
  );
}

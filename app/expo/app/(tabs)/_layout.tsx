import { Tabs } from "expo-router";
import {
  Home,
  User,
  Plus,
} from "lucide-react-native";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useTheme } from "tamagui";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          height: 60 + (insets.bottom || 20),
          paddingBottom: insets.bottom || 20,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          backgroundColor: theme.card?.get(),
        },
        tabBarActiveTintColor: theme.blue9?.get(),
        tabBarInactiveTintColor: theme.color8?.get(),
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 5,
        },
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("Home"),
          tabBarIcon: ({ color, focused }) =>
            focused ?
              <Home size={22} color={theme.color?.get()} fill={color} /> :
              <Home size={22} color={color} />
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "",
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: theme.blue9?.get(),
              alignItems: "center",
              justifyContent: "center",
              marginBottom: -25,
              borderWidth: 5,
              borderColor: focused ? theme.color?.get() : theme.color8?.get(),
            }}>
              <Plus size={24} color="white" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("Profile"),
          tabBarIcon: ({ color, focused }) =>
            focused ?
              <User size={22} color={theme.color?.get()} fill={color} /> :
              <User size={22} color={color} />
        }}
      />
    </Tabs>
  );
}

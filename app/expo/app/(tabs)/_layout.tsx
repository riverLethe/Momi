import { Tabs } from "expo-router";
import {
  Home,
  CreditCard,
  User,
  Plus,
  ChartNoAxesCombinedIcon,
} from "lucide-react-native";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
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
          backgroundColor: 'white',
        },
        tabBarActiveTintColor: "#3B82F6",
        tabBarInactiveTintColor: "#777777",
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
              <Home size={22} color="#000" fill={color} /> :
              <Home size={22} color={color} />
        }}
      />
      <Tabs.Screen
        name="bills"
        options={{
          title: t("Bills"),
          tabBarIcon: ({ color, focused }) =>
            focused ?
              <CreditCard size={22} color="#000" fill={color} /> :
              <CreditCard size={22} color={color} />
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
              backgroundColor: "#3B82F6",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: -25,
              borderWidth: 5,
              borderColor: focused ? "#000" : "#ddd",
            }}>
              <Plus size={24} color="white" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: t("Reports"),
          tabBarIcon: ({ color }) =>
            <ChartNoAxesCombinedIcon size={22} color={color} />
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("Profile"),
          tabBarIcon: ({ color, focused }) =>
            focused ?
              <User size={22} color="#000" fill={color} /> :
              <User size={22} color={color} />
        }}
      />
    </Tabs>
  );
}

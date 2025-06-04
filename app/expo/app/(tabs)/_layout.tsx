import { Tabs } from "expo-router";
import { Home, CreditCard, BarChart2, User, Plus } from "lucide-react-native";
import { useRouter } from "expo-router";
import { View, Circle } from "tamagui";

export default function TabsLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 60,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: "#3B82F6",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="bills"
        options={{
          title: "Bills",
          tabBarIcon: ({ color, size }) => (
            <CreditCard size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: "",
          tabBarIcon: () => (
            <View 
              style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                width: 56, 
                height: 56, 
                borderRadius: 28, 
                backgroundColor: "#3B82F6", 
                marginTop: -20 
              }}
            >
              <Plus size={30} color="#FFFFFF" />
            </View>
          ),
        }}
        listeners={{
          tabPress: (e) => {
            // Prevent default action
            e.preventDefault();
            // Navigate to AI chat bill entry
            router.push("/bills/chat" as any);
          },
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          tabBarIcon: ({ color, size }) => (
            <BarChart2 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

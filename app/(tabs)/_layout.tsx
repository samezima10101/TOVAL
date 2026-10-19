import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { useRef } from "react";

import { Colors, Fonts } from "@/src/constants/theme";
import { ShopTabExitContext, type ShopTabExitHandler } from "@/src/hooks/useShopTabExit";

export default function TabLayout() {
  const shopExit = useRef<ShopTabExitHandler | null>(null);
  return (
    <ShopTabExitContext.Provider value={shopExit}>
      <Tabs
        initialRouteName="index"
        screenListeners={({ navigation, route }) => ({
          tabPress: (event) => {
            const tabs = navigation.getState();
            if (
              tabs.routes[tabs.index].name !== "shop" ||
              route.name === "shop"
            ) return;
            event.preventDefault();
            shopExit.current?.(() => navigation.navigate(route.name));
          },
        })}
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textSub,
          tabBarLabelStyle: { fontFamily: Fonts.medium, fontWeight: "normal" },
          tabBarStyle: {
            backgroundColor: Colors.surface,
            borderTopColor: Colors.border,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "ホーム",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="memory"
          options={{
            title: "メモリー",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="book-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="log"
          options={{
            title: "ログ",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="shop"
          options={{
            title: "ショップ",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="storefront-outline" color={color} size={size} />
            ),
          }}
        />
      </Tabs>
    </ShopTabExitContext.Provider>
  );
}

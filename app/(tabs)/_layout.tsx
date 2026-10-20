import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs } from "expo-router";
import { useRef } from "react";
import { StyleSheet } from "react-native";

import { Colors, Fonts } from "@/src/constants/theme";
import {
  ShopTabExitContext,
  type ShopTabExitHandler,
} from "@/src/hooks/useShopTabExit";

export default function TabLayout() {
  const shopExit = useRef<ShopTabExitHandler | null>(null);
  return (
    <ShopTabExitContext.Provider value={shopExit}>
      <Tabs
        // AppFrame's footer handles the bottom safe area below this bar.
        safeAreaInsets={{ bottom: 0 }}
        screenListeners={({ navigation, route }) => ({
          tabPress: (event) => {
            const tabs = navigation.getState();
            if (
              tabs.routes[tabs.index].name !== "shop" ||
              route.name === "shop"
            )
              return;
            event.preventDefault();
            shopExit.current?.(() => navigation.navigate(route.name));
          },
        })}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: "transparent" },
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textSub,
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarStyle: styles.tabBar,
          tabBarBackground: () => (
            <LinearGradient
              colors={[Colors.text, Colors.background]}
              style={styles.tabBackground}
            />
          ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "ホーム",
            tabBarIcon: () => (
              <Image
                source={require("@/assets/images/footer_home.svg")}
                style={styles.icon}
                contentFit="contain"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="memory"
          options={{
            title: "メモリー",
            tabBarIcon: () => (
              <Image
                source={require("@/assets/images/footer_story.svg")}
                style={styles.icon}
                contentFit="contain"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="log"
          options={{
            title: "ログ",
            tabBarIcon: () => (
              <Image
                source={require("@/assets/images/footer_calendar.svg")}
                style={styles.icon}
                contentFit="contain"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="shop"
          options={{
            title: "ショップ",
            tabBarIcon: () => (
              <Image
                source={require("@/assets/images/footer_unknown.svg")}
                style={styles.icon}
                contentFit="contain"
              />
            ),
          }}
        />
      </Tabs>
    </ShopTabExitContext.Provider>
  );
}

const styles = StyleSheet.create({
  tabBackground: {
    flex: 1,
    opacity: 0.8,
  },
  tabBarLabel: {
    fontFamily: Fonts.medium,
    fontWeight: "normal",
    marginTop: 5,
  },
  tabBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
    height: 70,
    alignItems: "center",
    borderTopWidth: 0,
  },
  icon: {
    height: 50,
    width: 50,
  },
});

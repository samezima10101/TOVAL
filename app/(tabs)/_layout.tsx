import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs } from "expo-router";
import { PlatformPressable } from "expo-router/react-navigation";
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
        initialRouteName="index"
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
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarStyle: styles.tabBar,
          tabBarButton: (props) => (
            <PlatformPressable {...props}>
              {props["aria-selected"] ? (
                <LinearGradient
                  colors={["#FFFFFF00", "#FFFFFF", "#FFFFFF00"]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.activeTabLine}
                  pointerEvents="none"
                  accessible={false}
                />
              ) : null}
              {props.children}
            </PlatformPressable>
          ),
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
  activeTabLine: {
    position: "absolute",
    // Offset the tab bar's top padding to place the line at its upper edge.
    top: -8,
    left: "4%",
    right: "4%",
    height: 2,
  },
  tabBackground: {
    flex: 1,
    opacity: 0.7,
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
    position: "absolute",
  },
  icon: {
    height: 50,
    width: 50,
  },
});

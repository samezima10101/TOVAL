import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";

import { Colors, Fonts } from "@/src/constants/theme";

export default function TabLayout() {
  return (
    <Tabs
      // AppFrame's footer handles the bottom safe area below this bar.
      safeAreaInsets={{ bottom: 0 }}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: "transparent" },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSub,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <LinearGradient
            colors={["rgba(45,55,72,0.45)", "rgba(247,249,252,0.2)"]}
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
        name="menu"
        options={{
          title: "メニュー",
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
  );
}

const styles = StyleSheet.create({
  tabBackground: {
    flex: 1,
  },
  tabBarLabel: {
    fontFamily: Fonts.medium,
    fontWeight: "normal",
    marginTop: 5,
  },
  tabBar: {
    position: "absolute",
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 5,
    height: 60,
    alignItems: "center",
    borderTopWidth: 0,
    backgroundColor: "transparent",
    elevation: 0,
    shadowOpacity: 0,
  },
  icon: {
    height: 40,
    width: 40,
  },
});

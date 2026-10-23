import { Image, type ImageSource } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";

import { Colors, Fonts } from "@/src/constants/theme";

function TabIcon({
  source,
  focused,
}: {
  source: ImageSource;
  focused: boolean;
}) {
  return (
    <View style={styles.icon}>
      {focused ? (
        <LinearGradient
          colors={["rgba(255,255,255,0)", "#FFFFFF", "rgba(38, 52, 210, 0)"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.selectedLine}
          pointerEvents="none"
        />
      ) : null}
      <Image source={source} style={styles.icon} contentFit="contain" />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      // AppFrame's footer handles the bottom safe area below this bar.
      safeAreaInsets={{ bottom: 0 }}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: "transparent" },
        tabBarActiveTintColor: Colors.surface,
        tabBarInactiveTintColor: Colors.background,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <LinearGradient
            colors={["rgba(124, 155, 216, 0.56)", "rgba(0, 0, 0, 0.2)"]}
            style={styles.tabBackground}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "ホーム",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              source={require("@/assets/images/footer_home.svg")}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="memory"
        options={{
          title: "メモリー",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              source={require("@/assets/images/footer_story.svg")}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: "ログ",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              source={require("@/assets/images/footer_calendar.svg")}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: "メニュー",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              source={require("@/assets/images/footer_unknown.svg")}
              focused={focused}
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
  selectedLine: {
    position: "absolute",
    top: -3,
    left: -20,
    width: 80,
    height: 2,
  },
  icon: {
    height: 40,
    width: 40,
  },
});

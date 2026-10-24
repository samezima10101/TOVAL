import { useBottomTabBarHeight } from "expo-router/js-tabs";
import { useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useKeyboardEditor } from "@/src/components/common/KeyboardEditor";
import ScreenBackground from "@/src/components/common/ScreenBackground";
import AudioSettings from "@/src/components/menu/AudioSettings";
import DefaultTimerSettings from "@/src/components/menu/DefaultTimerSettings";
import NotificationSettings from "@/src/components/menu/NotificationSettings";
import UserSettings, {
  UserSettingsToolbar,
  useUserSettings,
} from "@/src/components/menu/UserSettings";
import { Fonts } from "@/src/constants/theme";
import useInputReveal from "@/src/hooks/useInputReveal";

export default function MenuScreen() {
  const { top } = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const tabBarHeight = useBottomTabBarHeight();
  const screenRef = useRef<View>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [bottomOffset, setBottomOffset] = useState(0);
  const userSettings = useUserSettings();
  const { toolbarBottom, contentBottomInset } = useKeyboardEditor({
    bottomOffset,
    minBottom: tabBarHeight,
  });
  const { revealInput, onScroll } = useInputReveal({
    scrollRef,
    getInput: userSettings.getInput,
    topInset: top + 76 + 8,
  });

  if (!userSettings.values) return null;

  return (
    <View
      ref={screenRef}
      style={{ flex: 1 }}
      onLayout={() => {
        screenRef.current?.measureInWindow((_x, y, _width, height) =>
          setBottomOffset(Math.max(0, windowHeight - y - height)),
        );
      }}
    >
      <ScreenBackground source={require("@/assets/bg/starry-bg.png")} />
      <ScrollView
        ref={scrollRef}
        style={
          userSettings.editingField
            ? { marginBottom: contentBottomInset }
            : undefined
        }
        onLayout={revealInput}
        onContentSizeChange={revealInput}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: top + 76 + 20, paddingBottom: tabBarHeight + 20 },
        ]}
        contentInsetAdjustmentBehavior="never"
        scrollIndicatorInsets={{ top: top + 76, bottom: tabBarHeight }}
      >
        <Text style={styles.title} accessibilityRole="header">
          メニュー
        </Text>
        <AudioSettings />
        <UserSettings editor={userSettings} onRevealInput={revealInput} />
        <DefaultTimerSettings />
        <NotificationSettings />
      </ScrollView>
      <UserSettingsToolbar editor={userSettings} bottom={toolbarBottom} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 24 },
  title: { color: "#FFFFFF", fontFamily: Fonts.bold, fontSize: 24 },
});

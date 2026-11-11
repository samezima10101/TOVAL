import { useBottomTabBarHeight } from "expo-router/js-tabs";
import { useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ScrollViewInstance,
  type ViewInstance,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useKeyboardEditor } from "@/src/components/common/KeyboardEditor";
import PrimaryButton from "@/src/components/common/PrimaryButton";
import ScreenBackground from "@/src/components/common/ScreenBackground";
import DefaultTimerSettings from "@/src/components/menu/DefaultTimerSettings";
import NotificationSettings from "@/src/components/menu/NotificationSettings";
import {
  SettingsCard,
  SettingsTitle,
} from "@/src/components/menu/SettingsLayout";
import UserSettings, {
  UserSettingsToolbar,
  useUserSettings,
} from "@/src/components/menu/UserSettings";
import { Fonts } from "@/src/constants/theme";
import useGuardedPush from "@/src/hooks/useGuardedPush";
import useInputReveal from "@/src/hooks/useInputReveal";
import { useTutorial } from "@/src/tutorial/TutorialContext";

export default function MenuScreen() {
  const push = useGuardedPush();
  const { top } = useSafeAreaInsets();
  const { replay } = useTutorial();
  const { height: windowHeight } = useWindowDimensions();
  const tabBarHeight = useBottomTabBarHeight();
  const screenRef = useRef<ViewInstance>(null);
  const scrollRef = useRef<ScrollViewInstance>(null);
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
        {/* DEBUG_CENTER: only development and explicitly internal builds. */}
        {__DEV__ || process.env.EXPO_PUBLIC_APP_ENV === "internal" ? (
          <SettingsCard>
            <SettingsTitle>デバッグ</SettingsTitle>
            <Text style={styles.tutorialDescription}>
              会話の確認・短縮タイマー・テストデータの操作をまとめて行えます。
            </Text>
            <PrimaryButton
              title="デバッグ画面"
              onPress={() => push("/debug")}
            />
          </SettingsCard>
        ) : null}

        <UserSettings editor={userSettings} onRevealInput={revealInput} />
        <DefaultTimerSettings />
        <NotificationSettings />
        <SettingsCard>
          <SettingsTitle>チュートリアル</SettingsTitle>
          <Text style={styles.tutorialDescription}>
            タイマーの使い方をもう一度練習できます。練習ではNT・記録は増えません。
          </Text>
          <PrimaryButton
            title="はじめる"
            accessibilityLabel="チュートリアルをもう一度行う"
            onPress={replay}
          />
        </SettingsCard>
      </ScrollView>
      <UserSettingsToolbar editor={userSettings} bottom={toolbarBottom} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 24 },
  tutorialDescription: {
    color: "#FFFFFF",
    fontFamily: Fonts.regular,
    lineHeight: 22,
  },
  title: { color: "#FFFFFF", fontFamily: Fonts.bold, fontSize: 24 },
});

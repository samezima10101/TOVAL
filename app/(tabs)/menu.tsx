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
import { useTutorial } from "@/src/tutorial/TutorialContext";
import PrimaryButton from "@/src/components/common/PrimaryButton";
import { SettingsCard, SettingsTitle } from "@/src/components/menu/SettingsLayout";

// DEBUG_STORY_PREVIEW: 削除時はこのブロックと下の表示行、専用ファイルを削除する。
const DebugStoryPreview: import("react").ComponentType | null = __DEV__
  ? // 開発時だけ読み込み、本番バンドルから依存ごと除外する。
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("@/src/debug/StoryPreview").default
  : null;

export default function MenuScreen() {
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
        <SettingsCard>
          <SettingsTitle>チュートリアル</SettingsTitle>
          <Text style={styles.tutorialDescription}>
            タイマーの使い方をもう一度練習できます。練習ではNT・記録は増えません。
          </Text>
          <PrimaryButton
            title="もう一度練習する"
            accessibilityLabel="チュートリアルをもう一度行う"
            onPress={replay}
          />
        </SettingsCard>
        <AudioSettings />
        <UserSettings editor={userSettings} onRevealInput={revealInput} />
        <DefaultTimerSettings />
        <NotificationSettings />
        {/* DEBUG_STORY_PREVIEW */}
        {DebugStoryPreview ? <DebugStoryPreview /> : null}
      </ScrollView>
      <UserSettingsToolbar editor={userSettings} bottom={toolbarBottom} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 24 },
  tutorialDescription: { color: "#FFFFFF", fontFamily: Fonts.regular, lineHeight: 22 },
  title: { color: "#FFFFFF", fontFamily: Fonts.bold, fontSize: 24 },
});

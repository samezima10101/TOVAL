import { useFocusEffect } from "expo-router";
import { type Dispatch, type SetStateAction, useCallback } from "react";
import {
  AccessibilityInfo,
  LayoutAnimation,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AudioSettings from "@/src/components/menu/AudioSettings";
import { Fonts } from "@/src/constants/theme";
import { useTutorial } from "@/src/tutorial/TutorialContext";

export default function HeaderAudioMenu({ expanded, onExpandedChange }: {
  expanded: boolean;
  onExpandedChange: Dispatch<SetStateAction<boolean>>;
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tutorial = useTutorial();

  useFocusEffect(useCallback(() => () => onExpandedChange(false), [onExpandedChange]));

  return (
    <View style={styles.anchor} pointerEvents="box-none">
      <Pressable
        style={({ pressed }) => [styles.button, (pressed || expanded) && styles.selected]}
        onPress={async () => {
          const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled().catch(() => true);
          if (!reduceMotion) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          }
          onExpandedChange((current) => !current);
        }}
        disabled={tutorial.active}
        accessibilityRole="button"
        accessibilityLabel="音声設定"
        accessibilityHint={expanded ? "タップして閉じます" : "タップして下に開きます"}
        accessibilityState={{ expanded, disabled: tutorial.active }}
      >
        <View style={styles.lines} accessible={false}>
          <View style={styles.line} />
          <View style={styles.line} />
          <View style={styles.line} />
        </View>
      </Pressable>
      <ScrollView
        style={[styles.panel, {
          display: expanded ? "flex" : "none",
          width: Math.min(288, width - insets.left - insets.right - 32),
          maxHeight: Math.max(44, height - insets.top - insets.bottom - 168),
        }]}
        contentContainerStyle={styles.content}
        bounces={false}
        keyboardShouldPersistTaps="handled"
        accessibilityLabel="音声設定パネル"
      >
        <Text style={styles.title} accessibilityRole="header">音声設定</Text>
        <AudioSettings active={expanded} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Overlap the 76-point NT row while keeping the expanded panel inside hit-test bounds.
  anchor: {
    marginTop: -76,
    minHeight: 76,
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: "flex-end",
    gap: 8,
    overflow: "hidden",
  },
  button: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "rgba(10,20,42,0.45)",
  },
  selected: { backgroundColor: "rgba(70,105,160,0.85)" },
  lines: { gap: 5 },
  line: { width: 24, height: 2, backgroundColor: "#FFFFFF", borderRadius: 1 },
  panel: {
    backgroundColor: "rgba(15,25,48,0.97)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
    borderRadius: 10,
  },
  content: { padding: 16, gap: 16 },
  title: { color: "#FFFFFF", fontFamily: Fonts.bold, fontSize: 16 },
});

import { type ReactNode } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import FileTextboxBackground from "@/src/components/common/FileTextboxBackground";
import { Fonts } from "@/src/constants/theme";
import type { StoryLine } from "@/src/domain/common/types";
import {
  STORY_CHARACTER_BY_SPEAKER,
  STORY_CHARACTER_NAMES,
} from "@/src/domain/storyData";

type StoryMessageProps = {
  line: Pick<StoryLine, "speaker" | "text"> | undefined;
  visibleText: string;
  isTyping: boolean;
  isLastLine: boolean;
  isProcessing: boolean;
  handleNext: () => void;
};

type StoryMessageBoxProps = {
  children: ReactNode;
  contentKey?: string;
  inFlow?: boolean;
  speaker?: StoryLine["speaker"];
  speakerName?: string;
};

export function StoryMessage({
  line,
  visibleText,
  isTyping,
  isLastLine,
  isProcessing,
  handleNext,
}: StoryMessageProps) {
  if (!line) return null;
  return (
    <TouchableOpacity
      style={[styles.messageBox, isProcessing && styles.messageBoxDisabled]}
      onPress={handleNext}
      disabled={isProcessing}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={
        isTyping
          ? "セリフを全文表示"
          : isLastLine
            ? "ストーリーを読み終える"
            : "次のセリフへ進む"
      }
      accessibilityHint={`現在のセリフ: ${line.text}`}
      accessibilityState={{ disabled: isProcessing }}
    >
      <Text style={styles.messageText}>{visibleText}</Text>
      <Text style={styles.tapPrompt}>▼</Text>
    </TouchableOpacity>
  );
}

export default function StoryMessageBox({
  children,
  contentKey,
  inFlow = false,
  speaker,
  speakerName,
}: StoryMessageBoxProps) {
  const name = speakerName ?? (speaker === undefined
    ? undefined
    : speaker === "system"
      ? "システム"
      : speaker === "both"
        ? "２人"
        : STORY_CHARACTER_NAMES[STORY_CHARACTER_BY_SPEAKER[speaker]]);
  return (
    <View style={inFlow ? styles.flowFrame : styles.frame}>
      <FileTextboxBackground />
      {name ? (
        <View style={styles.speakerTag} pointerEvents="none">
          <Text
            style={styles.speakerName}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.65}
            maxFontSizeMultiplier={1}
            accessibilityLabel={name}
          >
            {name}
          </Text>
        </View>
      ) : null}
      <ScrollView
        key={contentKey}
        style={styles.scrollViewport}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="never"
        bounces={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flowFrame: {
    height: 240,
    flexShrink: 1,
    minHeight: 0,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 18,
  },
  frame: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 60,
    height: 240,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 18,
  },
  scrollViewport: { flex: 1, minHeight: 0, overflow: "hidden" },
  content: { flexGrow: 1 },
  messageBox: { flexGrow: 1 },
  messageBoxDisabled: {
    opacity: 0.7,
  },
  // Keep the name inside the folder tab's 80.65-wide top and 19-high outline.
  speakerTag: {
    position: "absolute",
    left: 6,
    top: 0,
    width: 68,
    height: 19,
    justifyContent: "center",
  },
  speakerName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: Fonts.bold,
    lineHeight: 18,
    textAlign: "center",
    includeFontPadding: false,
  },
  messageText: {
    fontFamily: Fonts.medium,
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 23,
    flexGrow: 1,
  },
  tapPrompt: {
    marginTop: 10,
    textAlign: "right",
    color: "#FFFFFF",
    fontSize: 24,
    fontFamily: Fonts.bold,
  },
});

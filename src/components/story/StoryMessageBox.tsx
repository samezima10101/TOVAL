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
  speakerName?: string;
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
};

export function StoryMessage({
  line,
  speakerName,
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
      <Text style={styles.speakerName}>
        {speakerName ??
          (line.speaker === "both"
            ? `２人`
            : STORY_CHARACTER_NAMES[STORY_CHARACTER_BY_SPEAKER[line.speaker]])}
      </Text>
      <Text style={styles.messageText}>{visibleText}</Text>
      <Text style={styles.tapPrompt}>▼</Text>
    </TouchableOpacity>
  );
}

export default function StoryMessageBox({
  children,
  contentKey,
  inFlow = false,
}: StoryMessageBoxProps) {
  return (
    <View style={inFlow ? styles.flowFrame : styles.frame}>
      <FileTextboxBackground />
      <ScrollView
        key={contentKey}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="never"
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flowFrame: {
    height: 190,
    flexShrink: 1,
    minHeight: 0,
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 14,
  },
  frame: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 60,
    height: 210,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 18,
  },
  content: { flexGrow: 1 },
  messageBox: { flexGrow: 1 },
  messageBoxDisabled: {
    opacity: 0.7,
  },
  speakerName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: Fonts.bold,
    marginBottom: 10,
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

import { Image } from "expo-image";
import { type ReactNode } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Colors, Fonts } from "@/src/constants/theme";
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
          STORY_CHARACTER_NAMES[STORY_CHARACTER_BY_SPEAKER[line.speaker]]}
      </Text>
      <Text style={styles.messageText}>{visibleText}</Text>
      <Text style={styles.tapPrompt}>
        {isTyping
          ? "Tap to show all ▼"
          : isLastLine
            ? "Tap to close ▼"
            : "Tap to next ▼"}
      </Text>
    </TouchableOpacity>
  );
}

export default function StoryMessageBox({ children, contentKey }: StoryMessageBoxProps) {
  return (
    <View style={styles.frame}>
      <Image source={require("@/assets/images/file_textbox.svg")} style={StyleSheet.absoluteFill}
        contentFit="fill" pointerEvents="none" accessible={false} />
      <ScrollView key={contentKey} contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="never">
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { position: "absolute", left: 18, right: 18, bottom: 60, height: 210, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 18 },
  content: { flexGrow: 1 },
  messageBox: { flexGrow: 1 },
  messageBoxDisabled: {
    opacity: 0.7,
  },
  speakerName: {
    color: Colors.primary,
    fontSize: 18,
    fontFamily: Fonts.bold,
    marginBottom: 10,
  },
  messageText: {
    fontFamily: Fonts.medium,
    color: Colors.text,
    fontSize: 18,
    lineHeight: 30,
    flexGrow: 1,
  },
  tapPrompt: {
    marginTop: 10,
    textAlign: "right",
    color: Colors.textSub,
    fontSize: 13,
    fontFamily: Fonts.bold,
  },
});

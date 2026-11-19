import { type ReactNode } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import FileTextboxBackground, {
  FILE_TEXTBOX_HEADER_HEIGHT,
} from "@/src/components/common/FileTextboxBackground";
import StoryWindowBackground from "@/src/components/story/StoryWindowBackground";
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

function nextLabel(isTyping: boolean, isLastLine: boolean) {
  return isTyping
    ? "セリフを全文表示"
    : isLastLine
      ? "ストーリーを読み終える"
      : "次のセリフへ進む";
}

export function StoryNextButton({
  line,
  isTyping,
  isLastLine,
  isProcessing,
  handleNext,
}: StoryMessageProps) {
  if (!line) return null;
  return (
    <TouchableOpacity
      style={[styles.nextButton, isProcessing && styles.messageBoxDisabled]}
      onPress={handleNext}
      disabled={isProcessing}
      accessibilityRole="button"
      accessibilityLabel={nextLabel(isTyping, isLastLine)}
      accessibilityState={{ disabled: isProcessing }}
    >
      <Text style={styles.nextSymbol}>▼</Text>
    </TouchableOpacity>
  );
}

type StoryMessageBoxProps = {
  children: ReactNode;
  contentKey?: string;
  inFlow?: boolean;
  shape?: "folder" | "rectangle";
  speaker?: StoryLine["speaker"];
  speakerName?: string;
  footer?: ReactNode;
};

export function StoryMessage({
  line,
  visibleText,
  isTyping,
  isLastLine,
  isProcessing,
  handleNext,
  showPrompt = true,
}: StoryMessageProps & { showPrompt?: boolean }) {
  if (!line) return null;
  return (
    <TouchableOpacity
      style={[styles.messageBox, isProcessing && styles.messageBoxDisabled]}
      onPress={handleNext}
      disabled={isProcessing}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={nextLabel(isTyping, isLastLine)}
      accessibilityHint={`現在のセリフ: ${line.text}`}
      accessibilityState={{ disabled: isProcessing }}
    >
      <Text style={styles.messageText}>{visibleText}</Text>
      {showPrompt ? <Text style={styles.tapPrompt}>▼</Text> : null}
    </TouchableOpacity>
  );
}

export default function StoryMessageBox({
  children,
  contentKey,
  inFlow = false,
  shape = "folder",
  speaker,
  speakerName,
  footer,
}: StoryMessageBoxProps) {
  const rectangular = shape === "rectangle";
  const rightAlignedName =
    rectangular &&
    (speaker === "boss" || speaker === "sub") &&
    STORY_CHARACTER_BY_SPEAKER[speaker] === "alta";
  const name =
    speakerName ??
    (speaker === undefined
      ? undefined
      : speaker === "system"
        ? "システム"
        : speaker === "both"
          ? "２人"
          : STORY_CHARACTER_NAMES[STORY_CHARACTER_BY_SPEAKER[speaker]]);
  return (
    <View
      style={[
        inFlow ? styles.flowFrame : styles.frame,
        rectangular && styles.dialogueFrame,
      ]}
    >
      {rectangular ? (
        <StoryWindowBackground variant="dialogue" />
      ) : (
        <FileTextboxBackground />
      )}
      {name ? (
        <View
          style={rectangular ? styles.inlineSpeaker : styles.speakerTag}
          pointerEvents="none"
        >
          <Text
            style={[
              styles.speakerName,
              rectangular && styles.inlineSpeakerName,
              rightAlignedName && styles.inlineSpeakerNameRight,
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.65}
            maxFontSizeMultiplier={1}
            accessibilityLabel={name}
          >
            {rectangular ? `［ ${name} ］` : name}
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
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flowFrame: {
    height: 240,
    flexShrink: 1,
    minHeight: 0,
    paddingHorizontal: 22,
    marginTop: -0,
  },
  frame: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 60,
    height: 280,
    paddingHorizontal: 24,
    paddingTop: FILE_TEXTBOX_HEADER_HEIGHT + 24,
  },
  dialogueFrame: {
    paddingTop: 18,
    paddingBottom: 14,
  },
  scrollViewport: { flex: 1, minHeight: 0, overflow: "hidden" },
  content: { flexGrow: 1 },
  footer: { flexShrink: 0, marginTop: 8 },
  messageBox: { flexGrow: 1 },
  messageBoxDisabled: {
    opacity: 0.7,
  },
  // Keep the speaker outside the scrolling body, with room above and below.
  speakerTag: {
    position: "absolute",
    left: 6,
    top: 0,
    width: 68,
    height: FILE_TEXTBOX_HEADER_HEIGHT,
    justifyContent: "center",
  },
  inlineSpeaker: {
    flexShrink: 0,
    marginBottom: 12,
  },
  inlineSpeakerName: {
    fontSize: 18,
    lineHeight: 26,
    textAlign: "left",
  },
  inlineSpeakerNameRight: { textAlign: "right" },
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
    textAlign: "left",
    flexGrow: 1,
  },
  tapPrompt: {
    marginTop: 10,
    textAlign: "right",
    color: "#FFFFFF",
    fontSize: 24,
    fontFamily: Fonts.bold,
  },
  nextButton: {
    width: 44,
    height: 44,
    marginRight: -12,
    alignItems: "center",
    justifyContent: "center",
  },
  nextSymbol: {
    color: "#FFFFFF",
    fontSize: 18,
    lineHeight: 24,
    fontFamily: Fonts.bold,
    includeFontPadding: false,
  },
});

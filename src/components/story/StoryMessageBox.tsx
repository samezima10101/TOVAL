import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

import { Colors } from "@/src/constants/theme";
import type { Speaker } from "@/src/domain/common/types";
import {
    STORY_CHARACTER_BY_SPEAKER,
    STORY_CHARACTER_NAMES,
} from "@/src/domain/storyData";

type Props = {
  speaker: Speaker;
  text: string;
  isLastLine: boolean;
  isProcessing: boolean;
  onNext: () => void;
};

export default function StoryMessageBox({
  speaker,
  text,
  isLastLine,
  isProcessing,
  onNext,
}: Props) {
  return (
    <TouchableOpacity
      style={[styles.messageBox, isProcessing && styles.messageBoxDisabled]}
      onPress={onNext}
      disabled={isProcessing}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={
        isLastLine ? "ストーリーを読み終える" : "次のセリフへ進む"
      }
      accessibilityState={{ disabled: isProcessing }}
    >
      <Text style={styles.speakerName}>
        {STORY_CHARACTER_NAMES[STORY_CHARACTER_BY_SPEAKER[speaker]]}
      </Text>
      <Text style={styles.messageText}>{text}</Text>
      <Text style={styles.tapPrompt}>
        {isLastLine ? "Tap to close ▼" : "Tap to next ▼"}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  messageBox: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 16,
    borderWidth: 2,
    elevation: 4,
    margin: 18,
    minHeight: 190,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  messageBoxDisabled: {
    opacity: 0.7,
  },
  speakerName: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 10,
  },
  messageText: {
    color: Colors.text,
    fontSize: 18,
    lineHeight: 30,
  },
  tapPrompt: {
    bottom: 14,
    color: Colors.textSub,
    fontSize: 13,
    fontWeight: "700",
    position: "absolute",
    right: 18,
  },
});

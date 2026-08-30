import { useLocalSearchParams } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BackButton from "@/src/components/common/BackButton";
import StoryCharacters from "@/src/components/story/StoryCharacters";
import StoryMessageBox from "@/src/components/story/StoryMessageBox";
import { Colors } from "@/src/constants/theme";
import { EpisodeId } from "@/src/domain/common/types";
import { getStoryEpisode, isEpisodeId } from "@/src/domain/storyData";
import useStoryReader from "@/src/hooks/useStoryReader";
import { useAppState } from "@/src/state/AppStateProvider";

function parseEpisodeId(
  value: string | string[] | undefined,
): EpisodeId | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = raw ? Number(raw) : NaN;
  return isEpisodeId(parsed) ? parsed : null;
}

export default function StoryScreen() {
  const { state, markStoryRead } = useAppState();
  const params = useLocalSearchParams<{ episode?: string; source?: string }>();
  const episodeId = parseEpisodeId(params.episode);
  const source =
    params.source === "memory"
      ? "memory"
      : params.source === "home"
        ? "home"
        : "unlock";
  const episode = episodeId ? getStoryEpisode(episodeId) : undefined;
  const isUnlocked = Boolean(
    episodeId &&
    state?.unlockedStories.some((story) => story.episodeId === episodeId),
  );

  const { line, isLastLine, isProcessing, error, handleNext, handleClose } =
    useStoryReader(episode, source, (id) =>
      isEpisodeId(id) ? markStoryRead(id) : Promise.resolve(),
    );

  if (!episode || !isUnlocked) {
    return (
      <SafeAreaView style={styles.invalidContainer} edges={["top", "bottom"]}>
        <Text style={styles.invalidTitle}>このストーリーはまだ読めません</Text>
        <Text style={styles.invalidDescription}>
          メモリーから解放済みのストーリーを選んでください。
        </Text>
        <BackButton label="戻る" onPress={handleClose} />
      </SafeAreaView>
    );
  }

  if (!line) return null;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.episodeTitle} numberOfLines={2}>
          Episode {String(episode.id).padStart(2, "0")} {episode.title}
        </Text>
        <TouchableOpacity
          onPress={handleClose}
          style={styles.closeButton}
          disabled={isProcessing}
          accessibilityRole="button"
          accessibilityLabel="ストーリーを閉じる"
          accessibilityState={{ disabled: isProcessing }}
        >
          <Text style={styles.closeText}>閉じる</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <StoryCharacters
        leftExpression={line.left}
        rightExpression={line.right}
        activeSpeaker={line.speaker}
      />

      <StoryMessageBox
        speaker={line.speaker}
        text={line.text}
        isLastLine={isLastLine}
        isProcessing={isProcessing}
        onNext={handleNext}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    flex: 1,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  episodeTitle: {
    color: Colors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    marginRight: 10,
  },
  closeButton: {
    borderColor: Colors.border,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  closeText: {
    color: Colors.textSub,
    fontSize: 13,
    fontWeight: "700",
  },
  error: {
    backgroundColor: "#FFF1F0",
    borderColor: Colors.warning,
    borderRadius: 8,
    borderWidth: 1,
    color: Colors.warning,
    fontSize: 13,
    marginHorizontal: 18,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    textAlign: "center",
  },
  invalidContainer: {
    alignItems: "center",
    backgroundColor: Colors.background,
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  invalidTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  invalidDescription: {
    color: Colors.textSub,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
    textAlign: "center",
  },
  homeButton: {
    backgroundColor: Colors.accent,
    borderRadius: 24,
    marginTop: 22,
    paddingHorizontal: 30,
    paddingVertical: 13,
  },
  homeButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: "700",
  },
});

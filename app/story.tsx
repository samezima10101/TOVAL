import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import {
  getStoryEpisode,
  isEpisodeId,
  STORY_CHARACTER_BY_SPEAKER,
  STORY_CHARACTER_NAMES,
} from "@/src/domain/storyData";
import { EpisodeId, Expression, StoryCharacter } from "@/src/domain/types";
import { useAppState } from "@/src/state/AppStateProvider";

const faceAssets: Record<StoryCharacter, Record<Expression, ImageSourcePropType>> = {
  gem: {
    normal: require("@/assets/faces/G01-1.png"),
    talk: require("@/assets/faces/G01-2.png"),
    doubt: require("@/assets/faces/G01-2.png"),
  },
  alta: {
    normal: require("@/assets/faces/A01-1.png"),
    talk: require("@/assets/faces/A01-2.png"),
    doubt: require("@/assets/faces/A01-2.png"),
  },
};

function parseEpisodeId(value: string | string[] | undefined): EpisodeId | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = raw ? Number(raw) : NaN;
  return isEpisodeId(parsed) ? parsed : null;
}

export default function StoryScreen() {
  const { state } = useAppState();
  const params = useLocalSearchParams<{ episode?: string; source?: string }>();
  const episodeId = parseEpisodeId(params.episode);
  const source = params.source === "memory" ? "memory" : "unlock";
  const episode = episodeId ? getStoryEpisode(episodeId) : undefined;
  const isUnlocked = Boolean(
    episodeId && state?.unlockedStories.some((story) => story.episodeId === episodeId),
  );
  const [lineIndex, setLineIndex] = React.useState(0);

  React.useEffect(() => {
    setLineIndex(0);
  }, [episodeId]);

  if (!episode || !isUnlocked) {
    return (
      <SafeAreaView style={styles.invalidContainer} edges={["top", "bottom"]}>
        <Text style={styles.invalidTitle}>このストーリーはまだ読めません</Text>
        <Text style={styles.invalidDescription}>
          メモリーから解放済みのストーリーを選んでください。
        </Text>
        <TouchableOpacity
          onPress={() =>
            source === "memory" ? router.dismissTo("/memory") : router.replace("/")
          }
          style={styles.homeButton}
          accessibilityRole="button"
          accessibilityLabel="戻る"
        >
          <Text style={styles.homeButtonText}>戻る</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const line = episode.lines[lineIndex];
  const isLastLine = lineIndex === episode.lines.length - 1;
  const bossCharacter = STORY_CHARACTER_BY_SPEAKER.boss;
  const subCharacter = STORY_CHARACTER_BY_SPEAKER.sub;

  const handleNext = () => {
    if (isLastLine) {
      if (source === "memory") {
        router.dismissTo("/memory");
      } else {
        router.replace("/");
      }
      return;
    }
    setLineIndex((index) => index + 1);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.episodeTitle} numberOfLines={2}>
          Episode {String(episode.id).padStart(2, "0")}　{episode.title}
        </Text>
        <TouchableOpacity
          onPress={() =>
            source === "memory" ? router.dismissTo("/memory") : router.replace("/")
          }
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel="ストーリーを閉じる"
        >
          <Text style={styles.closeText}>閉じる</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.charactersContainer}>
        <Image
          source={faceAssets[bossCharacter][line.left]}
          style={[styles.characterImage, line.speaker === "boss" ? styles.activeCharacter : styles.inactiveCharacter]}
          resizeMode="contain"
          accessibilityLabel={STORY_CHARACTER_NAMES[bossCharacter]}
        />
        <Image
          source={faceAssets[subCharacter][line.right]}
          style={[styles.characterImage, line.speaker === "sub" ? styles.activeCharacter : styles.inactiveCharacter]}
          resizeMode="contain"
          accessibilityLabel={STORY_CHARACTER_NAMES[subCharacter]}
        />
      </View>

      <TouchableOpacity
        style={styles.messageBox}
        onPress={handleNext}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={isLastLine ? "ストーリーを読み終える" : "次のセリフへ進む"}
      >
        <Text style={styles.speakerName}>
          {STORY_CHARACTER_NAMES[STORY_CHARACTER_BY_SPEAKER[line.speaker]]}
        </Text>
        <Text style={styles.messageText}>{line.text}</Text>
        <Text style={styles.tapPrompt}>{isLastLine ? "Tap to close ▼" : "Tap to next ▼"}</Text>
      </TouchableOpacity>
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
  charactersContainer: {
    alignItems: "flex-end",
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    minHeight: 240,
  },
  characterImage: {
    height: "88%",
    width: "50%",
  },
  activeCharacter: {
    opacity: 1,
  },
  inactiveCharacter: {
    opacity: 0.42,
  },
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

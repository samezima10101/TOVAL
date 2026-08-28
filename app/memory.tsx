import { router } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import BackButton from "@/src/components/common/BackButton";
import { Colors } from "@/src/constants/theme";
import { formatLocalDate } from "@/src/domain/common/date";
import { STORY_EPISODES } from "@/src/domain/storyData";
import { useAppState } from "@/src/state/AppStateProvider";

export default function MemoryScreen() {
  const { state } = useAppState();

  if (!state) {
    return null;
  }

  const unlocked = new Map(
    state.unlockedStories.map((story) => [story.episodeId, story.unlockedDate]),
  );
  const allUnlocked = unlocked.size === STORY_EPISODES.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>メモリー</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.intro}>
          解放したストーリーを、いつでも読み返せます。
        </Text>
        {allUnlocked ? (
          <View style={styles.completeBanner}>
            <Text style={styles.completeText}>すべて解放済み</Text>
          </View>
        ) : null}
        {STORY_EPISODES.map((episode) => {
          const unlockedDate = unlocked.get(episode.id);
          const isUnlocked = Boolean(unlockedDate);
          return (
            <View
              key={episode.id}
              style={[
                styles.card,
                isUnlocked ? styles.unlockedCard : styles.lockedCard,
              ]}
            >
              <View style={styles.cardContent}>
                <Text
                  style={[styles.episodeNum, !isUnlocked && styles.lockedText]}
                >
                  Episode {String(episode.id).padStart(2, "0")}
                </Text>
                <Text
                  style={[
                    styles.episodeTitle,
                    !isUnlocked && styles.lockedText,
                  ]}
                >
                  {isUnlocked ? episode.title : "未解放のストーリー"}
                </Text>
                <Text style={styles.unlockDate}>
                  {isUnlocked && unlockedDate
                    ? `解放日: ${formatLocalDate(unlockedDate)}`
                    : "タスク完了で解放"}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.playButton,
                  !isUnlocked && styles.lockedPlayButton,
                ]}
                disabled={!isUnlocked}
                onPress={() =>
                  router.push({
                    pathname: "/story",
                    params: { episode: String(episode.id), source: "memory" },
                  })
                }
                accessibilityRole="button"
                accessibilityLabel={
                  isUnlocked ? `${episode.title}を再生` : "未解放"
                }
                accessibilityState={{ disabled: !isUnlocked }}
              >
                <Text style={styles.playButtonText}>
                  {isUnlocked ? "▶ 再生" : "🔒"}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    flex: 1,
  },
  header: {
    alignItems: "center",
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 19,
    fontWeight: "800",
  },
  headerSpacer: {
    width: 62,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 34,
  },
  intro: {
    color: Colors.textSub,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  completeBanner: {
    backgroundColor: "#E7F7ED",
    borderColor: Colors.accent,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
    padding: 12,
  },
  completeText: {
    color: Colors.accent,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  card: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
    padding: 15,
  },
  unlockedCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.primary,
  },
  lockedCard: {
    backgroundColor: "#EEF1F5",
    borderColor: Colors.border,
    opacity: 0.72,
  },
  cardContent: {
    flex: 1,
    paddingRight: 12,
  },
  episodeNum: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 5,
  },
  episodeTitle: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 24,
  },
  lockedText: {
    color: Colors.textSub,
  },
  unlockDate: {
    color: Colors.textSub,
    fontSize: 12,
    marginTop: 7,
  },
  playButton: {
    alignItems: "center",
    backgroundColor: Colors.primary,
    borderRadius: 32,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  lockedPlayButton: {
    backgroundColor: Colors.border,
  },
  playButtonText: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: "800",
  },
});

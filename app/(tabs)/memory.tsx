import useGuardedPush from "@/src/hooks/useGuardedPush";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import StoryListCard from "@/src/components/common/StoryListCard";
import StoryListHeader from "@/src/components/common/StoryListHeader";
import { Colors, Fonts } from "@/src/constants/theme";
import { formatLocalDate } from "@/src/domain/common/date";
import { STORY_EPISODES } from "@/src/domain/storyData";
import { useAppState } from "@/src/state/AppStateProvider";

export default function MemoryScreen() {
  const push = useGuardedPush();
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
      <StoryListHeader title="メモリー" />

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
            <StoryListCard
              key={episode.id}
              label={`Episode ${String(episode.id).padStart(2, "0")}`}
              title={isUnlocked ? episode.title : "未解放のストーリー"}
              detail={
                isUnlocked && unlockedDate
                  ? `解放日: ${formatLocalDate(unlockedDate)}`
                  : "タスク完了で解放"
              }
              isUnlocked={isUnlocked}
              action={isUnlocked ? "▶ 再生" : "🔒"}
              actionLabel={isUnlocked ? `${episode.title}を再生` : "未解放"}
              disabled={!isUnlocked}
              onPress={() =>
                push({
                  pathname: "/story",
                  params: { episode: String(episode.id), source: "memory" },
                })
              }
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.background, flex: 1 },
  scrollContainer: { padding: 20, paddingBottom: 34 },
  intro: {
    fontFamily: Fonts.regular,
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
    fontFamily: Fonts.bold,
    textAlign: "center",
  },
});

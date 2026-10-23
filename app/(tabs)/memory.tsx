import useGuardedPush from "@/src/hooks/useGuardedPush";
import { useBottomTabBarHeight } from "expo-router/js-tabs";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ScreenBackground from "@/src/components/common/ScreenBackground";
import StoryArchive, {
  type StoryArchiveChapter,
} from "@/src/components/common/StoryArchive";
import { MEMORY_CHAPTERS } from "@/src/config/storyArchive";
import { formatLocalDate } from "@/src/domain/common/date";
import { isStoryRouteUnlocked, STORY_EPISODES } from "@/src/domain/storyData";
import { useAppState } from "@/src/state/AppStateProvider";

export default function MemoryScreen() {
  const { top } = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const push = useGuardedPush();
  const { state } = useAppState();

  if (!state) {
    return null;
  }

  const unlocked = new Map(
    state.unlockedStories.map((story) => [story.episodeId, story.unlockedDate]),
  );
  const allUnlocked = unlocked.size === STORY_EPISODES.length;
  const chapters: StoryArchiveChapter[] = MEMORY_CHAPTERS.map((chapter) => ({
    id: chapter.id,
    title: chapter.title,
    emptyLabel: "準備中",
    items: chapter.storyIds.flatMap((id, index) => {
      const episode = STORY_EPISODES.find((entry) => entry.id === id);
      if (!episode) return [];
      const unlockedDate = unlocked.get(id);
      const isUnlocked = Boolean(unlockedDate);
      const unlockedRoutes =
        episode.routes?.filter((route) =>
          isStoryRouteUnlocked(state.storyRouteProgress[id], route.id),
        ).length ?? 0;
      return [
        {
          id,
          number: index + 1,
          title: isUnlocked ? episode.title : "未解放のストーリー",
          description: isUnlocked
            ? (episode.commonBefore[0]?.text ?? "")
            : "その日の最初のタスクを完了すると、次のストーリーが解放されます。",
          status: unlockedDate
            ? `解放日: ${formatLocalDate(unlockedDate)}`
            : "タスク完了で解放",
          metadata: [
            `ROUTE UNLOCK: ${unlockedRoutes}/${episode.routes?.length ?? 0}`,
            `OPEN: ${unlockedDate?.replaceAll("-", ".") ?? "--"}`,
          ],
          isUnlocked,
          action: isUnlocked ? "再生する" : "未解放",
          actionLabel: isUnlocked
            ? `${episode.title}を再生`
            : "未解放のストーリー",
          disabled: !isUnlocked,
          onPress: () =>
            push({
              pathname: "/story",
              params: { episode: String(id), source: "memory" },
            }),
        },
      ];
    }),
  }));

  return (
    <View style={styles.container}>
      <ScreenBackground source={require("@/assets/bg/starry-bg.png")} />
      <StoryArchive
        chapters={chapters}
        variant="memory"
        topInset={top + 76}
        bottomInset={tabBarHeight}
        completeLabel={allUnlocked ? "すべて解放済み" : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});

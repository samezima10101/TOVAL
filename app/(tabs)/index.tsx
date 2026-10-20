import useGuardedPush from "@/src/hooks/useGuardedPush";
import { router } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import PrimaryButton from "@/src/components/common/PrimaryButton";
import HomeStoryCard from "@/src/components/home/HomeStoryCard";
import TaskNameModal from "@/src/components/home/TaskNameModal";
import TimerSetupModal from "@/src/components/home/TimerSetupModal";
import { Colors, Fonts } from "@/src/constants/theme";
import {
  getLatestUnlockedEpisode,
  STORY_CATALOG,
} from "@/src/domain/storyData";
import useLocalToday from "@/src/hooks/useLocalToday";
import { useAppState } from "@/src/state/AppStateProvider";

export default function HomeScreen() {
  const push = useGuardedPush();
  const { state, setTaskName, startTimer } = useAppState();
  const [isTimerSetupOpen, setIsTimerSetupOpen] = React.useState(false);
  const today = useLocalToday();

  if (!state) {
    return null;
  }

  const completedToday = state.lastCompletionDate === today;
  const unlockedCount = state.unlockedStories.length;
  const nextEpisode = STORY_CATALOG.episodes.find(
    (episode) =>
      !state.unlockedStories.some((story) => story.episodeId === episode.id),
  );
  const latestUnlockedEpisode = getLatestUnlockedEpisode(state.unlockedStories);
  const needsTask = state.taskName.trim().length === 0;

  const handleStartTimer = async (plannedSeconds: number) => {
    await startTimer(plannedSeconds);
    setIsTimerSetupOpen(false);
    push("/timer");
  };

  const handleResumeTimer = () => {
    setIsTimerSetupOpen(false);
    push("/timer");
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <HomeStoryCard
          latestUnlockedEpisode={latestUnlockedEpisode}
          onOpenShop={() => router.navigate("/shop")}
        />

        <View style={styles.intro}>
          <Text style={styles.eyebrow}>TODAY&apos;S TASK</Text>
          <Text style={styles.taskName}>
            {state.taskName || "タスクを設定してください"}
          </Text>
          <View style={styles.statusRow}>
            <View
              style={[styles.statusDot, completedToday && styles.statusDotDone]}
            />
            <Text style={styles.statusText}>
              {completedToday ? "今日のタスクは完了" : "今日は未完了"}
            </Text>
          </View>
        </View>

        <View style={styles.statsCard}>
          <Stat label="累計完了" value={`${state.totalCompletions}回`} />
          <Stat
            label="ストーリー"
            value={`${unlockedCount} / ${STORY_CATALOG.episodes.length}話`}
          />
          <Stat label="現在のNT" value={`${state.totalNt} NT`} />
        </View>

        {state.activeTimer ? (
          <TouchableOpacity
            style={styles.activeBanner}
            onPress={handleResumeTimer}
            accessibilityRole="button"
            accessibilityLabel="進行中のタイマーを再開"
          >
            <View style={styles.activeCopy}>
              <Text style={styles.activeTitle}>タイマー進行中</Text>
              <Text style={styles.activeDescription} numberOfLines={2}>
                {state.activeTimer.startedTaskName} — タップして再開
              </Text>
            </View>
            <Text style={styles.activeArrow}>›</Text>
          </TouchableOpacity>
        ) : null}

        <PrimaryButton
          title="集中モードを開始"
          onPress={() => setIsTimerSetupOpen(true)}
          disabled={needsTask}
          style={styles.startButton}
          accessibilityLabel="集中モードの時間を設定"
        />

        <View style={styles.links}>
          <TouchableOpacity
            onPress={() => router.navigate("/memory")}
            style={styles.linkButton}
            accessibilityRole="button"
            accessibilityLabel="メモリーを開く"
          >
            <Text style={styles.linkText}>📖 メモリーを見る</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.navigate("/log")}
            style={styles.linkButton}
            accessibilityRole="button"
            accessibilityLabel="ログを開く"
          >
            <Text style={styles.linkText}>📅 ログを見る</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.storyProgress}>
          <Text style={styles.storyProgressTitle}>STORY PROGRESS</Text>
          <Text style={styles.storyProgressText}>
            {!nextEpisode
              ? "すべて解放済み"
              : completedToday
                ? "今日は解放済みです。明日の初回完了で次の会話を解放できます"
                : `今日の初回完了で ${nextEpisode.id}話目を解放できます`}
          </Text>
        </View>
      </ScrollView>

      <TaskNameModal
        visible={needsTask}
        required
        initialValue={state.taskName}
        onClose={() => undefined}
        onSave={setTaskName}
      />
      <TimerSetupModal
        visible={isTimerSetupOpen}
        hasActiveTimer={Boolean(state.activeTimer)}
        onClose={() => setIsTimerSetupOpen(false)}
        onStart={handleStartTimer}
        onResume={handleResumeTimer}
      />
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  intro: {
    paddingTop: 20,
  },
  eyebrow: {
    color: Colors.textSub,
    fontSize: 13,
    fontFamily: Fonts.bold,
    letterSpacing: 1.4,
  },
  taskName: {
    color: Colors.primary,
    fontSize: 30,
    fontFamily: Fonts.pixel,
    marginTop: 8,
  },
  statusRow: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: 14,
  },
  statusDot: {
    backgroundColor: Colors.border,
    borderRadius: 5,
    height: 10,
    marginRight: 8,
    width: 10,
  },
  statusDotDone: {
    backgroundColor: Colors.accent,
  },
  statusText: {
    color: Colors.textSub,
    fontSize: 15,
    fontFamily: Fonts.pixel,
  },
  statsCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
    paddingHorizontal: 14,
    paddingVertical: 18,
  },
  stat: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    color: Colors.text,
    fontSize: 17,
    fontFamily: Fonts.bold,
  },
  statLabel: {
    fontFamily: Fonts.regular,
    color: Colors.textSub,
    fontSize: 12,
    marginTop: 4,
  },
  activeBanner: {
    alignItems: "center",
    backgroundColor: "#E7F7ED",
    borderColor: Colors.accent,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  activeCopy: {
    flex: 1,
  },
  activeTitle: {
    color: Colors.text,
    fontSize: 15,
    fontFamily: Fonts.bold,
  },
  activeDescription: {
    fontFamily: Fonts.regular,
    color: Colors.textSub,
    fontSize: 13,
    marginTop: 3,
  },
  activeArrow: {
    fontFamily: Fonts.regular,
    color: Colors.accent,
    fontSize: 30,
    marginLeft: 10,
  },
  startButton: {
    marginTop: 26,
    width: "100%",
  },
  links: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 18,
  },
  linkButton: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  linkText: {
    color: Colors.textSub,
    fontSize: 14,
    fontFamily: Fonts.bold,
  },
  storyProgress: {
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    marginTop: 26,
    paddingTop: 20,
  },
  storyProgressTitle: {
    color: Colors.textSub,
    fontSize: 12,
    fontFamily: Fonts.bold,
    letterSpacing: 1.2,
  },
  storyProgressText: {
    fontFamily: Fonts.pixel,
    color: Colors.text,
    fontSize: 15,
    marginTop: 7,
  },
});

import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import PrimaryButton from "@/components/PrimaryButton";
import StoryCharacters from "@/components/StoryCharacters";
import TaskNameModal from "@/components/TaskNameModal";
import TimerSetupModal from "@/components/TimerSetupModal";
import { Colors } from "@/constants/theme";
import { todayKey } from "@/src/domain/date";
import { getLatestUnlockedEpisode } from "@/src/domain/storyData";
import { useAppState } from "@/src/state/AppStateProvider";

export default function HomeScreen() {
  const { state, setTaskName, startTimer } = useAppState();
  const [isEditingTask, setIsEditingTask] = React.useState(false);
  const [isTimerSetupOpen, setIsTimerSetupOpen] = React.useState(false);

  if (!state) {
    return null;
  }

  const completedToday = state.lastCompletionDate === todayKey();
  const unlockedCount = state.unlockedStories.length;
  const latestUnlockedEpisode = getLatestUnlockedEpisode(state.unlockedStories);
  const needsTask = state.taskName.trim().length === 0;

  const handleStartTimer = async (plannedSeconds: number) => {
    await startTimer(plannedSeconds);
    setIsTimerSetupOpen(false);
    router.push("/timer");
  };

  const handleResumeTimer = () => {
    setIsTimerSetupOpen(false);
    router.push("/timer");
  };

  const handleOpenTalk = () => {
    if (!latestUnlockedEpisode) {
      return;
    }

    router.push({
      pathname: "/story",
      params: { episode: String(latestUnlockedEpisode.id), source: "home" },
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.storyCard}>
          <View style={styles.storyCardHeader}>
            <View style={styles.storyCardCopy}>
              <Text style={styles.storyCardEyebrow}>STORY TALK</Text>
              <Text style={styles.storyCardTitle}>
                {latestUnlockedEpisode
                  ? "解放された会話を読む"
                  : "今日も一緒に集中"}
              </Text>
            </View>
            {latestUnlockedEpisode ? (
              <TouchableOpacity
                onPress={handleOpenTalk}
                style={styles.talkButton}
                accessibilityRole="button"
                accessibilityLabel={`${latestUnlockedEpisode.title}を読む`}
                accessibilityHint="解放済みのストーリーを開きます"
              >
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={29}
                  color={Colors.surface}
                />
              </TouchableOpacity>
            ) : null}
          </View>

          <StoryCharacters containerStyle={styles.homeCharacters} />

          <View style={styles.storyCardFooter}>
            <Text style={styles.storyCardDescription}>
              {latestUnlockedEpisode
                ? `Episode ${String(latestUnlockedEpisode.id).padStart(2, "0")}　${latestUnlockedEpisode.title}`
                : "キャラクターたちが、ここで待っています。"}
            </Text>
            {latestUnlockedEpisode ? (
              <Text style={styles.storyCardHint}>
                吹き出しをタップして会話を読む
              </Text>
            ) : null}
          </View>
        </View>

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
          <Stat label="ストーリー" value={`${unlockedCount} / 3話`} />
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
            onPress={() => setIsEditingTask(true)}
            style={styles.linkButton}
            accessibilityRole="button"
            accessibilityLabel="タスク名を編集"
          >
            <Text style={styles.linkText}>タスクを編集</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/memory")}
            style={styles.linkButton}
            accessibilityRole="button"
            accessibilityLabel="メモリーを開く"
          >
            <Text style={styles.linkText}>📖 メモリーを見る</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/log")}
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
            {unlockedCount === 3
              ? "すべて解放済み"
              : `次の完了で ${unlockedCount + 1}話目を解放できます`}
          </Text>
        </View>
      </ScrollView>

      <TaskNameModal
        visible={needsTask || isEditingTask}
        required={needsTask}
        initialValue={state.taskName}
        onClose={() => setIsEditingTask(false)}
        onSave={async (taskName) => {
          await setTaskName(taskName);
          setIsEditingTask(false);
        }}
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
  container: {
    backgroundColor: Colors.background,
    flex: 1,
  },
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
    fontWeight: "700",
    letterSpacing: 1.4,
  },
  taskName: {
    color: Colors.primary,
    fontSize: 30,
    fontWeight: "800",
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
    fontWeight: "600",
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
  storyCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 22,
    overflow: "hidden",
  },
  storyCardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  storyCardCopy: {
    flex: 1,
    paddingRight: 14,
  },
  storyCardEyebrow: {
    color: Colors.textSub,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  storyCardTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 5,
  },
  talkButton: {
    alignItems: "center",
    backgroundColor: Colors.primary,
    borderRadius: 30,
    elevation: 3,
    height: 58,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    width: 58,
  },
  homeCharacters: {
    flex: 0,
    height: 220,
    marginTop: 2,
    minHeight: 0,
  },
  storyCardFooter: {
    backgroundColor: "#F8FAFD",
    borderTopColor: Colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  storyCardDescription: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  storyCardHint: {
    color: Colors.textSub,
    fontSize: 12,
    marginTop: 4,
  },
  stat: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: "800",
  },
  statLabel: {
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
    fontWeight: "800",
  },
  activeDescription: {
    color: Colors.textSub,
    fontSize: 13,
    marginTop: 3,
  },
  activeArrow: {
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
    fontWeight: "700",
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
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  storyProgressText: {
    color: Colors.text,
    fontSize: 15,
    marginTop: 7,
  },
});

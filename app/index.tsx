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
import CoachMark, { tutorialStyles } from "@/src/components/tutorial/CoachMark";
import { Colors } from "@/src/constants/theme";
import { todayKey } from "@/src/domain/common/date";
import {
  getLatestUnlockedEpisode,
  getLatestUnreadEpisode,
} from "@/src/domain/storyData";
import { useAppState } from "@/src/state/AppStateProvider";

export default function HomeScreen() {
  const { state, setTaskName, startTimer, advanceTutorial } = useAppState();
  const [isEditingTask, setIsEditingTask] = React.useState(false);
  const [isTimerSetupOpen, setIsTimerSetupOpen] = React.useState(false);
  const [talkError, setTalkError] = React.useState<string | null>(null);
  const talkBusy = React.useRef(false);

  if (!state) {
    return null;
  }

  const completedToday = state.lastCompletionDate === todayKey();
  const unlockedCount = state.unlockedStories.length;
  const latestUnlockedEpisode = getLatestUnlockedEpisode(state.unlockedStories);
  const latestUnreadEpisode = getLatestUnreadEpisode(state.unlockedStories);
  const needsTask = state.taskName.trim().length === 0;
  const step = state.tutorialStep;
  const isTutorial = Boolean(step && step !== "complete");
  const navigationAllowed = !isTutorial;

  const handleStartTimer = async (plannedSeconds: number) => {
    await startTimer(plannedSeconds);
    setIsTimerSetupOpen(false);
    if (step !== "start") router.push("/timer");
  };

  const handleResumeTimer = () => {
    setIsTimerSetupOpen(false);
    router.push("/timer");
  };

  const handleOpenTalk = async () => {
    if (!latestUnreadEpisode || talkBusy.current) {
      return;
    }
    talkBusy.current = true;
    setTalkError(null);
    try {
      if (step === "talk") {
        // TutorialNavigation performs the route change after the save succeeds.
        await advanceTutorial();
      } else {
        router.push({ pathname: "/story", params: { episode: String(latestUnreadEpisode.id), source: "home" } });
      }
    } catch (cause) {
      setTalkError(cause instanceof Error ? cause.message : "ストーリーを開けませんでした。");
    } finally { talkBusy.current = false; }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {step === "navigation" ? <CoachMark title="ホームのボタン" text="メモリーでは読んだストーリー、ログでは日記と集中記録を確認できます。ショップでは会話を購入できます。今はボタンを押さず、説明を読んで次へ進みましょう。" onNext={advanceTutorial} /> : null}
        {step === "talk" ? <CoachMark title="新しいストーリー" text="タスクを終えると新しい会話が届きます。下の吹き出しを押して、第1話を読んでみましょう。" /> : null}
        {talkError ? <Text accessibilityRole="alert">{talkError}</Text> : null}
        <View style={step === "talk" ? tutorialStyles.target : undefined}>
        <HomeStoryCard
          latestUnlockedEpisode={latestUnlockedEpisode}
          unreadEpisode={latestUnreadEpisode}
          onOpenTalk={() => { void handleOpenTalk(); }}
          onOpenShop={() => router.push("/shop")}
          talkDisabled={isTutorial && step !== "talk"}
          shopDisabled={!navigationAllowed}
        />
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

        {step === "start" ? <CoachMark title="タイマーを開始" text="下の「集中モードを開始」を押して、集中する時間を設定しましょう。" /> : null}
        <PrimaryButton
          title="集中モードを開始"
          onPress={() => setIsTimerSetupOpen(true)}
          disabled={needsTask || (isTutorial && step !== "start")}
          style={step === "start" ? { ...styles.startButton, ...tutorialStyles.target } : styles.startButton}
          accessibilityLabel="集中モードの時間を設定"
        />

        <View style={[styles.links, step === "navigation" && tutorialStyles.target]}>
          <TouchableOpacity
            onPress={() => setIsEditingTask(true)}
            disabled={!navigationAllowed}
            style={styles.linkButton}
            accessibilityRole="button"
            accessibilityLabel="タスク名を編集"
          >
            <Text style={styles.linkText}>タスクを編集</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/memory")}
            disabled={!navigationAllowed}
            style={styles.linkButton}
            accessibilityRole="button"
            accessibilityLabel="メモリーを開く"
          >
            <Text style={styles.linkText}>📖 メモリーを見る</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/log")}
            disabled={!navigationAllowed}
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
        visible={!isTutorial && (needsTask || isEditingTask)}
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
        tutorial={step === "start"}
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

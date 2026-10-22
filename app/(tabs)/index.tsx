import useGuardedPush from "@/src/hooks/useGuardedPush";
import { Image } from "expo-image";
import { useBottomTabBarHeight } from "expo-router/js-tabs";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PrimaryButton from "@/src/components/common/PrimaryButton";
import ScreenBackground from "@/src/components/common/ScreenBackground";
import TaskNameModal from "@/src/components/home/TaskNameModal";
import TimerSetupModal from "@/src/components/home/TimerSetupModal";
import { Colors, Fonts } from "@/src/constants/theme";
import { getTodaysStoryEpisode, STORY_CATALOG } from "@/src/domain/storyData";
import useLocalToday from "@/src/hooks/useLocalToday";
import { useAppState } from "@/src/state/AppStateProvider";

export default function HomeScreen() {
  const { top } = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const push = useGuardedPush();
  const { state, setTaskName, startTimer } = useAppState();
  const [isTimerSetupOpen, setIsTimerSetupOpen] = React.useState(false);
  const today = useLocalToday();

  if (!state) {
    return null;
  }

  const completedToday = state.lastCompletionDate === today;
  const todaysEpisode = getTodaysStoryEpisode(state.unlockedStories, today);
  const episodeUnlocked = state.unlockedStories.some(
    (story) => story.episodeId === todaysEpisode?.id,
  );
  const episodeLabel = episodeUnlocked
    ? STORY_CATALOG.episodes.every((episode) =>
        state.unlockedStories.some((story) => story.episodeId === episode.id),
      )
      ? "全話解放済み"
      : "今日解放したエピソード"
    : "今日解放できるエピソード";
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
      <ScreenBackground source={require("@/assets/bg/primary-bg.png")} />
      <View
        style={[
          styles.content,
          { paddingTop: top + 76 + 12, paddingBottom: tabBarHeight + 12 },
        ]}
      >
        <View style={styles.details}>
          <View style={styles.taskRow}>
            <View style={styles.intro}>
              <Text style={styles.eyebrow} numberOfLines={1} maxFontSizeMultiplier={1.2}>
                TODAY&apos;S TASK
              </Text>
              <Text
                style={styles.taskName}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.65}
                maxFontSizeMultiplier={1.2}
              >
                {state.taskName || "タスクを設定してください"}
              </Text>
              <View style={styles.statusRow}>
                <View
                  style={[styles.statusDot, completedToday && styles.statusDotDone]}
                />
                <Text
                  style={styles.statusText}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  maxFontSizeMultiplier={1.2}
                >
                  {completedToday ? "今日のタスクは完了" : "今日は未完了"}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => push("/shop")}
              accessibilityRole="button"
              accessibilityLabel="ショップを開く"
            >
              <Image
                source={require("@/assets/images/footer_unknown.svg")}
                style={styles.shopIcon}
                contentFit="contain"
              />
            </TouchableOpacity>
          </View>

          {todaysEpisode ? (
            <View accessible>
              <Text style={styles.episodeLabel} numberOfLines={1} maxFontSizeMultiplier={1.2}>
                {episodeLabel}
              </Text>
              <Text
                style={styles.episodeTitle}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                maxFontSizeMultiplier={1.2}
              >
                第{todaysEpisode.id}話　{todaysEpisode.title}
              </Text>
            </View>
          ) : null}
        </View>

        {state.activeTimer ? (
          <TouchableOpacity
            style={styles.activeBanner}
            onPress={handleResumeTimer}
            accessibilityRole="button"
            accessibilityLabel="進行中のタイマーを再開"
          >
            <View style={styles.activeCopy}>
              <Text style={styles.activeTitle} numberOfLines={1} maxFontSizeMultiplier={1.2}>
                タイマー進行中
              </Text>
              <Text style={styles.activeDescription} numberOfLines={1} maxFontSizeMultiplier={1.2}>
                {state.activeTimer.startedTaskName} — タップして再開
              </Text>
            </View>
            <Text style={styles.activeArrow} maxFontSizeMultiplier={1.2}>›</Text>
          </TouchableOpacity>
        ) : null}

        <PrimaryButton
          title="集中モードを開始"
          onPress={() => setIsTimerSetupOpen(true)}
          disabled={needsTask}
          style={styles.startButton}
          accessibilityLabel="集中モードの時間を設定"
          maxFontSizeMultiplier={1}
        />
      </View>

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

const styles = StyleSheet.create({
  container: { flex: 1 },
  shopButton: {
    padding: 12,
    marginRight: -12,
  },
  shopIcon: {
    width: 47,
    height: 47,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  details: {
    flex: 1,
    justifyContent: "center",
    gap: 16,
    minHeight: 0,
  },
  taskRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  intro: {
    flex: 1,
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
    lineHeight: 38,
    fontFamily: Fonts.pixel,
    marginTop: 8,
  },
  statusRow: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: 10,
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
    flexShrink: 1,
    color: Colors.textSub,
    fontSize: 15,
    fontFamily: Fonts.pixel,
  },
  activeBanner: {
    alignItems: "center",
    backgroundColor: "#E7F7ED",
    borderColor: Colors.accent,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    marginTop: 16,
  },
  episodeLabel: {
    color: Colors.textSub,
    fontSize: 12,
    fontFamily: Fonts.bold,
  },
  episodeTitle: {
    fontFamily: Fonts.pixel,
    color: Colors.text,
    fontSize: 20,
    lineHeight: 28,
    marginTop: 8,
  },
});

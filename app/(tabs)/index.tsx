import useGuardedPush from "@/src/hooks/useGuardedPush";
import { Image } from "expo-image";
import { useBottomTabBarHeight } from "expo-router/js-tabs";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PrimaryButton from "@/src/components/common/PrimaryButton";
import ScreenBackground from "@/src/components/common/ScreenBackground";
import TaskNameModal from "@/src/components/home/TaskNameModal";
import TimerSetupModal from "@/src/components/home/TimerSetupModal";
import { Fonts } from "@/src/constants/theme";
import { getTodaysStoryEpisode, STORY_CATALOG } from "@/src/domain/storyData";
import useLocalToday from "@/src/hooks/useLocalToday";
import { useAppState } from "@/src/state/AppStateProvider";

// Match monitor_frame.svg's 360 × 270 viewBox; resize both axes together.
const MONITOR_ASPECT_RATIO = 4 / 3;

export default function HomeScreen() {
  const { top } = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const tabBarHeight = useBottomTabBarHeight();
  const push = useGuardedPush();
  const { state, setTaskName, startTimer } = useAppState();
  const [isTimerSetupOpen, setIsTimerSetupOpen] = React.useState(false);
  const [monitorSpace, setMonitorSpace] = React.useState({
    width: width - 48,
    height: height * 0.42,
  });
  const monitorHeight = Math.max(
    0,
    Math.min(
      monitorSpace.width / MONITOR_ASPECT_RATIO,
      monitorSpace.height,
      height * 0.42,
    ),
  );
  const monitorWidth = monitorHeight * MONITOR_ASPECT_RATIO;
  const shortScreen = height < 700;
  const compact =
    monitorHeight < 320 || (Boolean(state?.activeTimer) && monitorHeight < 380);
  const tight =
    monitorHeight < 230 || (Boolean(state?.activeTimer) && monitorHeight < 320);
  const fontMultiplier = tight ? 1 : 1.2;
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
      <ScreenBackground source={require("@/assets/bg/cockpit-bg.png")} />
      <View
        style={[
          styles.content,
          {
            paddingTop: top + 76 + (shortScreen ? 8 : 12),
            paddingBottom: tabBarHeight + 12,
            paddingHorizontal: shortScreen ? 20 : 24,
          },
        ]}
      >
        <View
          style={styles.windowArea}
          onLayout={({ nativeEvent: { layout } }) => {
            setMonitorSpace((current) =>
              current.width === layout.width && current.height === layout.height
                ? current
                : { width: layout.width, height: layout.height },
            );
          }}
        >
          <View
            style={[
              styles.monitor,
              { width: monitorWidth, height: monitorHeight },
              compact && styles.monitorCompact,
              tight && styles.monitorTight,
            ]}
          >
            <View
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
              accessible={false}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <Image
                source={require("@/assets/images/monitor_frame.svg")}
                style={[StyleSheet.absoluteFill, styles.monitorFrame]}
                contentFit="contain"
                accessible={false}
              />
            </View>
            <View>
              <Text
                style={[styles.eyebrow, tight && styles.eyebrowTight]}
                numberOfLines={1}
                maxFontSizeMultiplier={fontMultiplier}
              >
                TODAY&apos;S TASK
              </Text>
              <Text
                style={[
                  styles.taskName,
                  compact && styles.taskNameCompact,
                  tight && styles.taskNameTight,
                ]}
                numberOfLines={tight ? 1 : 2}
                adjustsFontSizeToFit
                minimumFontScale={0.65}
                maxFontSizeMultiplier={fontMultiplier}
              >
                {state.taskName || "タスクを設定してください"}
              </Text>
              <View style={[styles.statusRow, tight && styles.statusRowTight]}>
                <View
                  style={[
                    styles.statusDot,
                    completedToday && styles.statusDotDone,
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    compact && styles.statusTextCompact,
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  maxFontSizeMultiplier={fontMultiplier}
                >
                  {completedToday ? "今日のタスクは完了" : "今日は未完了"}
                </Text>
              </View>
            </View>
            {todaysEpisode ? (
              <View
                style={[
                  styles.episode,
                  compact && styles.episodeCompact,
                  tight && styles.episodeTight,
                ]}
                accessible
                accessibilityLabel={`${episodeLabel}、第${todaysEpisode.id}話、${todaysEpisode.title}`}
              >
                <Text
                  style={styles.episodeLabel}
                  numberOfLines={1}
                  maxFontSizeMultiplier={fontMultiplier}
                >
                  {episodeLabel}
                </Text>
                <Text
                  style={[
                    styles.episodeTitle,
                    compact && styles.episodeTitleCompact,
                    tight && styles.episodeTitleTight,
                  ]}
                  numberOfLines={tight ? 1 : 2}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                  maxFontSizeMultiplier={fontMultiplier}
                >
                  第{todaysEpisode.id}話　{todaysEpisode.title}
                </Text>
              </View>
            ) : null}
            {state.activeTimer ? (
              <TouchableOpacity
                style={[
                  styles.activeBanner,
                  compact && styles.activeBannerCompact,
                  tight && styles.activeBannerTight,
                ]}
                onPress={handleResumeTimer}
                accessibilityRole="button"
                accessibilityLabel={`進行中のタイマーを再開、${state.activeTimer.startedTaskName}`}
              >
                <View style={styles.activeCopy}>
                  <Text
                    style={styles.activeTitle}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    maxFontSizeMultiplier={fontMultiplier}
                  >
                    {compact ? "タイマーを再開" : "タイマー進行中"}
                  </Text>
                  {!compact ? (
                    <Text
                      style={styles.activeDescription}
                      numberOfLines={1}
                      maxFontSizeMultiplier={1.2}
                    >
                      {state.activeTimer.startedTaskName} — タップして再開
                    </Text>
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.activeArrow,
                    compact && styles.activeArrowCompact,
                  ]}
                  maxFontSizeMultiplier={fontMultiplier}
                >
                  ›
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <PrimaryButton
          title="はじめる"
          onPress={() => setIsTimerSetupOpen(true)}
          disabled={needsTask}
          style={shortScreen ? styles.startButtonCompact : styles.startButton}
          accessibilityLabel="集中モードの時間を設定"
          maxFontSizeMultiplier={1}
        />
        <View style={[styles.shopDock, shortScreen && styles.shopDockCompact]}>
          <TouchableOpacity
            style={[styles.shopButton, shortScreen && styles.shopButtonCompact]}
            onPress={() => push("/shop")}
            accessibilityRole="button"
            accessibilityLabel="ショップを開く"
          >
            <Image
              source={require("@/assets/images/footer_unknown.svg")}
              style={[styles.shopIcon, shortScreen && styles.shopIconCompact]}
              contentFit="contain"
              accessible={false}
            />
          </TouchableOpacity>
        </View>
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

const monitorText = {
  textAlign: "center" as const,
  textShadowColor: "rgba(5, 30, 42, 0.75)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 3,
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  shopButton: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 64,
    minHeight: 64,
    borderRadius: 16,
    backgroundColor: "rgba(12, 36, 58, 0.82)",
    borderColor: "rgba(179, 235, 229, 0.65)",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  shopIcon: {
    width: 32,
    height: 32,
  },
  shopButtonCompact: {
    minWidth: 56,
    minHeight: 48,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  shopIconCompact: { width: 24, height: 24 },
  shopLabel: {
    color: "#D5FAF1",
    fontFamily: Fonts.medium,
    fontSize: 11,
    marginTop: 2,
  },
  shopDock: {
    alignItems: "flex-end",
    marginTop: 12,
  },
  shopDockCompact: { marginTop: 8 },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  windowArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 0,
  },
  monitor: {
    justifyContent: "center",
    gap: 18,
    flexShrink: 0,
    padding: 24,
  },
  monitorCompact: { padding: 14, gap: 10 },
  monitorTight: { padding: 12, gap: 6 },
  monitorFrame: { opacity: 0.8 },
  eyebrow: {
    ...monitorText,
    color: "#EDF2FF",
    fontSize: 13,
    fontFamily: Fonts.bold,
    letterSpacing: 1.4,
  },
  eyebrowTight: { fontSize: 10 },
  taskName: {
    ...monitorText,
    color: "#FFFFFF",
    fontSize: 30,
    lineHeight: 38,
    fontFamily: Fonts.pixel,
    marginTop: 8,
  },
  taskNameCompact: { fontSize: 24, lineHeight: 30, marginTop: 6 },
  taskNameTight: { fontSize: 22, lineHeight: 26, marginTop: 4 },
  statusRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  statusRowTight: { marginTop: 6 },
  statusDot: {
    backgroundColor: "#C4D0ED",
    borderRadius: 5,
    height: 10,
    marginRight: 8,
    width: 10,
  },
  statusDotDone: {
    backgroundColor: "#FFFFFF",
  },
  statusText: {
    ...monitorText,
    flexShrink: 1,
    color: "#F5F7FF",
    fontSize: 15,
    fontFamily: Fonts.pixel,
  },
  statusTextCompact: { fontSize: 13 },
  activeBanner: {
    minHeight: 44,
    alignItems: "center",
    backgroundColor: "rgba(207, 217, 245, 0.16)",
    borderColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 0,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  activeBannerCompact: {
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  activeBannerTight: { paddingVertical: 4 },
  activeCopy: {
    flex: 1,
  },
  activeTitle: {
    ...monitorText,
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: Fonts.bold,
  },
  activeDescription: {
    ...monitorText,
    fontFamily: Fonts.regular,
    color: "#EDF2FF",
    fontSize: 13,
    marginTop: 3,
  },
  activeArrow: {
    position: "absolute",
    right: 8,
    fontFamily: Fonts.regular,
    color: "#EDF2FF",
    fontSize: 30,
  },
  activeArrowCompact: { fontSize: 20, lineHeight: 22 },
  startButton: {
    marginTop: 16,
  },
  startButtonCompact: { marginTop: 12 },
  episodeLabel: {
    ...monitorText,
    color: "#EDF2FF",
    fontSize: 12,
    fontFamily: Fonts.bold,
  },
  episode: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.35)",
    paddingTop: 14,
  },
  episodeTight: { paddingTop: 6 },
  episodeCompact: { paddingTop: 10 },
  episodeTitle: {
    ...monitorText,
    fontFamily: Fonts.pixel,
    color: "#FFFFFF",
    fontSize: 20,
    lineHeight: 28,
    marginTop: 8,
  },
  episodeTitleCompact: { fontSize: 16, lineHeight: 22, marginTop: 6 },
  episodeTitleTight: { fontSize: 15, lineHeight: 20, marginTop: 4 },
});

import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  ImageBackground,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import PrimaryButton from "@/src/components/common/PrimaryButton";
import DiaryModal from "@/src/components/timer/DiaryModal";
import CoachMark from "@/src/components/tutorial/CoachMark";
import { useAppState } from "@/src/state/AppStateProvider";
import { Colors } from "@/src/constants/theme";
import useTimerLogic from "@/src/hooks/useTimerLogic";

export default function TimerScreen() {
  const { state } = useAppState();
  const isTutorial = state?.tutorialStep === "timer";
  const [powerExplained, setPowerExplained] = React.useState(false);
  const [isPowerSaving, setIsPowerSaving] = React.useState(false);
  const restoreTimerScreen = () => setIsPowerSaving(false);
  const {
    activeTimer,
    snapshot,
    timerText,
    isProcessing,
    error,
    isDiaryOpen,
    openDiary,
    closeDiary,
    handleCancel,
    handleFinish,
  } = useTimerLogic();

  if (!activeTimer || !snapshot) {
    return <View style={styles.emptyContainer} />;
  }

  return (
    <ImageBackground
      source={require("@/assets/bg/bg-timer.jpg")}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView
        style={styles.safeArea}
        edges={["top", "bottom"]}
        accessibilityElementsHidden={isPowerSaving}
        importantForAccessibility={isPowerSaving ? "no-hide-descendants" : "auto"}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            {!snapshot.isComplete && !isTutorial ? (
              <TouchableOpacity
                onPress={handleCancel}
                style={styles.cancelButton}
                disabled={isProcessing}
                accessibilityRole="button"
                accessibilityLabel="タイマーをキャンセル"
                accessibilityState={{ disabled: isProcessing }}
              >
                <Text style={styles.cancelText}>✕ キャンセル</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.overtimeLabel}>{snapshot.isComplete ? "終了可能" : "集中モード実行中"}</Text>
            )}
          </View>

          <View style={styles.timerWrapper}>
            <Text style={styles.taskLabel}>集中タスク</Text>
            <Text style={styles.taskName} numberOfLines={3}>
              {activeTimer.startedTaskName}
            </Text>
            <Text
              style={styles.timerText}
              accessibilityLabel={
                snapshot.isComplete ? `延長 ${timerText}` : `残り ${timerText}`
              }
            >
              {timerText}
            </Text>
            <Text style={styles.statusText}>
              {snapshot.isComplete
                ? "予定時間を終えました"
                : "集中モード実行中…"}
            </Text>
            <Text style={styles.earnedText}>
              終了時に {snapshot.earnedNt} NT を獲得
            </Text>
          </View>

          <View style={styles.footer}>
            {isTutorial && !powerExplained ? <CoachMark title="省電力モード" text="省電力モードは画面を黒くし、タイマーの計測は続けます。黒い画面をタップすると戻れます。アプリを閉じたり別画面へ移動すると計測は止まります。確認したら「次へ」を押してください。" onNext={async () => { setPowerExplained(true); }} /> : null}
            {isTutorial && powerExplained ? <CoachMark title="集中を終了" text="予定時間が終わったら「終了して記録」を押しましょう。次に日記の書き方をご案内します。" /> : null}
            <TouchableOpacity
              onPress={() => setIsPowerSaving(true)}
              style={styles.powerSavingButton}
              accessibilityRole="button"
              accessibilityLabel="省電力モード"
              accessibilityHint="画面を黒くします。黒画面をタップするとタイマー画面に戻ります。計測は継続します。"
            >
              <Text style={styles.cancelText}>省電力モード</Text>
            </TouchableOpacity>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <PrimaryButton
              title="終了して記録"
              onPress={() => void openDiary()}
              disabled={!snapshot.isComplete || isProcessing || (isTutorial && !powerExplained)}
              loading={isProcessing}
              style={styles.finishButton}
              accessibilityLabel="タイマーを終了して記録"
            />
            <Text style={styles.finishHint}>
              {snapshot.isComplete
                ? "押した時刻までを集中時間として記録します"
                : "予定時間が終わると終了できます"}
            </Text>
          </View>
        </View>
      </SafeAreaView>
      {/* 別ルートにするとフォーカスを失い計測が止まるため、標準Modalで共通ヘッダー・フッターごと覆う。 */}
      <Modal
        visible={isPowerSaving}
        animationType="none"
        presentationStyle="fullScreen"
        backdropColor="#000000"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={restoreTimerScreen}
      >
        {isPowerSaving ? <StatusBar hidden /> : null}
        <Pressable
          style={styles.blackScreen}
          onPress={restoreTimerScreen}
          accessibilityRole="button"
          accessibilityLabel="省電力モードを解除"
          accessibilityHint="タイマー画面に戻ります。タイマーの計測は継続しています。"
          accessibilityViewIsModal
          onAccessibilityEscape={restoreTimerScreen}
        />
      </Modal>
      <DiaryModal
        visible={isDiaryOpen}
        tutorial={isTutorial}
        saving={isProcessing}
        error={error}
        onClose={closeDiary}
        onSave={handleFinish}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: "flex-start",
    minHeight: 48,
  },
  cancelButton: {
    padding: 10,
  },
  cancelText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: "700",
  },
  overtimeLabel: {
    color: Colors.surface,
    fontSize: 15,
    fontWeight: "700",
    padding: 10,
  },
  timerWrapper: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  taskLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
  },
  taskName: {
    color: Colors.surface,
    fontSize: 22,
    fontWeight: "800",
    marginTop: 8,
    textAlign: "center",
  },
  timerText: {
    color: Colors.surface,
    fontSize: 66,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
    marginTop: 42,
  },
  statusText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 16,
  },
  earnedText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    marginTop: 10,
  },
  footer: {
    alignItems: "center",
    paddingBottom: 14,
  },
  powerSavingButton: {
    padding: 14,
    marginBottom: 10,
  },
  blackScreen: {
    backgroundColor: "#000000",
    flex: 1,
  },
  finishButton: {
    width: "100%",
  },
  finishHint: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginTop: 10,
    textAlign: "center",
  },
  error: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 8,
    color: Colors.warning,
    fontSize: 13,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    textAlign: "center",
    width: "100%",
  },
  emptyContainer: {
    backgroundColor: Colors.background,
    flex: 1,
  },
});

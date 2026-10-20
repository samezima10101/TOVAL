import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import PrimaryButton from "@/src/components/common/PrimaryButton";
import ScreenBackground from "@/src/components/common/ScreenBackground";
import DiaryModal from "@/src/components/timer/DiaryModal";
import { Colors, Fonts } from "@/src/constants/theme";
import useTimerLogic from "@/src/hooks/useTimerLogic";

export default function TimerScreen() {
  const [isPowerSaving, setIsPowerSaving] = React.useState(false);
  const restoreTimerScreen = () => setIsPowerSaving(false);
  const {
    activeTimer,
    snapshot,
    timerText,
    isProcessing,
    error,
    timerSaveError,
    retrySave,
    isDiaryOpen,
    openDiary,
    closeDiary,
    handleCancel,
    handleFinish,
  } = useTimerLogic();

  if (!activeTimer || !snapshot) {
    return <ScreenBackground />;
  }

  return (
    <ScreenBackground>
      <SafeAreaView
        style={styles.safeArea}
        edges={["top", "bottom"]}
        accessibilityElementsHidden={isPowerSaving}
        importantForAccessibility={isPowerSaving ? "no-hide-descendants" : "auto"}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            {!snapshot.isComplete ? (
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
              <Text style={styles.overtimeLabel}>終了可能</Text>
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
              {timerSaveError ? "保存待ち・計測停止中" : snapshot.isComplete
                ? "予定時間を終えました"
                : "集中モード実行中…"}
            </Text>
            <Text style={styles.earnedText}>
              終了時に {snapshot.earnedNt} NT を獲得
            </Text>
          </View>

          <View style={styles.footer}>
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
              disabled={!snapshot.isComplete || isProcessing}
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
        {timerSaveError ? (
          <View style={styles.blackScreenError} accessibilityRole="alert">
            <Text style={{ color: "white", fontFamily: Fonts.regular }}>{timerSaveError}</Text>
            <PrimaryButton title="タイマー保存を再試行" onPress={() => void retrySave()} disabled={isProcessing} />
          </View>
        ) : null}
      </Modal>
      <DiaryModal
        onRetrySave={timerSaveError ? () => void retrySave() : undefined}
        visible={isDiaryOpen}
        saving={isProcessing}
        error={error}
        onClose={closeDiary}
        onSave={handleFinish}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  blackScreenError: { position: "absolute", top: 80, left: 24, right: 24, gap: 16 },
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
    fontFamily: Fonts.bold,
  },
  overtimeLabel: {
    color: Colors.surface,
    fontSize: 15,
    fontFamily: Fonts.bold,
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
    fontFamily: Fonts.bold,
    letterSpacing: 1,
  },
  taskName: {
    color: Colors.surface,
    fontSize: 22,
    fontFamily: Fonts.bold,
    marginTop: 8,
    textAlign: "center",
  },
  timerText: {
    color: Colors.surface,
    fontSize: 66,
    fontVariant: ["tabular-nums"],
    fontFamily: Fonts.timer,
    marginTop: 42,
  },
  statusText: {
    color: Colors.surface,
    fontSize: 16,
    fontFamily: Fonts.bold,
    marginTop: 16,
  },
  earnedText: {
    fontFamily: Fonts.regular,
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
    fontFamily: Fonts.regular,
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginTop: 10,
    textAlign: "center",
  },
  error: {
    fontFamily: Fonts.regular,
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
});

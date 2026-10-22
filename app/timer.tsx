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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PrimaryButton from "@/src/components/common/PrimaryButton";
import ScreenBackground from "@/src/components/common/ScreenBackground";
import DiaryModal from "@/src/components/timer/DiaryModal";
import TimerDial from "@/src/components/timer/TimerDial";
import { Colors, Fonts } from "@/src/constants/theme";
import useTimerLogic from "@/src/hooks/useTimerLogic";

export default function TimerScreen() {
  const { top } = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: top + 76 }]}>
      <ScreenBackground source={require("@/assets/bg/primary-bg.png")} />
      <TimerContent />
    </View>
  );
}

function TimerContent() {
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
    return <View style={styles.screen} />;
  }

  const remainingProgress =
    activeTimer.plannedSeconds > 0 && !snapshot.isComplete
      ? Math.max(0, 1 - snapshot.elapsedMs / (activeTimer.plannedSeconds * 1000))
      : 0;

  return (
    <View style={styles.screen}>
      <View
        style={styles.backgroundCircle}
        pointerEvents="none"
        accessible={false}
      >
        <View style={styles.backgroundCircleInner} />
      </View>
      <View
        style={styles.container}
        accessibilityElementsHidden={isPowerSaving}
        importantForAccessibility={
          isPowerSaving ? "no-hide-descendants" : "auto"
        }
      >
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
          ) : null}
        </View>

        <View style={styles.timerWrapper}>
          <TimerDial
            progress={remainingProgress}
            timerText={timerText}
            accessibilityLabel={
              snapshot.isComplete ? `延長 ${timerText}` : `残り ${timerText}`
            }
          />
        </View>

        <View style={styles.footer}>
          {error ? (
            <Text style={styles.error} accessibilityRole="alert">{error}</Text>
          ) : null}
          <PrimaryButton
            title="終了"
            onPress={() => void openDiary()}
            disabled={!snapshot.isComplete || isProcessing}
            loading={isProcessing}
            accessibilityLabel="タイマーを終了して記録"
            maxFontSizeMultiplier={1.3}
          />
          <TouchableOpacity
            onPress={() => setIsPowerSaving(true)}
            style={styles.powerSavingButton}
            accessibilityRole="button"
            accessibilityLabel="省電力モード"
            accessibilityHint="画面を黒くします。黒画面をタップするとタイマー画面に戻ります。計測は継続します。"
          >
            <Text style={styles.powerSavingText} maxFontSizeMultiplier={1.3}>
              省電力モード
            </Text>
          </TouchableOpacity>
          <Text
            style={styles.finishHint}
            numberOfLines={2}
            maxFontSizeMultiplier={1.3}
          >
            {snapshot.isComplete
              ? "押した時刻までを集中時間として記録します"
              : "予定時間が終わると終了できます"}
          </Text>
        </View>
      </View>
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
            <Text style={{ color: "white", fontFamily: Fonts.regular }}>
              {timerSaveError}
            </Text>
            <PrimaryButton
              title="タイマー保存を再試行"
              onPress={() => void retrySave()}
              disabled={isProcessing}
            />
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, overflow: "hidden" },
  backgroundCircle: {
    position: "absolute",
    top: "8%",
    left: "-40%",
    width: "180%",
    aspectRatio: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
    backgroundColor: "rgba(255,255,255,0.18)",
    padding: 28,
  },
  backgroundCircleInner: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  blackScreenError: {
    position: "absolute",
    top: 80,
    left: 24,
    right: 24,
    gap: 16,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  header: {
    alignItems: "flex-start",
    height: 44,
  },
  cancelButton: {
    padding: 10,
  },
  cancelText: {
    color: Colors.surface,
    fontSize: 16,
    fontFamily: Fonts.bold,
  },
  timerWrapper: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    minHeight: 0,
  },
  footer: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 16,
  },
  powerSavingButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 8,
  },
  powerSavingText: {
    color: Colors.surface,
    fontSize: 14,
    fontFamily: Fonts.bold,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  blackScreen: {
    backgroundColor: "#000000",
    flex: 1,
  },
  finishHint: {
    fontFamily: Fonts.regular,
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginTop: 4,
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

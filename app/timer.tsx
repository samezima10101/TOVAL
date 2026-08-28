import { router, useFocusEffect } from "expo-router";
import React from "react";
import {
    Alert,
    ImageBackground,
    AppState as NativeAppState,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import PrimaryButton from "@/src/components/PrimaryButton";
import { Colors } from "@/src/constants/theme";
import { formatDuration, getTimerSnapshot } from "@/src/domain/timer";
import { useAppState } from "@/src/state/AppStateProvider";

export default function TimerScreen() {
  const { state, cancelTimer, finishTimer, setTimerRouteFocused } =
    useAppState();
  const [now, setNow] = React.useState(Date.now);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const activeTimer = state?.activeTimer ?? null;

  useFocusEffect(
    React.useCallback(() => {
      void setTimerRouteFocused(true).catch(() => undefined);
      return () => {
        void setTimerRouteFocused(false).catch(() => undefined);
      };
    }, [setTimerRouteFocused]),
  );

  React.useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    const subscription = NativeAppState.addEventListener(
      "change",
      (nextState) => {
        if (nextState === "active") {
          setNow(Date.now());
        }
      },
    );

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  React.useEffect(() => {
    if (!activeTimer) {
      router.replace("/");
    }
  }, [activeTimer]);

  if (!activeTimer) {
    return <View style={styles.emptyContainer} />;
  }

  const snapshot = getTimerSnapshot(activeTimer, now);
  const timerText = snapshot.isComplete
    ? `+${formatDuration(snapshot.overtimeSeconds)}`
    : formatDuration(snapshot.remainingSeconds);

  const handleCancel = () => {
    Alert.alert(
      "タイマーをキャンセルしますか？",
      "今回の集中時間は記録されず、NT・完了回数・ストーリーも変わりません。",
      [
        { text: "続ける", style: "cancel" },
        {
          text: "キャンセルする",
          style: "destructive",
          onPress: () => void performCancel(),
        },
      ],
    );
  };

  const performCancel = async () => {
    setError(null);
    setIsProcessing(true);
    try {
      await cancelTimer(Date.now());
      router.replace("/");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "キャンセルできませんでした。",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinish = async () => {
    setError(null);
    setIsProcessing(true);
    const finishedAt = Date.now();
    try {
      const outcome = await finishTimer(finishedAt);
      if (outcome.unlockedEpisode) {
        router.replace({
          pathname: "/story",
          params: {
            episode: String(outcome.unlockedEpisode),
            source: "unlock",
          },
        });
      } else {
        router.replace("/");
      }
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "終了処理に失敗しました。",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ImageBackground
      source={require("@/assets/bg/bg-timer.jpg")}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
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
              {snapshot.isComplete
                ? "予定時間を終えました"
                : "集中モード実行中…"}
            </Text>
            <Text style={styles.earnedText}>
              終了時に {snapshot.earnedNt} NT を獲得
            </Text>
          </View>

          <View style={styles.footer}>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <PrimaryButton
              title="終了して記録"
              onPress={() => void handleFinish()}
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

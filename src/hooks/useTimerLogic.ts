import { router, useFocusEffect } from "expo-router";
import React from "react";
import { Alert } from "react-native";

import { formatDuration, getTimerSnapshot } from "@/src/domain/timer";
import useTimerTick from "@/src/hooks/useTimerTick";
import { useAppState } from "@/src/state/AppStateProvider";

export default function useTimerLogic() {
  const { state, cancelTimer, finishTimer, setTimerRouteFocused } =
    useAppState();
  const now = useTimerTick();

  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const activeTimer = state?.activeTimer ?? null;

  // 画面のフォーカス状態を管理
  useFocusEffect(
    React.useCallback(() => {
      void setTimerRouteFocused(true).catch(() => undefined);
      return () => {
        void setTimerRouteFocused(false).catch(() => undefined);
      };
    }, [setTimerRouteFocused]),
  );

  // アクティブなタイマーがない場合はホームにリダイレクト
  React.useEffect(() => {
    if (!activeTimer) {
      router.replace("/");
    }
  }, [activeTimer]);

  const snapshot = activeTimer ? getTimerSnapshot(activeTimer, now) : null;
  const timerText = snapshot
    ? snapshot.isComplete
      ? `+${formatDuration(snapshot.overtimeSeconds)}`
      : formatDuration(snapshot.remainingSeconds)
    : "";

  const handleCancel = () => {
    Alert.alert(
      "タイマーをキャンセルしますか？",
      "今回の集中時間は記録されず、NT・完了回数・ストーリーも変わりません。",
      [
        { text: "続ける", style: "cancel" },
        {
          text: "キャンセルする",
          style: "destructive",
          onPress: async () => {
            setError(null);
            setIsProcessing(true);
            try {
              await cancelTimer(Date.now());
              router.replace("/");
            } catch (cause) {
              setError(
                cause instanceof Error
                  ? cause.message
                  : "キャンセルできませんでした。",
              );
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ],
    );
  };

  const handleFinish = async () => {
    setError(null);
    setIsProcessing(true);
    try {
      const outcome = await finishTimer(Date.now());
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

  return {
    activeTimer,
    snapshot,
    timerText,
    isProcessing,
    error,
    handleCancel,
    handleFinish,
  };
}

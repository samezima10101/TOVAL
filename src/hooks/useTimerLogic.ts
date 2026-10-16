import { router, useFocusEffect } from "expo-router";
import { usePreventRemove } from "expo-router/react-navigation";
import React from "react";
import { Alert } from "react-native";

import { formatDuration, getTimerSnapshot } from "@/src/domain/timer";
import useTimerTick from "@/src/hooks/useTimerTick";
import { useAppState } from "@/src/state/AppStateProvider";

export default function useTimerLogic() {
  const { state, cancelTimer, finishTimer, setTimerRouteFocused, timerSaveError, retryTimerSave } =
    useAppState();
  const now = useTimerTick();

  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [finishedAt, setFinishedAt] = React.useState<number | null>(null);
  const processingRef = React.useRef(false);
  const leavingRef = React.useRef(false);
  const [destination, setDestination] = React.useState<"home" | number | null>(null);
  // While a completion/cancellation is saving, OS back must not unmount the
  // owner and let its pending continuation navigate from another screen.
  usePreventRemove(isProcessing && destination === null, () => undefined);
  React.useEffect(() => {
    if (destination === null) return;
    if (destination === "home") router.dismissTo("/");
    else router.replace({ pathname: "/story", params: { episode: String(destination), source: "unlock" } });
  }, [destination]);
  const activeTimer = state?.activeTimer ?? null;
  const retrySave = async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);
    try {
      await retryTimerSave();
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "保存できませんでした。");
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  };

  // 画面のフォーカス状態を管理
  useFocusEffect(
    React.useCallback(() => {
      void setTimerRouteFocused(finishedAt === null).catch(() => undefined);
      return () => {
        void setTimerRouteFocused(false).catch(() => undefined);
      };
    }, [finishedAt, setTimerRouteFocused]),
  );

  // アクティブなタイマーがない場合はホームにリダイレクト
  React.useEffect(() => {
    if (!activeTimer && !leavingRef.current) {
      leavingRef.current = true;
      router.dismissTo("/");
    }
  }, [activeTimer]);

  const snapshot = activeTimer ? getTimerSnapshot(activeTimer, now) : null;
  const timerText = snapshot
    ? snapshot.isComplete
      ? `+${formatDuration(snapshot.overtimeSeconds)}`
      : formatDuration(snapshot.remainingSeconds)
    : "";

  const handleCancel = () => {
    if (processingRef.current || leavingRef.current) return;
    Alert.alert(
      "タイマーをキャンセルしますか？",
      "今回の集中時間は記録されず、NT・完了回数・ストーリーも変わりません。",
      [
        { text: "続ける", style: "cancel" },
        {
          text: "キャンセルする",
          style: "destructive",
          onPress: async () => {
            if (processingRef.current || leavingRef.current) return;
            processingRef.current = true;
            leavingRef.current = true;
            setError(null);
            setIsProcessing(true);
            try {
              await cancelTimer(Date.now());
              setDestination("home");
            } catch (cause) {
              leavingRef.current = false;
              setError(
                cause instanceof Error
                  ? cause.message
                  : "キャンセルできませんでした。",
              );
            } finally {
              processingRef.current = false;
              setIsProcessing(false);
            }
          },
        },
      ],
    );
  };

  const openDiary = async () => {
    if (processingRef.current || leavingRef.current || finishedAt !== null) return;
    processingRef.current = true;
    const pressedAt = Date.now();
    setError(null);
    setIsProcessing(true);
    setFinishedAt(pressedAt);
    try {
      await setTimerRouteFocused(false, pressedAt);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "タイマーを停止できませんでした。",
      );
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  };

  const closeDiary = () => {
    if (!processingRef.current && !leavingRef.current) {
      setFinishedAt(null);
    }
  };

  const handleFinish = async (diary = "") => {
    if (processingRef.current || leavingRef.current || finishedAt === null) return;
    processingRef.current = true;
    leavingRef.current = true;
    setError(null);
    setIsProcessing(true);
    try {
      const outcome = await finishTimer(finishedAt ?? Date.now(), diary);
      setDestination(outcome.unlockedEpisode ?? "home");
    } catch (cause) {
      leavingRef.current = false;
      setError(
        cause instanceof Error ? cause.message : "終了処理に失敗しました。",
      );
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  };

  return {
    activeTimer,
    snapshot,
    timerText,
    isProcessing,
    error,
    timerSaveError,
    retrySave,
    isDiaryOpen: finishedAt !== null,
    openDiary,
    closeDiary,
    handleCancel,
    handleFinish,
  };
}

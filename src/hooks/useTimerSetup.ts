import { MAX_PLANNED_SECONDS } from "@/src/domain/common/types";
import React from "react";

const MAX_MINUTES = MAX_PLANNED_SECONDS / 60;

function clampMinutes(value: number): number {
  return Math.max(0, Math.min(MAX_MINUTES, Math.round(value / 5) * 5));
}

export default function useTimerSetup(
  initialMinutes: number,
  visible: boolean,
  onStart: (plannedSeconds: number) => Promise<void>,
) {
  const [totalMinutes, setTotalMinutes] = React.useState(() =>
    clampMinutes(initialMinutes),
  );
  const [isStarting, setIsStarting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (visible) {
      setTotalMinutes(clampMinutes(initialMinutes));
      setError(null);
    }
  }, [initialMinutes, visible]);

  const adjust = (amount: number) => {
    setTotalMinutes((current) => clampMinutes(current + amount));
  };

  const handleStart = async () => {
    setError(null);
    setIsStarting(true);
    try {
      await onStart(totalMinutes * 60);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "タイマーを開始できませんでした。",
      );
    } finally {
      setIsStarting(false);
    }
  };

  const displayHours = Math.floor(totalMinutes / 60);
  const displayMins = totalMinutes % 60;

  return {
    isStarting,
    error,
    displayHours,
    displayMins,
    adjust,
    handleStart,
  };
}

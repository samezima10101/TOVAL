import { ActiveTimer } from "./types";

export type TimerSnapshot = {
  elapsedMs: number;
  elapsedSeconds: number;
  remainingSeconds: number;
  overtimeSeconds: number;
  isComplete: boolean;
  earnedNt: number;
};

export function getTimerSnapshot(
  timer: ActiveTimer,
  now = Date.now(),
): TimerSnapshot {
  const elapsedMs = Math.max(0, now - timer.startedAt);
  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  const remainingSeconds = Math.max(0, timer.plannedSeconds - elapsedSeconds);
  const overtimeSeconds = Math.max(0, elapsedSeconds - timer.plannedSeconds);
  const isComplete = elapsedMs >= timer.plannedSeconds * 1000;

  return {
    elapsedMs,
    elapsedSeconds,
    remainingSeconds,
    overtimeSeconds,
    isComplete,
    earnedNt: elapsedSeconds,
  };
}

export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;

  return [hours, minutes, remainder]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}

import { ActiveTimer } from "./common/types";

export type TimerSnapshot = {
  elapsedMs: number;
  elapsedSeconds: number;
  remainingSeconds: number;
  overtimeSeconds: number;
  isComplete: boolean;
  earnedNt: number;
};

/**
 * Returns the elapsed concentration time without rounding milliseconds.
 * A timer with no running segment is intentionally frozen at accumulatedMs.
 */
export function getTimerElapsedMs(
  timer: ActiveTimer,
  now = Date.now(),
): number {
  const runningMs =
    timer.runningSince === null ? 0 : Math.max(0, now - timer.runningSince);
  return Math.max(0, timer.accumulatedMs + runningMs);
}

/** Starts a paused segment. Calling this for a running timer is a no-op. */
export function resumeTimer(
  timer: ActiveTimer,
  resumedAt = Date.now(),
): ActiveTimer {
  if (timer.runningSince !== null) {
    return timer;
  }

  return {
    ...timer,
    runningSince: resumedAt,
  };
}

/** Closes the current segment. Calling this for a paused timer is a no-op. */
export function pauseTimer(
  timer: ActiveTimer,
  pausedAt = Date.now(),
): ActiveTimer {
  if (timer.runningSince === null) {
    return timer;
  }

  return {
    ...timer,
    accumulatedMs: getTimerElapsedMs(timer, pausedAt),
    runningSince: null,
  };
}

export function getTimerSnapshot(
  timer: ActiveTimer,
  now = Date.now(),
): TimerSnapshot {
  const elapsedMs = getTimerElapsedMs(timer, now);
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

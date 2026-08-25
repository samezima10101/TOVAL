import { useCallback, useRef } from "react";
import { AppState as NativeAppState } from "react-native";

import { pauseTimer, resumeTimer } from "@/src/domain/timer";
import { AppState } from "@/src/domain/types";
import { AppStateRepository } from "@/src/storage/appStateRepository";

type TimerEligibilityChange = {
  appIsActive?: boolean;
  routeFocused?: boolean;
  changedAt: number;
  persistUnchanged?: boolean;
};

type TimerLifecycleOptions = {
  repository: AppStateRepository;
  stateRef: { current: AppState | null };
  enqueue: <T>(operation: () => Promise<T>) => Promise<T>;
  commitState: (nextState: AppState) => void;
};

export type TimerLifecycle = {
  applyTimerEligibility: (change: TimerEligibilityChange) => Promise<void>;
  persistState: (nextState: AppState) => Promise<void>;
  setTimerRouteFocused: (focused: boolean, changedAt?: number) => Promise<void>;
};

/**
 * A running segment from a previous process cannot be dated to the last
 * eligible moment. Hydrate it paused and retain only persisted elapsed time.
 */
export function normalizeHydratedState(state: AppState): AppState {
  if (!state.activeTimer || state.activeTimer.runningSince === null) {
    return state;
  }

  return {
    ...state,
    activeTimer: {
      ...state.activeTimer,
      runningSince: null,
    },
  };
}

export function useTimerLifecycle({
  repository,
  stateRef,
  enqueue,
  commitState,
}: TimerLifecycleOptions): TimerLifecycle {
  const lifecyclePersistencePendingRef = useRef(false);
  const appIsActiveRef = useRef(NativeAppState.currentState === "active");
  const timerRouteFocusedRef = useRef(false);

  const persistLifecycleState = useCallback(
    async (nextState: AppState) => {
      // Keep the pending marker on failure so a later lifecycle event retries.
      lifecyclePersistencePendingRef.current = true;
      await repository.save(nextState);
      lifecyclePersistencePendingRef.current = false;
    },
    [repository],
  );

  const persistState = useCallback(
    async (nextState: AppState) => {
      await repository.save(nextState);
      lifecyclePersistencePendingRef.current = false;
    },
    [repository],
  );

  const applyTimerEligibility = useCallback(
    (change: TimerEligibilityChange) =>
      enqueue(async () => {
        if (change.appIsActive !== undefined) {
          appIsActiveRef.current = change.appIsActive;
        }
        if (change.routeFocused !== undefined) {
          timerRouteFocusedRef.current = change.routeFocused;
        }

        const current = stateRef.current;
        if (!current?.activeTimer) {
          lifecyclePersistencePendingRef.current = false;
          return;
        }

        const eligible = appIsActiveRef.current && timerRouteFocusedRef.current;
        const nextTimer = eligible
          ? resumeTimer(current.activeTimer, change.changedAt)
          : pauseTimer(current.activeTimer, change.changedAt);
        const shouldPersist =
          change.persistUnchanged === true || lifecyclePersistencePendingRef.current;
        if (nextTimer === current.activeTimer) {
          if (shouldPersist) {
            await persistLifecycleState(current);
          }
          return;
        }

        const nextState = { ...current, activeTimer: nextTimer };
        if (!eligible) {
          // Lifecycle safety takes precedence over save-before-publish: never keep
          // counting while inactive merely because persistence is unavailable.
          commitState(nextState);
        }
        await persistLifecycleState(nextState);
        if (eligible) {
          commitState(nextState);
        }
      }),
    [commitState, enqueue, persistLifecycleState, stateRef],
  );

  const setTimerRouteFocused = useCallback(
    (focused: boolean, changedAt = Date.now()) =>
      applyTimerEligibility({ routeFocused: focused, changedAt }),
    [applyTimerEligibility],
  );

  return { applyTimerEligibility, persistState, setTimerRouteFocused };
}

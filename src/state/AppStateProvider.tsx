import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState as NativeAppState } from "react-native";

import {
  ActiveTimer,
  AppState,
  EpisodeId,
  MAX_PLANNED_SECONDS,
} from "@/src/domain/common/types";
import {
  cancelTimer as cancelTimerState,
  completeTimer,
  CompletionOutcome,
} from "@/src/domain/completion";
import { pauseTimer, resumeTimer } from "@/src/domain/timer";
import {
  appStateRepository,
  AppStateRepository,
  createInitialAppState,
} from "@/src/storage/appStateRepository";

export type HydrationStatus = "loading" | "ready" | "error";

export class TimerNotReadyError extends Error {
  constructor() {
    super("予定時間が終わるまで終了できません。");
    this.name = "TimerNotReadyError";
  }
}

export class NoActiveTimerError extends Error {
  constructor() {
    super("アクティブなタイマーがありません。");
    this.name = "NoActiveTimerError";
  }
}

type AppStateContextValue = {
  state: AppState | null;
  status: HydrationStatus;
  hydrationError: Error | null;
  retryHydration: () => Promise<void>;
  setTaskName: (taskName: string) => Promise<void>;
  markStoryRead: (episodeId: EpisodeId) => Promise<void>;
  startTimer: (plannedSeconds: number) => Promise<ActiveTimer>;
  setTimerRouteFocused: (focused: boolean, changedAt?: number) => Promise<void>;
  cancelTimer: (cancelledAt?: number) => Promise<boolean>;
  finishTimer: (finishedAt?: number) => Promise<CompletionOutcome>;
};

const AppStateContext = createContext<AppStateContextValue | undefined>(
  undefined,
);

type TimerEligibilityChange = {
  appIsActive?: boolean;
  routeFocused?: boolean;
  changedAt: number;
};

function normalizeHydratedState(state: AppState): AppState {
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

function makeSessionId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function assertPlannedSeconds(value: number): asserts value is number {
  if (!Number.isInteger(value) || value < 0 || value > MAX_PLANNED_SECONDS) {
    throw new RangeError("タイマーは0分から23時間55分まで設定できます。");
  }
}

export function AppStateProvider({
  children,
  repository = appStateRepository,
}: {
  children: ReactNode;
  repository?: AppStateRepository;
}) {
  const [state, setState] = useState<AppState | null>(null);
  const [status, setStatus] = useState<HydrationStatus>("loading");
  const [hydrationError, setHydrationError] = useState<Error | null>(null);
  const stateRef = useRef<AppState | null>(null);
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const appIsActiveRef = useRef(NativeAppState.currentState === "active");
  const timerRouteFocusedRef = useRef(false);

  const commitState = useCallback((nextState: AppState) => {
    stateRef.current = nextState;
    setState(nextState);
  }, []);

  const enqueue = useCallback(<T,>(operation: () => Promise<T>): Promise<T> => {
    const previous = queueRef.current;
    const current = previous.then(operation, operation);
    queueRef.current = current.then(
      () => undefined,
      () => undefined,
    );
    return current;
  }, []);

  const requireState = useCallback((): AppState => {
    const current = stateRef.current;
    if (!current) {
      throw new Error("アプリ状態を準備しています。");
    }
    return current;
  }, []);

  const applyTimerEligibility = useCallback(
    ({ appIsActive, routeFocused, changedAt }: TimerEligibilityChange) =>
      enqueue(async () => {
        if (appIsActive !== undefined) {
          appIsActiveRef.current = appIsActive;
        }
        if (routeFocused !== undefined) {
          timerRouteFocusedRef.current = routeFocused;
        }

        const current = stateRef.current;
        if (!current?.activeTimer) {
          return;
        }

        const eligible = appIsActiveRef.current && timerRouteFocusedRef.current;
        const nextTimer = eligible
          ? resumeTimer(current.activeTimer, changedAt)
          : pauseTimer(current.activeTimer, changedAt);
        if (nextTimer === current.activeTimer) {
          return;
        }

        const nextState = { ...current, activeTimer: nextTimer };
        await repository.save(nextState);
        commitState(nextState);
      }),
    [commitState, enqueue, repository],
  );

  const setTimerRouteFocused = useCallback(
    (focused: boolean, changedAt = Date.now()) =>
      applyTimerEligibility({ routeFocused: focused, changedAt }),
    [applyTimerEligibility],
  );

  const retryHydration = useCallback(async () => {
    setStatus("loading");
    setHydrationError(null);
    try {
      const persisted = await repository.load();
      const loaded = normalizeHydratedState(persisted);
      if (loaded !== persisted) {
        await repository.save(loaded);
      }
      stateRef.current = loaded;
      setState(loaded);
      setStatus("ready");
      void applyTimerEligibility({ changedAt: Date.now() }).catch(
        () => undefined,
      );
    } catch (error) {
      const normalized =
        error instanceof Error ? error : new Error(String(error));
      setHydrationError(normalized);
      setStatus("error");
    }
  }, [applyTimerEligibility, repository]);

  useEffect(() => {
    void retryHydration();
  }, [retryHydration]);

  useEffect(() => {
    const subscription = NativeAppState.addEventListener(
      "change",
      (nextState) => {
        void applyTimerEligibility({
          appIsActive: nextState === "active",
          changedAt: Date.now(),
        }).catch(() => undefined);
      },
    );

    return () => subscription.remove();
  }, [applyTimerEligibility]);

  const setTaskName = useCallback(
    (taskName: string) =>
      enqueue(async () => {
        const normalized = taskName.trim();
        if (!normalized) {
          throw new Error("タスク名を入力してください。");
        }
        const current = requireState();
        const nextState = { ...current, taskName: normalized };
        await repository.save(nextState);
        commitState(nextState);
      }),
    [commitState, enqueue, repository, requireState],
  );

  const markStoryRead = useCallback(
    (episodeId: EpisodeId) =>
      enqueue(async () => {
        const current = requireState();
        const storyIndex = current.unlockedStories.findIndex(
          (story) => story.episodeId === episodeId,
        );
        if (storyIndex === -1 || current.unlockedStories[storyIndex].isRead) {
          return;
        }

        const nextState: AppState = {
          ...current,
          unlockedStories: current.unlockedStories.map((story, index) =>
            index === storyIndex ? { ...story, isRead: true } : story,
          ),
        };
        await repository.save(nextState);
        commitState(nextState);
      }),
    [commitState, enqueue, repository, requireState],
  );

  const startTimer = useCallback(
    (plannedSeconds: number) =>
      enqueue(async () => {
        assertPlannedSeconds(plannedSeconds);
        const current = requireState();
        if (current.activeTimer) {
          return current.activeTimer;
        }

        const activeTimer: ActiveTimer = {
          sessionId: makeSessionId(),
          plannedSeconds,
          startedTaskName: current.taskName,
          accumulatedMs: 0,
          // The timer route resumes this segment after it is actually focused.
          runningSince: null,
        };
        const nextState = { ...current, activeTimer };
        await repository.save(nextState);
        commitState(nextState);
        return activeTimer;
      }),
    [commitState, enqueue, repository, requireState],
  );

  const cancelTimer = useCallback(
    (cancelledAt = Date.now()) =>
      enqueue(async () => {
        const current = requireState();
        const outcome = cancelTimerState(current, cancelledAt);
        if (!current.activeTimer) {
          return false;
        }
        if (!outcome.cancelled) {
          throw new TimerNotReadyError();
        }

        await repository.save(outcome.state);
        commitState(outcome.state);
        return true;
      }),
    [commitState, enqueue, repository, requireState],
  );

  const finishTimer = useCallback(
    (finishedAt = Date.now()) =>
      enqueue(async () => {
        const current = requireState();
        const outcome = completeTimer(current, finishedAt);
        if (outcome.status === "no-active-timer") {
          throw new NoActiveTimerError();
        }
        if (outcome.status === "not-ready") {
          throw new TimerNotReadyError();
        }

        await repository.save(outcome.state);
        commitState(outcome.state);
        return outcome;
      }),
    [commitState, enqueue, repository, requireState],
  );

  const value = useMemo<AppStateContextValue>(
    () => ({
      state,
      status,
      hydrationError,
      retryHydration,
      setTaskName,
      markStoryRead,
      startTimer,
      setTimerRouteFocused,
      cancelTimer,
      finishTimer,
    }),
    [
      cancelTimer,
      finishTimer,
      hydrationError,
      markStoryRead,
      retryHydration,
      setTaskName,
      setTimerRouteFocused,
      startTimer,
      state,
      status,
    ],
  );

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppStateContextValue {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used inside AppStateProvider");
  }
  return context;
}

export { createInitialAppState };


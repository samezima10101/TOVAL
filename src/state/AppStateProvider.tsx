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
import { selectStoryRoute, purchaseStoryRoute, purchaseSideStory } from "@/src/domain/conversation";
import {
  cancelTimer as cancelTimerState,
  completeTimer,
  CompletionOutcome,
} from "@/src/domain/completion";
import { pauseTimer, resumeTimer } from "@/src/domain/timer";
import { localDateKey, localTimeKey } from "@/src/domain/common/date";
import { editDiary } from "@/src/domain/diary";
import { listAvailableConversations } from "@/src/domain/sideStory";
import {
  STORY_CATALOG,
  StoryCatalog,
} from "@/src/domain/storyData";
import {
  appStateRepository,
  AppStateRepository,
  createInitialAppState,
  PreservedDataError,
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
  initializePreservedData: () => Promise<void>;
  timerSaveError: string | null;
  retryTimerSave: () => Promise<void>;
  setTaskName: (taskName: string) => Promise<void>;
  setBgmEnabled: (enabled: boolean) => Promise<void>;
  updateDiary: (logId: string, diary: string) => Promise<void>;
  selectInitialStoryRoute: (episodeId: EpisodeId, routeId: string) => Promise<void>;
  unlockAdditionalStoryRoute: (episodeId: EpisodeId, routeId: string) => Promise<void>;
  unlockSideStory: (conversationId: number) => Promise<void>;
  announceSideStories: (conversationIds: readonly number[]) => Promise<void>;
  startTimer: (plannedSeconds: number) => Promise<ActiveTimer>;
  setTimerRouteFocused: (focused: boolean, changedAt?: number) => Promise<void>;
  cancelTimer: (cancelledAt?: number) => Promise<boolean>;
  finishTimer: (finishedAt?: number, diary?: string) => Promise<CompletionOutcome>;
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
  catalog = STORY_CATALOG,
}: {
  children: ReactNode;
  repository?: AppStateRepository;
  catalog?: StoryCatalog;
}) {
  const [state, setState] = useState<AppState | null>(null);
  const [status, setStatus] = useState<HydrationStatus>("loading");
  const [hydrationError, setHydrationError] = useState<Error | null>(null);
  const [timerSaveError, setTimerSaveError] = useState<string | null>(null);
  const stateRef = useRef<AppState | null>(null);
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const appIsActiveRef = useRef(NativeAppState.currentState === "active");
  const timerRouteFocusedRef = useRef(false);
  const timerRevisionRef = useRef(0);
  const timerSaveBlockedRef = useRef(false);

  const commitState = useCallback((nextState: AppState) => {
    stateRef.current = nextState;
    setState(nextState);
  }, []);

  const saveAndCommit = useCallback(async (nextState: AppState) => {
    const revision = timerRevisionRef.current;
    try {
      await repository.save(nextState);
    } catch (error) {
      if (error instanceof PreservedDataError) {
        setHydrationError(error);
        setStatus("error");
        stateRef.current = null;
      }
      throw error;
    }
    // A native lifecycle/focus event may pause the live segment while a write
    // is in flight. Never restore that older running segment on completion.
    const live = stateRef.current?.activeTimer;
    commitState(revision !== timerRevisionRef.current && live &&
      nextState.activeTimer?.sessionId === live.sessionId
      ? { ...nextState, activeTimer: live }
      : nextState);
    if (!nextState.activeTimer) {
      timerSaveBlockedRef.current = false;
      setTimerSaveError(null);
    }
  }, [commitState, repository]);

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
    ({ appIsActive, routeFocused, changedAt }: TimerEligibilityChange) => {
      if (appIsActive !== undefined) appIsActiveRef.current = appIsActive;
      if (routeFocused !== undefined) timerRouteFocusedRef.current = routeFocused;
      timerRevisionRef.current += 1;
      const observed = stateRef.current;
      // Pausing is a synchronous safety operation, independent of storage and
      // the mutation queue. Business changes still require a successful write.
      if (observed?.activeTimer && (!appIsActiveRef.current || !timerRouteFocusedRef.current)) {
        commitState({ ...observed, activeTimer: pauseTimer(observed.activeTimer, changedAt) });
      }
      return enqueue(async () => {
        const current = stateRef.current;
        if (!current?.activeTimer || timerSaveBlockedRef.current) return;
        try {
          // Persist the paused accumulation first. Only begin a new segment
          // after success, using the current eligibility and current time.
          await saveAndCommit(current);
          const live = stateRef.current;
          if (live?.activeTimer && appIsActiveRef.current && timerRouteFocusedRef.current) {
            commitState({ ...live, activeTimer: resumeTimer(live.activeTimer, Date.now()) });
          }
        } catch (error) {
          timerSaveBlockedRef.current = true;
          const live = stateRef.current;
          if (live?.activeTimer) {
            commitState({ ...live, activeTimer: pauseTimer(live.activeTimer, Date.now()) });
          }
          setTimerSaveError("タイマーの停止・再開を保存できませんでした。計測を停止しています。再試行が成功すると、計測できる画面で再開します。");
          throw error;
        }
      });
    },
    [commitState, enqueue, saveAndCommit],
  );

  const retryTimerSave = useCallback(async () => {
    await enqueue(async () => {
      const current = stateRef.current;
      if (!current) return;
      await saveAndCommit(current);
      timerSaveBlockedRef.current = false;
      setTimerSaveError(null);
    });
    await applyTimerEligibility({ changedAt: Date.now() });
  }, [applyTimerEligibility, enqueue, saveAndCommit]);

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
      timerSaveBlockedRef.current = false;
      setTimerSaveError(null);
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

  const initializePreservedData = useCallback(async () => {
    await enqueue(() => repository.initializePreservedData());
    await retryHydration();
  }, [enqueue, repository, retryHydration]);

  useEffect(() => {
    // Storage hydration also drives retry UI; it is an external-system effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
        await saveAndCommit(nextState);
      }),
    [enqueue, requireState, saveAndCommit],
  );

  const setBgmEnabled = useCallback(
    (enabled: boolean) => enqueue(async () => {
      const current = requireState();
      if (current.bgmEnabled !== enabled) {
        await saveAndCommit({ ...current, bgmEnabled: enabled });
      }
    }),
    [enqueue, requireState, saveAndCommit],
  );

  const updateDiary = useCallback(
    (logId: string, diary: string) => enqueue(async () => {
      await saveAndCommit(editDiary(requireState(), logId, diary));
    }),
    [enqueue, requireState, saveAndCommit],
  );

  const selectInitialStoryRoute = useCallback(
    (episodeId: EpisodeId, routeId: string) => enqueue(async () => {
      const current = requireState();
      const next = selectStoryRoute(current, episodeId, routeId, catalog);
      if (next !== current) await saveAndCommit(next);
    }),
    [catalog, enqueue, requireState, saveAndCommit],
  );

  const unlockAdditionalStoryRoute = useCallback(
    (episodeId: EpisodeId, routeId: string) => enqueue(async () => {
      const current = requireState();
      const next = purchaseStoryRoute(current, episodeId, routeId, catalog);
      if (next !== current) await saveAndCommit(next);
    }),
    [catalog, enqueue, requireState, saveAndCommit],
  );

  const unlockSideStory = useCallback(
    (conversationId: number) => enqueue(async () => {
      const current = requireState();
      const next = purchaseSideStory(current, conversationId);
      if (next !== current) await saveAndCommit(next);
    }),
    [enqueue, requireState, saveAndCommit],
  );

  const announceSideStories = useCallback(
    (conversationIds: readonly number[]) => enqueue(async () => {
      const current = requireState();
      const newIds = listAvailableConversations(current)
        .filter((item) => conversationIds.includes(item.id) && !current.announcedSideStoryIds.includes(item.id))
        .map((item) => item.id);
      if (!newIds.length) return;
      const nextState = { ...current, announcedSideStoryIds: [...current.announcedSideStoryIds, ...newIds] };
      await saveAndCommit(nextState);
    }),
    [enqueue, requireState, saveAndCommit],
  );

  const startTimer = useCallback(
    (plannedSeconds: number) => {
      // Capture at the button call, before waiting for any queued storage work.
      const pressedAt = Date.now();
      const startInfo = {
        startedAt: pressedAt,
        startedDate: localDateKey(pressedAt),
        startedTime: localTimeKey(pressedAt),
      };
      return enqueue(async () => {
        assertPlannedSeconds(plannedSeconds);
        const current = requireState();
        if (current.activeTimer) {
          return current.activeTimer;
        }

        const activeTimer: ActiveTimer = {
          startInfo,
          sessionId: makeSessionId(),
          plannedSeconds,
          startedTaskName: current.taskName,
          accumulatedMs: 0,
          // The timer route resumes this segment after it is actually focused.
          runningSince: null,
        };
        const nextState = { ...current, activeTimer };
        await saveAndCommit(nextState);
        return activeTimer;
      });
    },
    [enqueue, requireState, saveAndCommit],
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

        await saveAndCommit(outcome.state);
        return true;
      }),
    [enqueue, requireState, saveAndCommit],
  );

  const finishTimer = useCallback(
    (finishedAt = Date.now(), diary = "") =>
      enqueue(async () => {
        const current = requireState();
        const outcome = completeTimer(current, finishedAt, catalog, diary);
        if (outcome.status === "no-active-timer") {
          throw new NoActiveTimerError();
        }
        if (outcome.status === "not-ready") {
          throw new TimerNotReadyError();
        }

        await saveAndCommit(outcome.state);
        return outcome;
      }),
    [catalog, enqueue, requireState, saveAndCommit],
  );

  const value = useMemo<AppStateContextValue>(
    () => ({
      state,
      status,
      hydrationError,
      retryHydration,
      initializePreservedData,
      timerSaveError,
      retryTimerSave,
      setTaskName,
      setBgmEnabled,
      updateDiary,
      selectInitialStoryRoute,
      unlockAdditionalStoryRoute,
      unlockSideStory,
      announceSideStories,
      startTimer,
      setTimerRouteFocused,
      cancelTimer,
      finishTimer,
    }),
    [
      cancelTimer,
      finishTimer,
      hydrationError,
      initializePreservedData,
      timerSaveError,
      retryTimerSave,
      retryHydration,
      selectInitialStoryRoute,
      unlockAdditionalStoryRoute,
      unlockSideStory,
      announceSideStories,
      setTaskName,
      setBgmEnabled,
      updateDiary,
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


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

import {
  cancelTimer as cancelTimerState,
  completeTimer,
  CompletionOutcome,
} from "@/src/domain/completion";
import { MAX_PLANNED_SECONDS, AppState, ActiveTimer } from "@/src/domain/types";
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
  startTimer: (plannedSeconds: number) => Promise<ActiveTimer>;
  cancelTimer: (cancelledAt?: number) => Promise<boolean>;
  finishTimer: (finishedAt?: number) => Promise<CompletionOutcome>;
};

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

function makeSessionId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function assertPlannedSeconds(value: number): asserts value is number {
  if (
    !Number.isInteger(value) ||
    value < 0 ||
    value > MAX_PLANNED_SECONDS
  ) {
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

  const commitState = useCallback((nextState: AppState) => {
    stateRef.current = nextState;
    setState(nextState);
  }, []);

  const retryHydration = useCallback(async () => {
    setStatus("loading");
    setHydrationError(null);
    try {
      const loaded = await repository.load();
      stateRef.current = loaded;
      setState(loaded);
      setStatus("ready");
    } catch (error) {
      const normalized = error instanceof Error ? error : new Error(String(error));
      setHydrationError(normalized);
      setStatus("error");
    }
  }, [repository]);

  useEffect(() => {
    void retryHydration();
  }, [retryHydration]);

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
          startedAt: Date.now(),
          plannedSeconds,
          startedTaskName: current.taskName,
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
      startTimer,
      cancelTimer,
      finishTimer,
    }),
    [
      cancelTimer,
      finishTimer,
      hydrationError,
      retryHydration,
      setTaskName,
      startTimer,
      state,
      status,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateContextValue {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used inside AppStateProvider");
  }
  return context;
}

export { createInitialAppState };

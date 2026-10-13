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
  STORY_ROUTE_UNLOCK_COST_NT,
} from "@/src/domain/common/types";
import { SIDE_STORY_COST_NT } from "@/src/content/shop";
import {
  cancelTimer as cancelTimerState,
  completeTimer,
  CompletionOutcome,
} from "@/src/domain/completion";
import { pauseTimer, resumeTimer } from "@/src/domain/timer";
import { listAvailableConversations } from "@/src/domain/sideStory";
import {
  STORY_CATALOG,
  StoryCatalog,
  getStoryEpisode,
  getStoryRoute,
} from "@/src/domain/storyData";
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

export class StoryRouteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StoryRouteError";
  }
}

type AppStateContextValue = {
  state: AppState | null;
  status: HydrationStatus;
  hydrationError: Error | null;
  retryHydration: () => Promise<void>;
  setTaskName: (taskName: string) => Promise<void>;
  setTutorialProfile: (userName: string, taskName: string) => Promise<void>;
  advanceTutorial: () => Promise<void>;
  markStoryRead: (episodeId: EpisodeId) => Promise<void>;
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
        await repository.save(nextState);
        commitState(nextState);
      }),
    [commitState, enqueue, repository, requireState],
  );

  const setTutorialProfile = useCallback(
    (userName: string, taskName: string) => enqueue(async () => {
      const current = requireState();
      if (current.tutorialStep !== "intro") return;
      if (!userName.trim() || !taskName.trim()) {
        throw new Error("名前とタスクを入力してください。");
      }
      const nextState = { ...current, userName: userName.trim(), taskName: taskName.trim() };
      await repository.save(nextState);
      commitState(nextState);
    }),
    [commitState, enqueue, repository, requireState],
  );

  const advanceTutorial = useCallback(
    () => enqueue(async () => {
      const current = requireState();
      const nextStep = current.tutorialStep === "intro" && current.userName.trim() && current.taskName.trim()
        ? "navigation" : current.tutorialStep === "navigation" ? "start" : current.tutorialStep === "talk" ? "episode" : null;
      if (!nextStep) return;
      const nextState: AppState = { ...current, tutorialStep: nextStep };
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
          ...(current.tutorialStep === "episode" && episodeId === catalog.episodes[0]?.id
            ? { tutorialStep: "complete" as const } : {}),
          unlockedStories: current.unlockedStories.map((story, index) =>
            index === storyIndex ? { ...story, isRead: true } : story,
          ),
        };
        await repository.save(nextState);
        commitState(nextState);
      }),
    [catalog, commitState, enqueue, repository, requireState],
  );

  const selectInitialStoryRoute = useCallback(
    (episodeId: EpisodeId, routeId: string) =>
      enqueue(async () => {
        const current = requireState();
        if (!current.unlockedStories.some((story) => story.episodeId === episodeId)) {
          throw new StoryRouteError("このストーリーはまだ解放されていません。");
        }
        const episode = getStoryEpisode(episodeId, catalog);
        const route = episode && getStoryRoute(episode, routeId);
        if (!episode?.routes?.length || !route) {
          throw new StoryRouteError("選択肢が見つかりません。");
        }
        const progress = current.storyRouteProgress[episodeId];
        if (progress?.firstSelectedRouteId) {
          throw new StoryRouteError("初回の選択肢はすでに選択されています。");
        }
        if (progress?.extraUnlockedRouteIds.includes(routeId)) {
          throw new StoryRouteError("この選択肢はすでに解放されています。");
        }

        const nextState = {
          ...current,
          storyRouteProgress: {
            ...current.storyRouteProgress,
            [episodeId]: {
              firstSelectedRouteId: routeId,
              extraUnlockedRouteIds: [...(progress?.extraUnlockedRouteIds ?? [])],
            },
          },
        };
        await repository.save(nextState);
        commitState(nextState);
      }),
    [catalog, commitState, enqueue, repository, requireState],
  );

  const unlockAdditionalStoryRoute = useCallback(
    (episodeId: EpisodeId, routeId: string) =>
      enqueue(async () => {
        const current = requireState();
        if (!current.unlockedStories.some((story) => story.episodeId === episodeId)) {
          throw new StoryRouteError("このストーリーはまだ解放されていません。");
        }
        const episode = getStoryEpisode(episodeId, catalog);
        const route = episode && getStoryRoute(episode, routeId);
        if (!episode?.routes?.length || !route) {
          throw new StoryRouteError("選択肢が見つかりません。");
        }
        const progress = current.storyRouteProgress[episodeId];
        if (!progress?.firstSelectedRouteId) {
          throw new StoryRouteError("初回の選択肢を選んでから解放してください。");
        }
        if (progress.firstSelectedRouteId === routeId) {
          throw new StoryRouteError("この選択肢はすでに解放されています。");
        }
        if (progress.extraUnlockedRouteIds.includes(routeId)) {
          throw new StoryRouteError("この選択肢はすでに解放されています。");
        }
        if (current.totalNt < STORY_ROUTE_UNLOCK_COST_NT) {
          throw new StoryRouteError(
            `NTが不足しています（必要: ${STORY_ROUTE_UNLOCK_COST_NT} NT）。`,
          );
        }

        const nextState = {
          ...current,
          totalNt: current.totalNt - STORY_ROUTE_UNLOCK_COST_NT,
          storyRouteProgress: {
            ...current.storyRouteProgress,
            [episodeId]: {
              firstSelectedRouteId: progress.firstSelectedRouteId,
              extraUnlockedRouteIds: [
                ...progress.extraUnlockedRouteIds,
                routeId,
              ],
            },
          },
        };
        await repository.save(nextState);
        commitState(nextState);
      }),
    [catalog, commitState, enqueue, repository, requireState],
  );

  const unlockSideStory = useCallback(
    (conversationId: number) =>
      enqueue(async () => {
        const current = requireState();
        const conversation = listAvailableConversations(current).find((item) => item.id === conversationId);
        if (!conversation) throw new Error("この会話はまだ入荷していません。");
        if (current.purchasedSideStoryIds.includes(conversationId)) return;
        if (current.totalNt < SIDE_STORY_COST_NT) {
          throw new Error(`NTが不足しています（必要: ${SIDE_STORY_COST_NT} NT）。`);
        }
        const nextState = {
          ...current,
          totalNt: current.totalNt - SIDE_STORY_COST_NT,
          purchasedSideStoryIds: [...current.purchasedSideStoryIds, conversationId],
        };
        await repository.save(nextState);
        commitState(nextState);
      }),
    [commitState, enqueue, repository, requireState],
  );

  const announceSideStories = useCallback(
    (conversationIds: readonly number[]) => enqueue(async () => {
      const current = requireState();
      const newIds = listAvailableConversations(current)
        .filter((item) => conversationIds.includes(item.id) && !current.announcedSideStoryIds.includes(item.id))
        .map((item) => item.id);
      if (!newIds.length) return;
      const nextState = { ...current, announcedSideStoryIds: [...current.announcedSideStoryIds, ...newIds] };
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
        const nextState: AppState = { ...current, activeTimer,
          ...(current.tutorialStep === "start" ? { tutorialStep: "timer" as const } : {}),
        };
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

        const nextState: AppState = { ...outcome.state,
          ...(current.tutorialStep === "timer" ? { tutorialStep: "talk" as const } : {}),
        };
        await repository.save(nextState);
        commitState(nextState);
        return { ...outcome, state: nextState };
      }),
    [catalog, commitState, enqueue, repository, requireState],
  );

  const value = useMemo<AppStateContextValue>(
    () => ({
      state,
      status,
      hydrationError,
      retryHydration,
      setTaskName,
      setTutorialProfile,
      advanceTutorial,
      markStoryRead,
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
      markStoryRead,
      retryHydration,
      selectInitialStoryRoute,
      unlockAdditionalStoryRoute,
      unlockSideStory,
      announceSideStories,
      setTaskName,
      setTutorialProfile,
      advanceTutorial,
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


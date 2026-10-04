import mockAsyncStorage from "@react-native-async-storage/async-storage/jest/async-storage-mock";
import React from "react";
import { AppState as NativeAppState } from "react-native";
import TestRenderer, { act } from "react-test-renderer";

import {
  APP_SCHEMA_VERSION,
  AppState,
  SIDE_STORY_COST_NT,
  STORY_ROUTE_UNLOCK_COST_NT,
} from "@/src/domain/common/types";
import {
  AppStateProvider,
  StoryRouteError,
  TimerNotReadyError,
  useAppState,
} from "@/src/state/AppStateProvider";
import { AppStateRepository } from "@/src/storage/appStateRepository";
import {
  branchingEpisodeId,
  primaryRoute,
  secondaryRoute,
  storyCatalog,
} from "./fixtures/story";

jest.mock("@react-native-async-storage/async-storage", () => mockAsyncStorage);
type TestRepository = AppStateRepository & {
  state: AppState;
  failWrite: boolean;
  savedStates: AppState[];
};
type AppStateContext = ReturnType<typeof useAppState>;
type NativeAppStateChange = (nextState: "active" | "background") => void;

type ProviderHarness = {
  readonly context: AppStateContext;
  unmount: () => Promise<void>;
};

type NativeAppStateFixture = {
  emit: NativeAppStateChange;
  restore: () => void;
};

function makeInitialState(
  activeTimer: AppState["activeTimer"] = null,
): AppState {
  return {
    schemaVersion: APP_SCHEMA_VERSION,
    userName: "",
    taskName: "読書",
    totalNt: 0,
    totalCompletions: 0,
    lastCompletionDate: null,
    unlockedStories: [],
    storyRouteProgress: {},
    purchasedSideStoryIds: [],
    announcedSideStoryIds: [],
    activeTimer,
  };
}

function makeRepository(): TestRepository {
  const repository: TestRepository = {
    state: makeInitialState(),
    failWrite: false,
    savedStates: [],
    async load() {
      return repository.state;
    },
    async save(nextState) {
      if (repository.failWrite) {
        throw new Error("write failed");
      }
      repository.state = nextState;
      repository.savedStates.push(nextState);
    },
  };
  return repository;
}

async function renderProvider(
  repository: AppStateRepository,
): Promise<ProviderHarness> {
  let context!: AppStateContext;
  const Probe = () => {
    context = useAppState();
    return null;
  };
  let renderer!: TestRenderer.ReactTestRenderer;

  await act(async () => {
    renderer = TestRenderer.create(
      <AppStateProvider repository={repository} catalog={storyCatalog}>
        <Probe />
      </AppStateProvider>,
    );
  });

  return {
    get context() {
      return context;
    },
    unmount: async () => {
      await act(async () => {
        renderer.unmount();
      });
    },
  };
}

function mockNativeAppState(
  initialState?: string | null,
): NativeAppStateFixture {
  const nativeAppState = NativeAppState as unknown as {
    currentState: string | null;
  };
  const previousAppState = nativeAppState.currentState;
  if (initialState !== undefined) {
    nativeAppState.currentState = initialState;
  }

  let appStateChange!: NativeAppStateChange;
  const appStateSpy = jest
    .spyOn(NativeAppState, "addEventListener")
    .mockImplementation((type, listener) => {
      if (type === "change") {
        appStateChange = listener as NativeAppStateChange;
      }
      return { remove: jest.fn() };
    });

  return {
    emit: (nextState) => appStateChange(nextState),
    restore: () => {
      appStateSpy.mockRestore();
      nativeAppState.currentState = previousAppState;
    },
  };
}

const flushLifecycle = () =>
  new Promise<void>((resolve) => setTimeout(resolve, 0));

describe("AppStateProvider persistence ordering", () => {
  it("does not publish a state change when saving the snapshot fails", async () => {
    const repository = makeRepository();
    const harness = await renderProvider(repository);

    try {
      repository.failWrite = true;
      await act(async () => {
        await expect(harness.context.startTimer(0)).rejects.toThrow(
          "write failed",
        );
      });
      expect(harness.context.state?.activeTimer).toBeNull();

      repository.failWrite = false;
      await act(async () => {
        await harness.context.startTimer(0);
      });
      expect(harness.context.state?.activeTimer).not.toBeNull();

      repository.failWrite = true;
      await act(async () => {
        await expect(harness.context.finishTimer(Date.now())).rejects.toThrow(
          "write failed",
        );
      });
      expect(harness.context.state?.activeTimer).not.toBeNull();
    } finally {
      await harness.unmount();
    }
  });
});

describe("AppStateProvider story read state", () => {
  it("persists a read story, is idempotent, and leaves state unchanged on failure", async () => {
    const repository = makeRepository();
    repository.state = {
      ...repository.state,
      unlockedStories: [
        { episodeId: 1, unlockedDate: "2025-01-01", isRead: false },
        { episodeId: 2, unlockedDate: "2025-01-02", isRead: false },
      ],
    };
    const harness = await renderProvider(repository);

    try {
      await act(async () => {
        await harness.context.markStoryRead(1);
      });
      expect(repository.state.unlockedStories).toEqual([
        { episodeId: 1, unlockedDate: "2025-01-01", isRead: true },
        { episodeId: 2, unlockedDate: "2025-01-02", isRead: false },
      ]);
      expect(repository.savedStates).toHaveLength(1);

      await act(async () => {
        await harness.context.markStoryRead(1);
      });
      expect(repository.savedStates).toHaveLength(1);

      repository.failWrite = true;
      await act(async () => {
        await expect(harness.context.markStoryRead(2)).rejects.toThrow(
          "write failed",
        );
      });
      expect(harness.context.state?.unlockedStories).toEqual(
        repository.state.unlockedStories,
      );
      expect(repository.state.unlockedStories[1].isRead).toBe(false);
    } finally {
      await harness.unmount();
    }
  });
});

describe("AppStateProvider story route progress", () => {
  it("selects one free initial route and unlocks another route with NT", async () => {
    const repository = makeRepository();
    repository.state = {
      ...repository.state,
      totalNt: STORY_ROUTE_UNLOCK_COST_NT,
      unlockedStories: [
        { episodeId: branchingEpisodeId, unlockedDate: "2025-01-01", isRead: false },
      ],
    };
    const harness = await renderProvider(repository);

    try {
      await act(async () => {
        await harness.context.selectInitialStoryRoute(
          branchingEpisodeId,
          primaryRoute.id,
        );
      });
      expect(repository.state.storyRouteProgress).toEqual({
        [branchingEpisodeId]: {
          firstSelectedRouteId: primaryRoute.id,
          extraUnlockedRouteIds: [],
        },
      });
      expect(repository.state.totalNt).toBe(STORY_ROUTE_UNLOCK_COST_NT);

      await act(async () => {
        await harness.context.unlockAdditionalStoryRoute(
          branchingEpisodeId,
          secondaryRoute.id,
        );
      });
      expect(repository.state.storyRouteProgress[branchingEpisodeId]).toEqual({
        firstSelectedRouteId: primaryRoute.id,
        extraUnlockedRouteIds: [secondaryRoute.id],
      });
      expect(repository.state.totalNt).toBe(0);
      expect(repository.savedStates).toHaveLength(2);
    } finally {
      await harness.unmount();
    }
  });

  it("rejects route unlock before the initial choice and when NT is insufficient", async () => {
    const repository = makeRepository();
    repository.state = {
      ...repository.state,
      unlockedStories: [
        { episodeId: branchingEpisodeId, unlockedDate: "2025-01-01", isRead: false },
      ],
    };
    const harness = await renderProvider(repository);

    try {
      await act(async () => {
        await expect(
          harness.context.unlockAdditionalStoryRoute(
            branchingEpisodeId,
            secondaryRoute.id,
          ),
        ).rejects.toBeInstanceOf(StoryRouteError);
      });
      await act(async () => {
        await harness.context.selectInitialStoryRoute(
          branchingEpisodeId,
          primaryRoute.id,
        );
      });
      await act(async () => {
        await expect(
          harness.context.unlockAdditionalStoryRoute(
            branchingEpisodeId,
            secondaryRoute.id,
          ),
        ).rejects.toThrow("NTが不足しています");
      });
      expect(
        repository.state.storyRouteProgress[branchingEpisodeId]?.extraUnlockedRouteIds,
      ).toEqual(
        [],
      );
    } finally {
      await harness.unmount();
    }
  });
});

describe("AppStateProvider side story", () => {
  it("rejects unavailable purchases and saves notifications once only after a successful write", async () => {
    const repository = makeRepository();
    repository.state.totalNt = 180;
    const harness = await renderProvider(repository);
    try {
      await act(async () => {
        await expect(harness.context.unlockSideStory(102)).rejects.toThrow("まだ入荷");
        await expect(harness.context.unlockSideStory(999)).rejects.toThrow("まだ入荷");
      });
      repository.failWrite = true;
      await act(async () => {
        await expect(harness.context.announceSideStories([101])).rejects.toThrow("write failed");
      });
      expect(harness.context.state?.announcedSideStoryIds).toEqual([]);
      repository.failWrite = false;
      await act(async () => {
        await harness.context.announceSideStories([101, 101, 102, 999]);
        await harness.context.announceSideStories([101]);
      });
      expect(repository.state.announcedSideStoryIds).toEqual([101]);
      expect(repository.state.totalNt).toBe(180);
      expect(repository.savedStates).toHaveLength(1);
    } finally {
      await harness.unmount();
    }
  });

  it("deducts NT once and keeps the story locked when saving fails", async () => {
    const repository = makeRepository();
    repository.state = { ...repository.state, totalNt: SIDE_STORY_COST_NT };
    const harness = await renderProvider(repository);
    try {
      repository.failWrite = true;
      await act(async () => {
        await expect(harness.context.unlockSideStory(101)).rejects.toThrow("write failed");
      });
      expect(harness.context.state?.totalNt).toBe(SIDE_STORY_COST_NT);
      expect(harness.context.state?.purchasedSideStoryIds).toEqual([]);
      repository.failWrite = false;
      await act(async () => {
        await Promise.all([harness.context.unlockSideStory(101), harness.context.unlockSideStory(101)]);
      });
      expect(repository.state.totalNt).toBe(0);
      expect(repository.state.purchasedSideStoryIds).toEqual([101]);
      expect(repository.savedStates).toHaveLength(1);
    } finally {
      await harness.unmount();
    }
  });

  it("does not unlock without enough NT", async () => {
    const repository = makeRepository();
    const harness = await renderProvider(repository);
    try {
      await act(async () => {
        await expect(harness.context.unlockSideStory(101)).rejects.toThrow("NTが不足");
      });
      expect(repository.savedStates).toHaveLength(0);
    } finally {
      await harness.unmount();
    }
  });
});

describe("AppStateProvider timer lifecycle", () => {
  it("counts only eligible route time and ignores repeated transitions and inactive gaps", async () => {
    const repository = makeRepository();
    const appState = mockNativeAppState("active");
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(1_000);
    const harness = await renderProvider(repository);

    try {
      await act(async () => {
        await harness.context.startTimer(3);
        await harness.context.setTimerRouteFocused(true, 1_000);
        await harness.context.setTimerRouteFocused(true, 1_100);
      });
      expect(repository.savedStates).toHaveLength(2);
      expect(repository.state.activeTimer).toMatchObject({
        accumulatedMs: 0,
        runningSince: 1_000,
      });

      nowSpy.mockReturnValue(2_250);
      await act(async () => {
        appState.emit("background");
        await flushLifecycle();
      });
      expect(repository.state.activeTimer).toMatchObject({
        accumulatedMs: 1_250,
        runningSince: null,
      });
      expect(repository.savedStates).toHaveLength(3);

      nowSpy.mockReturnValue(4_000);
      await act(async () => {
        appState.emit("background");
        appState.emit("background");
        await flushLifecycle();
      });
      expect(repository.savedStates).toHaveLength(3);

      nowSpy.mockReturnValue(5_000);
      await act(async () => {
        appState.emit("active");
        await flushLifecycle();
      });
      expect(repository.state.activeTimer?.runningSince).toBe(5_000);

      await act(async () => {
        await harness.context.setTimerRouteFocused(false, 5_500);
      });
      expect(repository.state.activeTimer).toMatchObject({
        accumulatedMs: 1_750,
        runningSince: null,
      });

      nowSpy.mockReturnValue(9_000);
      await act(async () => {
        appState.emit("active");
        await flushLifecycle();
        await harness.context.setTimerRouteFocused(false, 9_000);
        await harness.context.setTimerRouteFocused(true, 9_000);
      });
      expect(repository.state.activeTimer?.runningSince).toBe(9_000);

      let outcome!: Awaited<ReturnType<typeof harness.context.finishTimer>>;
      await act(async () => {
        outcome = await harness.context.finishTimer(10_250);
      });
      expect(outcome.earnedNt).toBe(3);
      expect(outcome.unlockedEpisode).toBe(branchingEpisodeId);
      expect(repository.state.unlockedStories).toEqual([
        {
          episodeId: branchingEpisodeId,
          unlockedDate: "1970-01-01",
          isRead: false,
        },
      ]);
      expect(repository.state.activeTimer).toBeNull();
    } finally {
      await harness.unmount();
      appState.restore();
      nowSpy.mockRestore();
    }
  });

  it("hydrates an old running segment paused without crediting closed time", async () => {
    const appState = mockNativeAppState("background");
    const repository = makeRepository();
    repository.state = makeInitialState({
      sessionId: "relaunch-session",
      plannedSeconds: 60,
      startedTaskName: "読書",
      accumulatedMs: 750,
      runningSince: 1_000,
    });
    const harness = await renderProvider(repository);

    try {
      expect(harness.context.state?.activeTimer).toMatchObject({
        accumulatedMs: 750,
        runningSince: null,
      });
      expect(repository.savedStates).toHaveLength(1);
      await expect(harness.context.finishTimer(61_000)).rejects.toBeInstanceOf(
        TimerNotReadyError,
      );
    } finally {
      await harness.unmount();
      appState.restore();
    }
  });

  it("reconciles route focus reported before hydration resolves", async () => {
    const appState = mockNativeAppState("active");
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(1_000);
    let resolveLoad!: (state: AppState) => void;
    const loadPromise = new Promise<AppState>((resolve) => {
      resolveLoad = resolve;
    });
    const savedStates: AppState[] = [];
    const repository: AppStateRepository = {
      load: () => loadPromise,
      save: async (state) => {
        savedStates.push(state);
      },
    };
    const harness = await renderProvider(repository);

    try {
      await act(async () => {
        await harness.context.setTimerRouteFocused(true, 1_000);
      });
      expect(harness.context.status).toBe("loading");

      await act(async () => {
        resolveLoad(
          makeInitialState({
            sessionId: "hydrated-session",
            plannedSeconds: 60,
            startedTaskName: "読書",
            accumulatedMs: 750,
            runningSince: null,
          }),
        );
        await flushLifecycle();
      });

      expect(harness.context.status).toBe("ready");
      expect(harness.context.state?.activeTimer).toMatchObject({
        accumulatedMs: 750,
        runningSince: 1_000,
      });
      expect(savedStates).toHaveLength(1);
    } finally {
      await harness.unmount();
      appState.restore();
      nowSpy.mockRestore();
    }
  });
});

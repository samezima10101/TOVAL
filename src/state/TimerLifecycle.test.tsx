import mockAsyncStorage from "@react-native-async-storage/async-storage/jest/async-storage-mock";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { AppState as NativeAppState } from "react-native";

import { AppState } from "@/src/domain/types";
import { AppStateRepository } from "@/src/storage/appStateRepository";
import { AppStateProvider, useAppState } from "./AppStateProvider";

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

type DeferredRepository = {
  repository: AppStateRepository;
  resolveLoad: (state: AppState) => void;
  savedStates: AppState[];
};

function makeInitialState(activeTimer: AppState["activeTimer"] = null): AppState {
  return {
    schemaVersion: 2,
    userName: "",
    taskName: "読書",
    totalNt: 0,
    totalCompletions: 0,
    lastCompletionDate: null,
    unlockedStories: [],
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

async function renderAppStateProvider(
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
      <AppStateProvider repository={repository}>
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

function mockNativeAppState(initialState?: string | null): NativeAppStateFixture {
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

function makeDeferredRepository(): DeferredRepository {
  let resolveLoad!: (state: AppState) => void;
  const loadPromise = new Promise<AppState>((resolve) => {
    resolveLoad = resolve;
  });
  const savedStates: AppState[] = [];

  return {
    repository: {
      load: () => loadPromise,
      save: async (nextState: AppState) => {
        savedStates.push(nextState);
      },
    },
    resolveLoad,
    savedStates,
  };
}

describe("AppStateProvider timer lifecycle", () => {
  it("counts only eligible route time and ignores repeated transitions and inactive gaps", async () => {
    const repository = makeRepository();
    const appState = mockNativeAppState("active");
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(1_000);
    const harness = await renderAppStateProvider(repository);

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
      appState.emit("background");
      await act(async () => {
        await harness.context.setTimerRouteFocused(true, 2_250);
      });
      expect(repository.state.activeTimer).toMatchObject({
        accumulatedMs: 1_250,
        runningSince: null,
      });
      expect(repository.savedStates).toHaveLength(3);

      nowSpy.mockReturnValue(4_000);
      appState.emit("background");
      appState.emit("background");
      await act(async () => {
        await harness.context.setTimerRouteFocused(true, 4_000);
      });
      expect(repository.savedStates).toHaveLength(3);

      nowSpy.mockReturnValue(5_000);
      appState.emit("active");
      await act(async () => {
        await harness.context.setTimerRouteFocused(true, 5_000);
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
      appState.emit("active");
      await act(async () => {
        await harness.context.setTimerRouteFocused(false, 9_000);
        await harness.context.setTimerRouteFocused(true, 9_000);
      });
      expect(repository.state.activeTimer?.runningSince).toBe(9_000);

      let outcome!: Awaited<ReturnType<typeof harness.context.finishTimer>>;
      await act(async () => {
        outcome = await harness.context.finishTimer(10_250);
      });
      expect(outcome.earnedNt).toBe(3);
      expect(repository.state.activeTimer).toBeNull();
    } finally {
      await harness.unmount();
      appState.restore();
      nowSpy.mockRestore();
    }
  });

  it("hydrates an unknown running segment paused without crediting relaunch time", async () => {
    const appState = mockNativeAppState();
    const repository = makeRepository();
    repository.state = makeInitialState({
      sessionId: "relaunch-session",
      plannedSeconds: 60,
      startedTaskName: "読書",
      accumulatedMs: 750,
      runningSince: 1_000,
    });
    const harness = await renderAppStateProvider(repository);

    try {
      expect(harness.context.state?.activeTimer).toMatchObject({
        accumulatedMs: 750,
        runningSince: null,
      });
      expect(repository.savedStates).toHaveLength(1);
      expect(repository.savedStates[0].activeTimer?.runningSince).toBeNull();
    } finally {
      await harness.unmount();
      appState.restore();
    }
  });

  it("reconciles route focus reported before hydration resolves", async () => {
    const appState = mockNativeAppState("active");
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(1_000);
    const { repository, resolveLoad, savedStates } = makeDeferredRepository();
    const harness = await renderAppStateProvider(repository);

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
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
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

  it("fails closed on a pause save error and resumes from the recovered active time", async () => {
    const repository = makeRepository();
    const appState = mockNativeAppState("active");
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(1_000);
    const harness = await renderAppStateProvider(repository);
    const flushLifecycle = () =>
      new Promise<void>((resolve) => setTimeout(resolve, 0));

    try {
      await act(async () => {
        await harness.context.startTimer(2);
        await harness.context.setTimerRouteFocused(true, 1_000);
      });

      repository.failWrite = true;
      nowSpy.mockReturnValue(2_000);
      await act(async () => {
        appState.emit("background");
        await flushLifecycle();
      });
      expect(harness.context.state?.activeTimer).toMatchObject({
        accumulatedMs: 1_000,
        runningSince: null,
      });

      repository.failWrite = false;
      nowSpy.mockReturnValue(7_000);
      await act(async () => {
        appState.emit("active");
        await flushLifecycle();
      });
      expect(harness.context.state?.activeTimer?.runningSince).toBe(7_000);

      let outcome!: Awaited<ReturnType<typeof harness.context.finishTimer>>;
      await act(async () => {
        outcome = await harness.context.finishTimer(8_000);
      });
      expect(outcome.earnedNt).toBe(2);
      expect(harness.context.state?.activeTimer).toBeNull();
    } finally {
      await harness.unmount();
      appState.restore();
      nowSpy.mockRestore();
    }
  });
});

import mockAsyncStorage from "@react-native-async-storage/async-storage/jest/async-storage-mock";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { AppState as NativeAppState } from "react-native";

import { AppState } from "@/src/domain/types";
import { AppStateProvider, useAppState } from "./AppStateProvider";

jest.mock("@react-native-async-storage/async-storage", () => mockAsyncStorage);

type TestRepository = {
  state: AppState;
  failWrite: boolean;
  savedStates: AppState[];
  load: () => Promise<AppState>;
  save: (state: AppState) => Promise<void>;
};

function makeRepository(): TestRepository {
  const repository: TestRepository = {
    state: {
      schemaVersion: 2,
      userName: "",
      taskName: "読書",
      totalNt: 0,
      totalCompletions: 0,
      lastCompletionDate: null,
      unlockedStories: [],
      activeTimer: null,
    },
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

describe("AppStateProvider persistence ordering", () => {
  it("does not publish a state change when saving the snapshot fails", async () => {
    const repository = makeRepository();
    let context!: ReturnType<typeof useAppState>;
    const Probe = () => {
      context = useAppState();
      return null;
    };
    let renderer: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(
        <AppStateProvider repository={repository}>
          <Probe />
        </AppStateProvider>,
      );
    });
    expect(context.status).toBe("ready");

    repository.failWrite = true;
    await act(async () => {
      await expect(context.startTimer(0)).rejects.toThrow("write failed");
    });
    expect(context.state?.activeTimer).toBeNull();

    repository.failWrite = false;
    await act(async () => {
      await context.startTimer(0);
    });
    expect(context.state?.activeTimer).not.toBeNull();

    repository.failWrite = true;
    await act(async () => {
      await expect(context.finishTimer(Date.now())).rejects.toThrow("write failed");
    });
    expect(context.state?.activeTimer).not.toBeNull();

    await act(async () => {
      renderer!.unmount();
    });
  });
});

describe("AppStateProvider timer lifecycle", () => {
  it("counts only eligible route time and ignores repeated transitions and inactive gaps", async () => {
    const repository = makeRepository();
    const nativeAppState = NativeAppState as unknown as { currentState: string | null };
    const previousAppState = nativeAppState.currentState;
    nativeAppState.currentState = "active";

    let appStateChange!: (nextState: "active" | "background") => void;
    const appStateSubscription = { remove: jest.fn() };
    const appStateSpy = jest
      .spyOn(NativeAppState, "addEventListener")
      .mockImplementation((type, listener) => {
        if (type === "change") {
          appStateChange = listener as (nextState: "active" | "background") => void;
        }
        return appStateSubscription;
      });
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(1_000);
    let context!: ReturnType<typeof useAppState>;
    let renderer!: TestRenderer.ReactTestRenderer;
    const Probe = () => {
      context = useAppState();
      return null;
    };

    try {
      await act(async () => {
        renderer = TestRenderer.create(
          <AppStateProvider repository={repository}>
            <Probe />
          </AppStateProvider>,
        );
      });
      await act(async () => {
        await context.startTimer(3);
        await context.setTimerRouteFocused(true, 1_000);
        await context.setTimerRouteFocused(true, 1_100);
      });
      expect(repository.savedStates).toHaveLength(2);
      expect(repository.state.activeTimer).toMatchObject({
        accumulatedMs: 0,
        runningSince: 1_000,
      });

      nowSpy.mockReturnValue(2_250);
      appStateChange("background");
      await act(async () => {
        await context.setTimerRouteFocused(true, 2_250);
      });
      expect(repository.state.activeTimer).toMatchObject({
        accumulatedMs: 1_250,
        runningSince: null,
      });
      expect(repository.savedStates).toHaveLength(3);

      nowSpy.mockReturnValue(4_000);
      appStateChange("background");
      appStateChange("background");
      await act(async () => {
        await context.setTimerRouteFocused(true, 4_000);
      });
      expect(repository.savedStates).toHaveLength(3);

      nowSpy.mockReturnValue(5_000);
      appStateChange("active");
      await act(async () => {
        await context.setTimerRouteFocused(true, 5_000);
      });
      expect(repository.state.activeTimer?.runningSince).toBe(5_000);

      await act(async () => {
        await context.setTimerRouteFocused(false, 5_500);
      });
      expect(repository.state.activeTimer).toMatchObject({
        accumulatedMs: 1_750,
        runningSince: null,
      });

      nowSpy.mockReturnValue(9_000);
      appStateChange("active");
      await act(async () => {
        await context.setTimerRouteFocused(false, 9_000);
        await context.setTimerRouteFocused(true, 9_000);
      });
      expect(repository.state.activeTimer?.runningSince).toBe(9_000);

      let outcome!: Awaited<ReturnType<typeof context.finishTimer>>;
      await act(async () => {
        outcome = await context.finishTimer(10_250);
      });
      expect(outcome.earnedNt).toBe(3);
      expect(repository.state.activeTimer).toBeNull();
    } finally {
      if (renderer) {
        await act(async () => {
          renderer.unmount();
        });
      }
      appStateSpy.mockRestore();
      nowSpy.mockRestore();
      nativeAppState.currentState = previousAppState;
    }
  });

  it("hydrates an unknown running segment paused without crediting relaunch time", async () => {
    const appStateSpy = jest
      .spyOn(NativeAppState, "addEventListener")
      .mockReturnValue({ remove: jest.fn() });
    const repository = makeRepository();
    repository.state = {
      ...repository.state,
      activeTimer: {
        sessionId: "relaunch-session",
        plannedSeconds: 60,
        startedTaskName: "読書",
        accumulatedMs: 750,
        runningSince: 1_000,
      },
    };
    let context!: ReturnType<typeof useAppState>;
    let renderer!: TestRenderer.ReactTestRenderer;
    const Probe = () => {
      context = useAppState();
      return null;
    };

    await act(async () => {
      renderer = TestRenderer.create(
        <AppStateProvider repository={repository}>
          <Probe />
        </AppStateProvider>,
      );
    });
    expect(context.state?.activeTimer).toMatchObject({
      accumulatedMs: 750,
      runningSince: null,
    });
    expect(repository.savedStates).toHaveLength(1);
    expect(repository.savedStates[0].activeTimer?.runningSince).toBeNull();
    await act(async () => {
      renderer.unmount();
    });
    appStateSpy.mockRestore();
  });

  it("reconciles route focus reported before hydration resolves", async () => {
    const nativeAppState = NativeAppState as unknown as { currentState: string | null };
    const previousAppState = nativeAppState.currentState;
    nativeAppState.currentState = "active";
    const appStateSpy = jest
      .spyOn(NativeAppState, "addEventListener")
      .mockReturnValue({ remove: jest.fn() });
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(1_000);
    let resolveLoad!: (state: AppState) => void;
    const loadPromise = new Promise<AppState>((resolve) => {
      resolveLoad = resolve;
    });
    const savedStates: AppState[] = [];
    const repository = {
      load: () => loadPromise,
      save: async (nextState: AppState) => {
        savedStates.push(nextState);
      },
    };
    let context!: ReturnType<typeof useAppState>;
    let renderer!: TestRenderer.ReactTestRenderer;
    const Probe = () => {
      context = useAppState();
      return null;
    };

    try {
      await act(async () => {
        renderer = TestRenderer.create(
          <AppStateProvider repository={repository}>
            <Probe />
          </AppStateProvider>,
        );
      });
      await act(async () => {
        await context.setTimerRouteFocused(true, 1_000);
      });
      expect(context.status).toBe("loading");

      await act(async () => {
        resolveLoad({
          schemaVersion: 2,
          userName: "",
          taskName: "読書",
          totalNt: 0,
          totalCompletions: 0,
          lastCompletionDate: null,
          unlockedStories: [],
          activeTimer: {
            sessionId: "hydrated-session",
            plannedSeconds: 60,
            startedTaskName: "読書",
            accumulatedMs: 750,
            runningSince: null,
          },
        });
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
      });

      expect(context.status).toBe("ready");
      expect(context.state?.activeTimer).toMatchObject({
        accumulatedMs: 750,
        runningSince: 1_000,
      });
      expect(savedStates).toHaveLength(1);
    } finally {
      if (renderer) {
        await act(async () => {
          renderer.unmount();
        });
      }
      appStateSpy.mockRestore();
      nowSpy.mockRestore();
      nativeAppState.currentState = previousAppState;
    }
  });

  it("fails closed on a pause save error and resumes from the recovered active time", async () => {
    const repository = makeRepository();
    const nativeAppState = NativeAppState as unknown as { currentState: string | null };
    const previousAppState = nativeAppState.currentState;
    nativeAppState.currentState = "active";
    let appStateChange!: (nextState: "active" | "background") => void;
    const appStateSpy = jest
      .spyOn(NativeAppState, "addEventListener")
      .mockImplementation((type, listener) => {
        if (type === "change") {
          appStateChange = listener as (nextState: "active" | "background") => void;
        }
        return { remove: jest.fn() };
      });
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(1_000);
    let context!: ReturnType<typeof useAppState>;
    let renderer!: TestRenderer.ReactTestRenderer;
    const Probe = () => {
      context = useAppState();
      return null;
    };
    const flushLifecycle = () =>
      new Promise<void>((resolve) => setTimeout(resolve, 0));

    try {
      await act(async () => {
        renderer = TestRenderer.create(
          <AppStateProvider repository={repository}>
            <Probe />
          </AppStateProvider>,
        );
      });
      await act(async () => {
        await context.startTimer(2);
        await context.setTimerRouteFocused(true, 1_000);
      });

      repository.failWrite = true;
      nowSpy.mockReturnValue(2_000);
      await act(async () => {
        appStateChange("background");
        await flushLifecycle();
      });
      expect(context.state?.activeTimer).toMatchObject({
        accumulatedMs: 1_000,
        runningSince: null,
      });

      repository.failWrite = false;
      nowSpy.mockReturnValue(7_000);
      await act(async () => {
        appStateChange("active");
        await flushLifecycle();
      });
      expect(context.state?.activeTimer?.runningSince).toBe(7_000);

      let outcome!: Awaited<ReturnType<typeof context.finishTimer>>;
      await act(async () => {
        outcome = await context.finishTimer(8_000);
      });
      expect(outcome.earnedNt).toBe(2);
      expect(context.state?.activeTimer).toBeNull();
    } finally {
      if (renderer) {
        await act(async () => {
          renderer.unmount();
        });
      }
      appStateSpy.mockRestore();
      nowSpy.mockRestore();
      nativeAppState.currentState = previousAppState;
    }
  });
});

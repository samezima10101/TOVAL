import mockAsyncStorage from "@react-native-async-storage/async-storage/jest/async-storage-mock";
import React from "react";
import { AppState as NativeAppState } from "react-native";
import TestRenderer, { act } from "react-test-renderer";

import { localDateKey } from "@/src/domain/common/date";
import type { AppState } from "@/src/domain/common/types";
import useTimerLogic from "@/src/hooks/useTimerLogic";
import { AppStateProvider } from "@/src/state/AppStateProvider";
import { createInitialAppState } from "@/src/storage/appStateRepository";

jest.mock("@react-native-async-storage/async-storage", () => mockAsyncStorage);
jest.mock("@/src/hooks/useTimerTick", () => () => Date.now());
jest.mock("expo-router", () => ({
  router: { replace: jest.fn() },
  useFocusEffect: (callback: () => void | (() => void)) => {
    const React = jest.requireActual<typeof import("react")>("react");
    React.useEffect(callback, [callback]);
  },
}));

it("excludes diary time and background transitions, resumes on close, and retains the finish time on retry", async () => {
  jest.useFakeTimers();
  const startedAt = new Date(2025, 0, 1, 23, 58).getTime();
  jest.setSystemTime(startedAt);
  const previousAppState = NativeAppState.currentState;
  NativeAppState.currentState = "active";
  let appStateChange!: (state: "active" | "background") => void;
  const lifecycleSpy = jest.spyOn(NativeAppState, "addEventListener")
    .mockImplementation((_event, listener) => {
      appStateChange = listener;
      return { remove: jest.fn() };
    });
  let persisted: AppState = {
    ...createInitialAppState(),
    activeTimer: {
      sessionId: "diary-session",
      plannedSeconds: 60,
      startedTaskName: "読書",
      accumulatedMs: 0,
      runningSince: null as number | null,
    },
  };
  let failWrite = false;
  const repository = {
    load: async () => persisted,
    save: jest.fn(async (state: AppState) => {
      if (failWrite) throw new Error("write failed");
      persisted = state;
    }),
  };
  let timer!: ReturnType<typeof useTimerLogic>;
  function Probe() {
    timer = useTimerLogic();
    return null;
  }
  let renderer!: TestRenderer.ReactTestRenderer;

  try {
    await act(async () => {
      renderer = TestRenderer.create(<AppStateProvider repository={repository}><Probe /></AppStateProvider>);
    });
    jest.setSystemTime(startedAt + 60_000);
    await act(async () => { await timer.openDiary(); });
    expect(timer.isDiaryOpen).toBe(true);
    expect(persisted.activeTimer?.runningSince).toBeNull();
    expect(persisted.activeTimer?.accumulatedMs).toBe(60_000);

    jest.setSystemTime(startedAt + 120_000);
    await act(async () => { appStateChange("background"); });
    await act(async () => { appStateChange("active"); });
    expect(persisted.activeTimer?.runningSince).toBeNull();
    await act(async () => { timer.closeDiary(); });
    expect(timer.isDiaryOpen).toBe(false);
    expect(persisted.activeTimer?.runningSince).toBe(startedAt + 120_000);

    jest.setSystemTime(startedAt + 130_000);
    await act(async () => { await timer.openDiary(); });
    failWrite = true;
    jest.setSystemTime(startedAt + 600_000);
    await act(async () => { await timer.handleFinish("日記"); });
    expect(timer.error).toBe("write failed");
    expect(timer.isDiaryOpen).toBe(true);
    expect(timer.isProcessing).toBe(false);
    expect(persisted.activeTimer?.accumulatedMs).toBe(70_000);
    failWrite = false;
    await act(async () => { await timer.handleFinish("日記"); });
    expect(persisted.diaryLogs).toEqual([{
      id: "diary-session",
      completedAt: startedAt + 130_000,
      completedDate: localDateKey(startedAt + 130_000),
      totalTimerSeconds: 70,
      diary: "日記",
      unlockedEpisodeId: 1,
    }]);
    expect(persisted.totalNt).toBe(70);
  } finally {
    await act(async () => { renderer?.unmount(); });
    lifecycleSpy.mockRestore();
    jest.restoreAllMocks();
    NativeAppState.currentState = previousAppState;
    jest.useRealTimers();
  }
});

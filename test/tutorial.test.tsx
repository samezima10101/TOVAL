import mockAsyncStorage from "@react-native-async-storage/async-storage/jest/async-storage-mock";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";

import { AppState } from "@/src/domain/common/types";
import { getTutorialMinutes, getTutorialPath, isTutorialStep, TUTORIAL_MINUTES } from "@/src/domain/tutorial";
import { AppStateProvider, useAppState } from "@/src/state/AppStateProvider";
import { createInitialAppState, parsePersistedState } from "@/src/storage/appStateRepository";

jest.mock("@react-native-async-storage/async-storage", () => mockAsyncStorage);

describe("tutorial progress", () => {
  let renderer: TestRenderer.ReactTestRenderer;
  let context: ReturnType<typeof useAppState>;
  let persisted: AppState;
  let failWrite: boolean;
  const repository = {
    load: async () => persisted,
    save: async (next: AppState) => {
      if (failWrite) throw new Error("write failed");
      persisted = next;
    },
  };
  const Probe = () => { context = useAppState(); return null; };
  const mount = async () => {
    await act(async () => { renderer = TestRenderer.create(<AppStateProvider repository={repository}><Probe /></AppStateProvider>); });
  };
  beforeEach(async () => { persisted = createInitialAppState(); failWrite = false; await mount(); });
  afterEach(async () => { await act(async () => renderer.unmount()); });

  it("saves profile during the separate intro, resumes, finishes the timer, then reads episode 1", async () => {
    expect(context.state?.tutorialStep).toBe("intro");
    await act(async () => context.advanceTutorial());
    expect(context.state?.tutorialStep).toBe("intro");
    await act(async () => context.setTutorialProfile(" June ", " 読書 "));
    expect(persisted).toMatchObject({ userName: "June", taskName: "読書", unlockedStories: [] });
    await act(async () => context.advanceTutorial());
    expect(persisted.tutorialStep).toBe("navigation");
    await act(async () => context.advanceTutorial());
    expect(persisted.tutorialStep).toBe("start");
    await act(async () => { await expect(context.startTimer(1500)).rejects.toThrow("チュートリアル"); });
    await act(async () => { await context.startTimer(TUTORIAL_MINUTES * 60); });
    expect(persisted.tutorialStep).toBe("timer");
    await act(async () => renderer.unmount());
    await mount();
    expect(context.state?.tutorialStep).toBe("timer");
    await act(async () => { await context.finishTimer(Date.now(), "初めての記録"); });
    expect(persisted).toMatchObject({ tutorialStep: "talk", activeTimer: null, totalCompletions: 1 });
    expect(persisted.diaryLogs[0].diary).toBe("初めての記録");
    expect(persisted.unlockedStories).toHaveLength(1);
    expect(persisted.unlockedStories[0]).toMatchObject({ episodeId: 1, isRead: false });
    await act(async () => context.advanceTutorial());
    expect(persisted.tutorialStep).toBe("episode");
    await act(async () => context.markStoryRead(1));
    expect(persisted.tutorialStep).toBe("complete");
    expect(persisted.unlockedStories[0].isRead).toBe(true);
  });

  it("rejects empty input and leaves progress unchanged on a write failure", async () => {
    await act(async () => { await expect(context.setTutorialProfile(" ", "読書")).rejects.toThrow("名前とタスク"); });
    failWrite = true;
    await act(async () => { await expect(context.setTutorialProfile("June", "読書")).rejects.toThrow("write failed"); });
    expect(context.state).toMatchObject({ userName: "", taskName: "", tutorialStep: "intro" });
    failWrite = false;
    await act(async () => context.setTutorialProfile("June", "読書"));
    failWrite = true;
    await act(async () => { await expect(context.advanceTutorial()).rejects.toThrow("write failed"); });
    expect(context.state?.tutorialStep).toBe("intro");
  });

  it("keeps existing saves outside the tutorial and rejects invalid progress", () => {
    const oldState = { ...createInitialAppState() };
    delete oldState.tutorialStep;
    expect(parsePersistedState(JSON.stringify(oldState))?.tutorialStep).toBeUndefined();
    expect(parsePersistedState(JSON.stringify({ ...oldState, tutorialStep: "invalid" }))).toBeNull();
    expect(parsePersistedState(JSON.stringify({ schemaVersion: 1, taskName: "旧タスク" }))?.tutorialStep).toBe("complete");
    expect(isTutorialStep("timer")).toBe(true);
    expect(isTutorialStep("unknown")).toBe(false);
    expect(getTutorialPath("intro")).toBe("/story");
    expect(getTutorialPath("timer")).toBe("/timer");
    expect(getTutorialPath("talk")).toBe("/");
    expect(getTutorialPath("complete")).toBeNull();
    expect(getTutorialMinutes(true)).toBe(0);
    expect(getTutorialMinutes(false)).toBe(5);
  });
});

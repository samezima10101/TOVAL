import mockAsyncStorage from "@react-native-async-storage/async-storage/jest/async-storage-mock";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";

import { AppState } from "@/src/domain/types";
import { AppStateProvider, useAppState } from "./AppStateProvider";

jest.mock("@react-native-async-storage/async-storage", () => mockAsyncStorage);

type TestRepository = {
  state: AppState;
  failWrite: boolean;
  load: () => Promise<AppState>;
  save: (state: AppState) => Promise<void>;
};

function makeRepository(): TestRepository {
  const repository: TestRepository = {
    state: {
      schemaVersion: 1,
      userName: "",
      taskName: "読書",
      totalNt: 0,
      totalCompletions: 0,
      lastCompletionDate: null,
      unlockedStories: [],
      activeTimer: null,
    },
    failWrite: false,
    async load() {
      return repository.state;
    },
    async save(nextState) {
      if (repository.failWrite) {
        throw new Error("write failed");
      }
      repository.state = nextState;
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

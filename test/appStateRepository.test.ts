import mockAsyncStorage from "@react-native-async-storage/async-storage/jest/async-storage-mock";

import { localDateKey } from "../src/domain/common/date";
import {
  createAppStateRepository,
  createInitialAppState,
  parsePersistedState,
} from "../src/storage/appStateRepository";
import {
  branchingEpisodeId,
  primaryRoute,
  secondaryRoute,
  storyCatalog,
} from "./fixtures/story";

jest.mock("@react-native-async-storage/async-storage", () => mockAsyncStorage);

class FakeStorage {
  value: string | null = null;
  shouldFailRead = false;
  shouldFailWrite = false;

  async getItem(): Promise<string | null> {
    if (this.shouldFailRead) {
      throw new Error("read failed");
    }
    return this.value;
  }

  async setItem(_key: string, value: string): Promise<void> {
    if (this.shouldFailWrite) {
      throw new Error("write failed");
    }
    this.value = value;
  }
}

describe("app state repository", () => {
  it("returns a safe initial state for missing or corrupted data", async () => {
    const storage = new FakeStorage();
    const repository = createAppStateRepository(storage);

    await expect(repository.load()).resolves.toEqual(createInitialAppState());
    storage.value = "{not-json";
    await expect(repository.load()).resolves.toEqual(createInitialAppState());
    storage.value = JSON.stringify({ schemaVersion: 1, taskName: 42 });
    await expect(repository.load()).resolves.toEqual(createInitialAppState());
  });

  it("migrates a compatible legacy snapshot and rejects unknown current data", () => {
    const legacy = parsePersistedState(
      JSON.stringify({
        schemaVersion: 0,
        taskName: "旧タスク",
        totalNt: 12,
        totalCompletions: 1,
        unlockedStories: [{ episodeId: 1, unlockedDate: "2025-01-01" }],
      }),
    );
    expect(legacy).toMatchObject({
      schemaVersion: 6,
      taskName: "旧タスク",
      totalNt: 12,
      totalCompletions: 1,
      unlockedStories: [
        { episodeId: 1, unlockedDate: "2025-01-01", isRead: true },
      ],
      activeTimer: null,
    });
    expect(
      parsePersistedState(JSON.stringify({ schemaVersion: 99 })),
    ).toBeNull();
  });

  it("migrates a v1 in-flight timer as paused without preserving unknown elapsed time", () => {
    const migrated = parsePersistedState(
      JSON.stringify({
        schemaVersion: 1,
        userName: "ユーザー",
        taskName: "旧タスク",
        totalNt: 12,
        totalCompletions: 1,
        lastCompletionDate: "2025-01-01",
        unlockedStories: [{ episodeId: 1, unlockedDate: "2025-01-01" }],
        activeTimer: {
          sessionId: "legacy-session",
          startedAt: 1_000,
          plannedSeconds: 3_600,
          startedTaskName: "旧タスク",
        },
      }),
    );

    expect(migrated).toMatchObject({
      schemaVersion: 6,
      userName: "ユーザー",
      totalNt: 12,
      totalCompletions: 1,
      unlockedStories: [
        { episodeId: 1, unlockedDate: "2025-01-01", isRead: true },
      ],
      activeTimer: {
        sessionId: "legacy-session",
        plannedSeconds: 3_600,
        startedTaskName: "旧タスク",
        accumulatedMs: 0,
        runningSince: null,
      },
    });
  });

  it("migrates a v2 snapshot and marks existing stories as read", () => {
    const migrated = parsePersistedState(
      JSON.stringify({
        schemaVersion: 2,
        userName: "ユーザー",
        taskName: "旧タスク",
        totalNt: 24,
        totalCompletions: 2,
        lastCompletionDate: "2025-01-02",
        unlockedStories: [
          { episodeId: 1, unlockedDate: "2025-01-01" },
          { episodeId: 2, unlockedDate: "2025-01-02" },
        ],
        activeTimer: {
          sessionId: "v2-session",
          plannedSeconds: 600,
          startedTaskName: "旧タスク",
          accumulatedMs: 1_250,
          runningSince: null,
        },
      }),
    );

    expect(migrated).toMatchObject({
      schemaVersion: 6,
      totalNt: 24,
      unlockedStories: [
        { episodeId: 1, unlockedDate: "2025-01-01", isRead: true },
        { episodeId: 2, unlockedDate: "2025-01-02", isRead: true },
      ],
      activeTimer: {
        sessionId: "v2-session",
        accumulatedMs: 1_250,
        runningSince: null,
      },
    });
  });

  it.each([3, 4])("preserves read and unread stories when migrating schema v%s", (schemaVersion) => {
    const unlockedStories = [
      { episodeId: 1, unlockedDate: "2025-01-01", isRead: true },
      { episodeId: 2, unlockedDate: "2025-01-02", isRead: false },
    ];
    const state = parsePersistedState(JSON.stringify({
      ...createInitialAppState(),
      schemaVersion,
      unlockedStories,
    }));

    expect(state?.unlockedStories).toEqual(unlockedStories);
    expect(state?.schemaVersion).toBe(6);
  });

  it("migrates schema v4 route progress and starts with empty diary logs", () => {
    const state = parsePersistedState(
      JSON.stringify({
        ...createInitialAppState(),
        schemaVersion: 4,
        storyRouteProgress: {
          [branchingEpisodeId]: {
            firstSelectedRouteId: primaryRoute.id,
            extraUnlockedRouteIds: [secondaryRoute.id],
          },
        },
      }),
      storyCatalog,
    );

    expect(state?.diaryLogs).toEqual([]);
    expect(state?.storyRouteProgress).toEqual({
      [branchingEpisodeId]: {
        firstSelectedRouteId: primaryRoute.id,
        extraUnlockedRouteIds: [secondaryRoute.id],
      },
    });
  });

  it("persists v5 log date migration once and retains diary, unread status, and timer", async () => {
    const storage = new FakeStorage();
    const completedAt = new Date(2025, 0, 2, 0, 30).getTime();
    const oldState = {
      ...createInitialAppState(),
      schemaVersion: 5,
      unlockedStories: [{ episodeId: 1, unlockedDate: "2025-01-02", isRead: false }],
      diaryLogs: [{ id: "old-log", completedAt, totalTimerSeconds: 60, diary: "日記", unlockedEpisodeId: 1 }],
      activeTimer: { sessionId: "active", plannedSeconds: 60, startedTaskName: "読書", accumulatedMs: 1000, runningSince: null },
    };
    storage.value = JSON.stringify(oldState);
    const repository = createAppStateRepository(storage);
    const migrated = await repository.load();
    expect(migrated).toEqual({
      ...oldState,
      schemaVersion: 6,
      diaryLogs: [{ ...oldState.diaryLogs[0], completedDate: localDateKey(completedAt) }],
    });
    expect(JSON.parse(storage.value!)).toEqual(migrated);
    await expect(repository.load()).resolves.toEqual(migrated);

    storage.value = JSON.stringify(oldState);
    storage.shouldFailWrite = true;
    await expect(repository.load()).rejects.toMatchObject({ operation: "write" });
  });

  it("round-trips stored dates even when they differ from the device's local date", async () => {
    const storage = new FakeStorage();
    const repository = createAppStateRepository(storage);
    const state = {
      ...createInitialAppState(),
      diaryLogs: [{ id: "log", completedAt: 0, completedDate: "2025-01-02", totalTimerSeconds: 60, diary: "日記", unlockedEpisodeId: null }],
    };
    await repository.save(state);
    await expect(repository.load()).resolves.toEqual(state);
    await expect(repository.save({
      ...state,
      diaryLogs: [{ ...state.diaryLogs[0], completedDate: "2025-02-30" }],
    })).rejects.toMatchObject({ operation: "write" });
  });

  it("writes and reads one validated snapshot", async () => {
    const storage = new FakeStorage();
    const repository = createAppStateRepository(storage);
    const state = { ...createInitialAppState(), taskName: "読書" };

    await repository.save(state);
    expect(storage.value).toContain('"taskName":"読書"');
    await expect(repository.load()).resolves.toEqual(state);
  });

  it("round-trips running and paused segment snapshots", async () => {
    const storage = new FakeStorage();
    const repository = createAppStateRepository(storage);
    const running = {
      ...createInitialAppState(),
      taskName: "読書",
      activeTimer: {
        sessionId: "session",
        plannedSeconds: 60,
        startedTaskName: "読書",
        accumulatedMs: 1_250,
        runningSince: 5_000,
      },
    };
    await repository.save(running);
    await expect(repository.load()).resolves.toEqual(running);

    const paused = {
      ...running,
      activeTimer: { ...running.activeTimer, runningSince: null },
    };
    await repository.save(paused);
    await expect(repository.load()).resolves.toEqual(paused);
  });

  it("returns retryable errors instead of swallowing storage failures", async () => {
    const readStorage = new FakeStorage();
    readStorage.shouldFailRead = true;
    await expect(
      createAppStateRepository(readStorage).load(),
    ).rejects.toMatchObject({
      name: "AppStateStorageError",
      operation: "read",
    });

    const writeStorage = new FakeStorage();
    writeStorage.shouldFailWrite = true;
    await expect(
      createAppStateRepository(writeStorage).save({
        ...createInitialAppState(),
        taskName: "読書",
      }),
    ).rejects.toMatchObject({
      name: "AppStateStorageError",
      operation: "write",
    });
  });
});

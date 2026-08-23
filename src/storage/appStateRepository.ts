import AsyncStorage from "@react-native-async-storage/async-storage";

import { localDateKey } from "@/src/domain/date";
import {
  APP_SCHEMA_VERSION,
  AppState,
  EpisodeId,
  MAX_PLANNED_SECONDS,
} from "@/src/domain/types";

export const APP_STATE_STORAGE_KEY = "@my-june/app-state-v1";

export type StorageLike = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};

export class AppStateStorageError extends Error {
  readonly operation: "read" | "write";

  constructor(
    operation: "read" | "write",
    message: string,
    cause?: unknown,
  ) {
    super(message);
    this.name = "AppStateStorageError";
    this.operation = operation;
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

export function createInitialAppState(): AppState {
  return {
    schemaVersion: APP_SCHEMA_VERSION,
    userName: "",
    taskName: "",
    totalNt: 0,
    totalCompletions: 0,
    lastCompletionDate: null,
    unlockedStories: [],
    activeTimer: null,
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isDateKey = (value: unknown): value is string => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  try {
    return localDateKey(new Date(`${value}T12:00:00`)) === value;
  } catch {
    return false;
  }
};

const isEpisodeId = (value: unknown): value is EpisodeId =>
  value === 1 || value === 2 || value === 3;

function parseActiveTimer(value: unknown): AppState["activeTimer"] | null | undefined {
  if (value === null) {
    return null;
  }
  if (!isRecord(value)) {
    return undefined;
  }

  const { sessionId, startedAt, plannedSeconds, startedTaskName } = value;
  if (
    typeof sessionId !== "string" ||
    sessionId.trim().length === 0 ||
    typeof startedAt !== "number" ||
    !Number.isFinite(startedAt) ||
    startedAt < 0 ||
    typeof plannedSeconds !== "number" ||
    !Number.isInteger(plannedSeconds) ||
    plannedSeconds < 0 ||
    plannedSeconds > MAX_PLANNED_SECONDS ||
    typeof startedTaskName !== "string"
  ) {
    return undefined;
  }

  return { sessionId, startedAt, plannedSeconds, startedTaskName };
}

export function validateAppState(value: unknown): value is AppState {
  if (!isRecord(value) || value.schemaVersion !== APP_SCHEMA_VERSION) {
    return false;
  }

  if (
    typeof value.userName !== "string" ||
    typeof value.taskName !== "string" ||
    typeof value.totalNt !== "number" ||
    !Number.isInteger(value.totalNt) ||
    value.totalNt < 0 ||
    typeof value.totalCompletions !== "number" ||
    !Number.isInteger(value.totalCompletions) ||
    value.totalCompletions < 0 ||
    (value.lastCompletionDate !== null && !isDateKey(value.lastCompletionDate)) ||
    !Array.isArray(value.unlockedStories) ||
    value.unlockedStories.length > 3
  ) {
    return false;
  }

  const ids = new Set<number>();
  for (const story of value.unlockedStories) {
    if (
      !isRecord(story) ||
      !isEpisodeId(story.episodeId) ||
      !isDateKey(story.unlockedDate) ||
      ids.has(story.episodeId)
    ) {
      return false;
    }
    ids.add(story.episodeId);
  }

  return parseActiveTimer(value.activeTimer) !== undefined;
}

function migrateLegacyState(value: Record<string, unknown>): AppState | null {
  if (value.schemaVersion !== 0 && value.schemaVersion !== undefined) {
    return null;
  }

  const initial = createInitialAppState();
  const migrated: Record<string, unknown> = {
    ...initial,
    schemaVersion: APP_SCHEMA_VERSION,
    userName: typeof value.userName === "string" ? value.userName : "",
    taskName: typeof value.taskName === "string" ? value.taskName : "",
    totalNt:
      typeof value.totalNt === "number" && Number.isInteger(value.totalNt) && value.totalNt >= 0
        ? value.totalNt
        : 0,
    totalCompletions:
      typeof value.totalCompletions === "number" &&
      Number.isInteger(value.totalCompletions) &&
      value.totalCompletions >= 0
        ? value.totalCompletions
        : 0,
    lastCompletionDate:
      value.lastCompletionDate === null || isDateKey(value.lastCompletionDate)
        ? value.lastCompletionDate
        : null,
    unlockedStories: Array.isArray(value.unlockedStories)
      ? value.unlockedStories
      : [],
    activeTimer: value.activeTimer ?? null,
  };

  return validateAppState(migrated) ? migrated : initial;
}

export function parsePersistedState(raw: string): AppState | null {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }

  if (validateAppState(value)) {
    return value;
  }
  return isRecord(value) ? migrateLegacyState(value) : null;
}

export type AppStateRepository = {
  load: () => Promise<AppState>;
  save: (state: AppState) => Promise<void>;
};

export function createAppStateRepository(
  storage: StorageLike = AsyncStorage,
): AppStateRepository {
  return {
    async load() {
      let raw: string | null;
      try {
        raw = await storage.getItem(APP_STATE_STORAGE_KEY);
      } catch (error) {
        throw new AppStateStorageError("read", "アプリ状態を読み込めませんでした。", error);
      }

      if (raw === null) {
        return createInitialAppState();
      }

      return parsePersistedState(raw) ?? createInitialAppState();
    },

    async save(state) {
      if (!validateAppState(state)) {
        throw new AppStateStorageError("write", "保存するアプリ状態が不正です。");
      }

      try {
        await storage.setItem(APP_STATE_STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        throw new AppStateStorageError("write", "アプリ状態を保存できませんでした。", error);
      }
    },
  };
}

export const appStateRepository = createAppStateRepository();

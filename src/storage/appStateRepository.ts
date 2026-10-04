import AsyncStorage from "@react-native-async-storage/async-storage";

import { localDateKey } from "@/src/domain/common/date";
import {
  APP_SCHEMA_VERSION,
  ActiveTimer,
  AppState,
  DiaryLog,
  EpisodeId,
  MAX_PLANNED_SECONDS,
  StoryRouteProgress,
  UnlockedStory,
} from "@/src/domain/common/types";
import { STORY_CATALOG, StoryCatalog } from "@/src/domain/storyData";

export const APP_STATE_STORAGE_KEY = "@my-june/app-state-v1";

export type StorageLike = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};

export class AppStateStorageError extends Error {
  readonly operation: "read" | "write";

  constructor(operation: "read" | "write", message: string, cause?: unknown) {
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
    storyRouteProgress: {},
    diaryLogs: [],
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

const isEpisodeId = (
  value: unknown,
  catalog: StoryCatalog,
): value is EpisodeId =>
  typeof value === "number" && catalog.episodes.some((episode) => episode.id === value);

function parseStoryRouteProgress(
  value: unknown,
  catalog: StoryCatalog,
): Partial<Record<EpisodeId, StoryRouteProgress>> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const progress: Partial<Record<EpisodeId, StoryRouteProgress>> = {};
  for (const [episodeKey, episodeProgress] of Object.entries(value)) {
    const episodeId = Number(episodeKey);
    if (!isEpisodeId(episodeId, catalog) || !isRecord(episodeProgress)) {
      return undefined;
    }

    const { firstSelectedRouteId, extraUnlockedRouteIds } = episodeProgress;
    if (
      (firstSelectedRouteId !== undefined &&
        (typeof firstSelectedRouteId !== "string" ||
          firstSelectedRouteId.trim().length === 0)) ||
      !Array.isArray(extraUnlockedRouteIds) ||
      extraUnlockedRouteIds.some(
        (routeId) => typeof routeId !== "string" || routeId.trim().length === 0,
      ) ||
      new Set(extraUnlockedRouteIds).size !== extraUnlockedRouteIds.length ||
      (firstSelectedRouteId !== undefined &&
        extraUnlockedRouteIds.includes(firstSelectedRouteId))
    ) {
      return undefined;
    }

    progress[episodeId] = {
      ...(firstSelectedRouteId === undefined ? {} : { firstSelectedRouteId }),
      extraUnlockedRouteIds: [...extraUnlockedRouteIds],
    };
  }

  return progress;
}

function isNonNegativeSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function parseDiaryLogs(
  value: unknown,
  catalog: StoryCatalog,
): DiaryLog[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const ids = new Set<string>();
  const logs: DiaryLog[] = [];
  for (const log of value) {
    if (
      !isRecord(log) ||
      typeof log.id !== "string" ||
      log.id.trim().length === 0 ||
      ids.has(log.id) ||
      !isNonNegativeSafeInteger(log.completedAt) ||
      !isDateKey(log.completedDate) ||
      (log.completedTime !== undefined &&
        (typeof log.completedTime !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(log.completedTime))) ||
      !isNonNegativeSafeInteger(log.totalTimerSeconds) ||
      typeof log.diary !== "string" ||
      (log.unlockedEpisodeId !== null &&
        !isEpisodeId(log.unlockedEpisodeId, catalog))
    ) {
      return undefined;
    }
    ids.add(log.id);
    logs.push({
      id: log.id,
      completedAt: log.completedAt,
      completedDate: log.completedDate,
      ...(log.completedTime === undefined ? {} : { completedTime: log.completedTime }),
      totalTimerSeconds: log.totalTimerSeconds,
      diary: log.diary,
      unlockedEpisodeId: log.unlockedEpisodeId,
    });
  }
  return logs;
}

function parseActiveTimer(
  value: unknown,
): AppState["activeTimer"] | null | undefined {
  if (value === null) {
    return null;
  }
  if (!isRecord(value)) {
    return undefined;
  }

  const {
    sessionId,
    plannedSeconds,
    startedTaskName,
    accumulatedMs,
    runningSince,
  } = value;
  if (
    typeof sessionId !== "string" ||
    sessionId.trim().length === 0 ||
    !isNonNegativeSafeInteger(accumulatedMs) ||
    (runningSince !== null && !isNonNegativeSafeInteger(runningSince)) ||
    typeof plannedSeconds !== "number" ||
    !Number.isInteger(plannedSeconds) ||
    plannedSeconds < 0 ||
    plannedSeconds > MAX_PLANNED_SECONDS ||
    typeof startedTaskName !== "string"
  ) {
    return undefined;
  }

  return {
    sessionId,
    plannedSeconds,
    startedTaskName,
    accumulatedMs,
    runningSince,
  };
}

function parseV1ActiveTimer(value: unknown): ActiveTimer | null | undefined {
  if (value === null || value === undefined) {
    return null;
  }
  if (!isRecord(value)) {
    return undefined;
  }

  const { sessionId, startedAt, plannedSeconds, startedTaskName } = value;
  if (
    typeof sessionId !== "string" ||
    sessionId.trim().length === 0 ||
    !isNonNegativeSafeInteger(startedAt) ||
    typeof plannedSeconds !== "number" ||
    !Number.isInteger(plannedSeconds) ||
    plannedSeconds < 0 ||
    plannedSeconds > MAX_PLANNED_SECONDS ||
    typeof startedTaskName !== "string"
  ) {
    return undefined;
  }

  // v1 had one wall-clock start and cannot distinguish active from background time.
  // Keep the session, but restart accounting paused so unknown time is never credited.
  return {
    sessionId,
    plannedSeconds,
    startedTaskName,
    accumulatedMs: 0,
    runningSince: null,
  };
}

export function validateAppState(
  value: unknown,
  catalog: StoryCatalog = STORY_CATALOG,
): value is AppState {
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
    (value.lastCompletionDate !== null &&
      !isDateKey(value.lastCompletionDate)) ||
    !Array.isArray(value.unlockedStories) ||
    value.unlockedStories.length > catalog.episodes.length ||
    parseStoryRouteProgress(value.storyRouteProgress, catalog) === undefined ||
    parseDiaryLogs(value.diaryLogs, catalog) === undefined
  ) {
    return false;
  }

  const ids = new Set<number>();
  for (const story of value.unlockedStories) {
    if (
      !isRecord(story) ||
      !isEpisodeId(story.episodeId, catalog) ||
      !isDateKey(story.unlockedDate) ||
      typeof story.isRead !== "boolean" ||
      ids.has(story.episodeId)
    ) {
      return false;
    }
    ids.add(story.episodeId);
  }

  return (
    parseStoryRouteProgress(value.storyRouteProgress, catalog) !== undefined &&
    parseDiaryLogs(value.diaryLogs, catalog) !== undefined &&
    parseActiveTimer(value.activeTimer) !== undefined
  );
}

function parseLegacyUnlockedStories(
  value: unknown,
  catalog: StoryCatalog,
  preserveReadState: boolean,
): UnlockedStory[] {
  if (!Array.isArray(value) || value.length > catalog.episodes.length) {
    return [];
  }

  const ids = new Set<number>();
  const stories: UnlockedStory[] = [];
  for (const story of value) {
    if (
      !isRecord(story) ||
      !isEpisodeId(story.episodeId, catalog) ||
      !isDateKey(story.unlockedDate) ||
      (preserveReadState && typeof story.isRead !== "boolean") ||
      ids.has(story.episodeId)
    ) {
      return [];
    }
    ids.add(story.episodeId);
    stories.push({
      episodeId: story.episodeId,
      unlockedDate: story.unlockedDate,
      // Schemas before v3 predate unread tracking and must not appear as new updates.
      isRead: preserveReadState ? story.isRead === true : true,
    });
  }
  return stories;
}

function migrateLegacyState(
  value: Record<string, unknown>,
  catalog: StoryCatalog,
): AppState | null {
  if (
    value.schemaVersion !== 0 &&
    value.schemaVersion !== 1 &&
    value.schemaVersion !== 2 &&
    value.schemaVersion !== 3 &&
    value.schemaVersion !== 4 &&
    value.schemaVersion !== undefined
  ) {
    return null;
  }

  const initial = createInitialAppState();
  const activeTimer =
    typeof value.schemaVersion === "number" && value.schemaVersion >= 2
      ? parseActiveTimer(value.activeTimer)
      : parseV1ActiveTimer(value.activeTimer);
  const migrated: AppState = {
    ...initial,
    userName: typeof value.userName === "string" ? value.userName : "",
    taskName: typeof value.taskName === "string" ? value.taskName : "",
    totalNt: isNonNegativeSafeInteger(value.totalNt) ? value.totalNt : 0,
    totalCompletions: isNonNegativeSafeInteger(value.totalCompletions)
      ? value.totalCompletions
      : 0,
    lastCompletionDate:
      value.lastCompletionDate === null || isDateKey(value.lastCompletionDate)
        ? value.lastCompletionDate
        : null,
    unlockedStories: parseLegacyUnlockedStories(
      value.unlockedStories,
      catalog,
      typeof value.schemaVersion === "number" && value.schemaVersion >= 3,
    ),
    storyRouteProgress:
      value.schemaVersion === 4
        ? (parseStoryRouteProgress(value.storyRouteProgress, catalog) ?? {})
        : {},
    diaryLogs: [],
    activeTimer: activeTimer ?? null,
  };

  return migrated;
}

export function parsePersistedState(
  raw: string,
  catalog: StoryCatalog = STORY_CATALOG,
): AppState | null {
  let value: unknown;
  try {
    value = JSON.parse(raw);
    if (isRecord(value) && value.schemaVersion === 5 && Array.isArray(value.diaryLogs)) {
      value = {
        ...value,
        schemaVersion: APP_SCHEMA_VERSION,
        diaryLogs: value.diaryLogs.map((log) => {
          if (!isRecord(log) || !isNonNegativeSafeInteger(log.completedAt)) return log;
          return {
            ...log,
            // v5 did not store the original timezone, so only the current local date is recoverable.
            completedDate: log.completedDate ?? localDateKey(log.completedAt),
          };
        }),
      };
    }
  } catch {
    return null;
  }

  if (validateAppState(value, catalog)) {
    return value;
  }
  return isRecord(value) ? migrateLegacyState(value, catalog) : null;
}

export type AppStateRepository = {
  load: () => Promise<AppState>;
  save: (state: AppState) => Promise<void>;
};

export function createAppStateRepository(
  storage: StorageLike = AsyncStorage,
  catalog: StoryCatalog = STORY_CATALOG,
): AppStateRepository {
  const repository: AppStateRepository = {
    async load() {
      let raw: string | null;
      try {
        raw = await storage.getItem(APP_STATE_STORAGE_KEY);
      } catch (error) {
        throw new AppStateStorageError(
          "read",
          "アプリ状態を読み込めませんでした。",
          error,
        );
      }

      if (raw === null) {
        return createInitialAppState();
      }

      const state = parsePersistedState(raw, catalog);
      if (state && JSON.parse(raw).schemaVersion === 5) {
        await repository.save(state);
      }
      return state ?? createInitialAppState();
    },

    async save(state) {
      if (!validateAppState(state, catalog)) {
        throw new AppStateStorageError(
          "write",
          "保存するアプリ状態が不正です。",
        );
      }

      try {
        await storage.setItem(APP_STATE_STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        throw new AppStateStorageError(
          "write",
          "アプリ状態を保存できませんでした。",
          error,
        );
      }
    },
  };
  return repository;
}

export const appStateRepository = createAppStateRepository();

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
import { developmentStorage } from "./developmentStorage";

export const APP_STATE_STORAGE_KEY = "@my-june/app-state-v1";
export const RECOVERY_STORAGE_PREFIX = "@my-june/recovery/";

export class PreservedDataError extends Error {
  constructor() {
    super("保存データの形式を確認できません。元データは変更せず保護しています。再読込するか、元データを退避して初期化してください。");
    this.name = "PreservedDataError";
  }
}

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
    purchasedSideStoryIds: [],
    announcedSideStoryIds: [],
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

function isConversationIds(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((id) => Number.isSafeInteger(id) && id > 0) &&
    new Set(value).size === value.length;
}

function isNonNegativeSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isTimestamp(value: unknown): value is number {
  return isNonNegativeSafeInteger(value) && !Number.isNaN(new Date(value).getTime());
}

function isSessionStart(value: unknown): boolean {
  return value === null || (isRecord(value) &&
    isTimestamp(value.startedAt) && isDateKey(value.startedDate) &&
    typeof value.startedTime === "string" && /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(value.startedTime));
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
      !isSessionStart(log.startInfo) ||
      !isDateKey(log.logDate) ||
      (isRecord(log.startInfo) && log.logDate !== log.startInfo.startedDate) ||
      !isTimestamp(log.completedAt) ||
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
      startInfo: log.startInfo as DiaryLog["startInfo"],
      logDate: log.logDate,
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
  legacy = false,
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
    (!legacy && !isSessionStart(value.startInfo)) ||
    sessionId.trim().length === 0 ||
    !isNonNegativeSafeInteger(accumulatedMs) ||
    (runningSince !== null && !isTimestamp(runningSince)) ||
    typeof plannedSeconds !== "number" ||
    !Number.isInteger(plannedSeconds) ||
    plannedSeconds < 0 ||
    plannedSeconds > MAX_PLANNED_SECONDS ||
    typeof startedTaskName !== "string"
  ) {
    return undefined;
  }

  return {
    startInfo: legacy ? null : value.startInfo as ActiveTimer["startInfo"],
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
    !isTimestamp(startedAt) ||
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
    startInfo: null,
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
    !Number.isSafeInteger(value.totalNt) ||
    value.totalNt < 0 ||
    typeof value.totalCompletions !== "number" ||
    !Number.isSafeInteger(value.totalCompletions) ||
    value.totalCompletions < 0 ||
    (value.lastCompletionDate !== null &&
      !isDateKey(value.lastCompletionDate)) ||
    !Array.isArray(value.unlockedStories) ||
    value.unlockedStories.length > catalog.episodes.length ||
    parseStoryRouteProgress(value.storyRouteProgress, catalog) === undefined ||
    !isConversationIds(value.purchasedSideStoryIds) ||
    !isConversationIds(value.announcedSideStoryIds) ||
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
      "isRead" in story ||
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
  requireOldReadFlag: boolean,
): UnlockedStory[] | undefined {
  if (!Array.isArray(value) || value.length > catalog.episodes.length) {
    return undefined;
  }

  const ids = new Set<number>();
  const stories: UnlockedStory[] = [];
  for (const story of value) {
    if (
      !isRecord(story) ||
      !isEpisodeId(story.episodeId, catalog) ||
      !isDateKey(story.unlockedDate) ||
      (requireOldReadFlag && typeof story.isRead !== "boolean") ||
      ids.has(story.episodeId)
    ) {
      return undefined;
    }
    ids.add(story.episodeId);
    stories.push({
      episodeId: story.episodeId,
      unlockedDate: story.unlockedDate,
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
  // Missing legacy fields can use their historical defaults; invalid fields
  // must never be silently repaired and then overwrite the source.
  if (
    // A random object without a version is not evidence of a legacy save.
    (value.schemaVersion === undefined &&
      !["taskName", "userName", "totalNt", "totalCompletions", "unlockedStories"].some((key) => key in value)) ||
    (value.userName !== undefined && typeof value.userName !== "string") ||
    (value.taskName !== undefined && typeof value.taskName !== "string") ||
    (value.totalNt !== undefined && !isNonNegativeSafeInteger(value.totalNt)) ||
    (value.totalCompletions !== undefined && !isNonNegativeSafeInteger(value.totalCompletions)) ||
    (value.lastCompletionDate !== undefined && value.lastCompletionDate !== null && !isDateKey(value.lastCompletionDate)) ||
    (value.unlockedStories !== undefined && parseLegacyUnlockedStories(value.unlockedStories, catalog, Number(value.schemaVersion) >= 3) === undefined)
  ) return null;
  const activeTimer =
    typeof value.schemaVersion === "number" && value.schemaVersion >= 2
      ? parseActiveTimer(value.activeTimer, true)
      : parseV1ActiveTimer(value.activeTimer);
  if (activeTimer === undefined && value.activeTimer !== undefined) return null;
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
    ) ?? [],
    storyRouteProgress:
      value.schemaVersion === 4
        ? (parseStoryRouteProgress(value.storyRouteProgress, catalog) ?? {})
        : {},
    diaryLogs: [],
    activeTimer: activeTimer ?? null,
  };

  return validateAppState(migrated, catalog) ? migrated : null;
}

export function parsePersistedState(
  raw: string,
  catalog: StoryCatalog = STORY_CATALOG,
): AppState | null {
  let value: unknown;
  try {
    value = JSON.parse(raw);

  } catch {
    return null;
  }

  if (validateAppState(value, catalog)) {
    return value;
  }
  // v8 had read/unread flags. Validate their old types before discarding only
  // that retired field; do not turn malformed old records into valid saves.
  if (isRecord(value) && value.schemaVersion === 8) {
    const unlockedStories = parseLegacyUnlockedStories(value.unlockedStories, catalog, true);
    if (!unlockedStories) return null;
    const migrated = { ...value, schemaVersion: APP_SCHEMA_VERSION, unlockedStories };
    return validateAppState(migrated, catalog) ? migrated : null;
  }
  // Shop and diary branches both used v5/v6; fields, not version alone, distinguish them.
  // v7 has all three arrays as required fields. Missing data is corruption,
  // not an invitation to silently replace history or purchases with defaults.
  if (isRecord(value) && [4, 5, 6, 7].includes(value.schemaVersion as number)) {
    if (value.schemaVersion === 7 &&
      (value.diaryLogs === undefined || value.purchasedSideStoryIds === undefined || value.announcedSideStoryIds === undefined)) return null;
    if (value.isSideStoryUnlocked !== undefined && typeof value.isSideStoryUnlocked !== "boolean") return null;
    const unlockedStories = parseLegacyUnlockedStories(value.unlockedStories, catalog, true);
    if (!unlockedStories) return null;
    const { isSideStoryUnlocked, ...previous } = value;
    const diaryLogs = value.diaryLogs === undefined ? [] : value.diaryLogs;
    const purchased = value.purchasedSideStoryIds === undefined ? [] : value.purchasedSideStoryIds;
    if (!isConversationIds(purchased)) return null;
    const migrated = {
      ...previous,
      schemaVersion: APP_SCHEMA_VERSION,
      unlockedStories,
      activeTimer: isRecord(value.activeTimer) ? { ...value.activeTimer, startInfo: null } : value.activeTimer,
      purchasedSideStoryIds: isSideStoryUnlocked === true ? [...new Set([...purchased, 101])] : purchased,
      announcedSideStoryIds: value.announcedSideStoryIds === undefined ? [] : value.announcedSideStoryIds,
      diaryLogs: Array.isArray(diaryLogs)
        ? diaryLogs.map((log) => {
            if (!isRecord(log) || !isTimestamp(log.completedAt)) return log;
            return {
              ...log,
              startInfo: null,
              logDate: value.schemaVersion === 5 && log.completedDate === undefined
                ? localDateKey(log.completedAt) : log.completedDate,
              // v5 did not store the original timezone, so only the current local date is recoverable.
              completedDate: value.schemaVersion === 5 && log.completedDate === undefined ? localDateKey(log.completedAt) : log.completedDate,
            };
          })
        : diaryLogs,
    };
    return validateAppState(migrated, catalog) ? migrated : null;
  }
  return isRecord(value) ? migrateLegacyState(value, catalog) : null;
}

export type AppStateRepository = {
  load: () => Promise<AppState>;
  save: (state: AppState) => Promise<void>;
  initializePreservedData: () => Promise<void>;
};

export function createAppStateRepository(
  storage: StorageLike = AsyncStorage,
  catalog: StoryCatalog = STORY_CATALOG,
): AppStateRepository {
  let writable = false;
  let preservedRaw: string | null = null;

  const readRaw = async () => {
    try {
      return await storage.getItem(APP_STATE_STORAGE_KEY);
    } catch (error) {
      throw new AppStateStorageError("read", "アプリ状態を読み込めませんでした。", error);
    }
  };
  const writeRaw = async (key: string, raw: string) => {
    try {
      await storage.setItem(key, raw);
    } catch (error) {
      throw new AppStateStorageError("write", "保存できませんでした。内容は確定していません。もう一度お試しください。", error);
    }
  };
  const preserve = (raw: string) => {
    writable = false;
    preservedRaw = raw;
    return new PreservedDataError();
  };
  const repository: AppStateRepository = {
    async load() {
      writable = false;
      preservedRaw = null;
      const raw = await readRaw();

      if (raw === null) {
        writable = true;
        return createInitialAppState();
      }

      const state = parsePersistedState(raw, catalog);
      if (!state) throw preserve(raw);
      writable = true;
      if (JSON.parse(raw).schemaVersion !== APP_SCHEMA_VERSION) {
        await repository.save(state);
      }
      return state;
    },

    async save(state) {
      if (!writable) throw new PreservedDataError();
      if (!validateAppState(state, catalog)) {
        throw new AppStateStorageError(
          "write",
          "保存するアプリ状態が不正です。",
        );
      }

      const raw = await readRaw();
      if (raw !== null && !parsePersistedState(raw, catalog)) throw preserve(raw);
      await writeRaw(APP_STATE_STORAGE_KEY, JSON.stringify(state));
    },

    async initializePreservedData() {
      if (writable || preservedRaw === null) throw new Error("初期化対象を再読込してください。");
      const raw = await readRaw();
      if (raw !== preservedRaw) throw new Error("保存データが変わりました。再読込して確認してください。");
      // Keep the exact bytes under a new key, even after successful initialization.
      const backupKey = `${RECOVERY_STORAGE_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2)}`;
      if (await storage.getItem(backupKey) !== null) throw new Error("退避先が使用中のため初期化を中止しました。もう一度お試しください。");
      await writeRaw(backupKey, raw);
      if (await storage.getItem(backupKey) !== raw) throw new Error("退避データを確認できないため初期化を中止しました。");
      if (await readRaw() !== raw) throw new Error("保存データが変わったため初期化を中止しました。");
      await writeRaw(APP_STATE_STORAGE_KEY, JSON.stringify(createInitialAppState()));
      preservedRaw = null;
      writable = true;
    },
  };
  return repository;
}

export const appStateRepository = createAppStateRepository(
  __DEV__ ? developmentStorage(AsyncStorage, APP_STATE_STORAGE_KEY) : AsyncStorage,
);

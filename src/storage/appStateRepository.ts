import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_BGM_VOLUME, DEFAULT_SE_VOLUME, isValidAudioVolume } from "@/src/config/audioSettings";

import { localDateKey } from "@/src/domain/common/date";
import {
  APP_SCHEMA_VERSION,
  ActiveTimer,
  AppState,
  DiaryLog,
  EpisodeId,
  MAX_PLANNED_SECONDS,
  StoryRouteProgress,
} from "@/src/domain/common/types";
import { STORY_CATALOG, StoryCatalog } from "@/src/domain/storyData";
import {
  DEFAULT_NOTIFICATION_HOUR,
  DEFAULT_NOTIFICATION_MINUTE,
  DEFAULT_USER_NAME,
  isValidNotificationTime,
} from "@/src/domain/reminder";
import { DEFAULT_TIMER_MINUTES, isValidDefaultTimerMinutes } from "@/src/domain/timer";
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
    bgmVolume: DEFAULT_BGM_VOLUME,
    seVolume: DEFAULT_SE_VOLUME,
    userName: DEFAULT_USER_NAME,
    notificationHour: DEFAULT_NOTIFICATION_HOUR,
    notificationMinute: DEFAULT_NOTIFICATION_MINUTE,
    defaultTimerMinutes: DEFAULT_TIMER_MINUTES,
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
  return isRecord(value) &&
    isTimestamp(value.startedAt) && isDateKey(value.startedDate) &&
    typeof value.startedTime === "string" && /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(value.startedTime);
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
      (typeof log.completedTime !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(log.completedTime)) ||
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
      completedTime: log.completedTime,
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
    !isSessionStart(value.startInfo) ||
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
    startInfo: value.startInfo as ActiveTimer["startInfo"],
    sessionId,
    plannedSeconds,
    startedTaskName,
    accumulatedMs,
    runningSince,
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
    !isValidAudioVolume(value.bgmVolume) ||
    !isValidAudioVolume(value.seVolume) ||
    typeof value.userName !== "string" || value.userName.trim().length === 0 ||
    !isValidNotificationTime(value.notificationHour, value.notificationMinute) ||
    !isValidDefaultTimerMinutes(value.defaultTimerMinutes) ||
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

export function parsePersistedState(
  raw: string,
  catalog: StoryCatalog = STORY_CATALOG,
): AppState | null {
  try {
    const value: unknown = JSON.parse(raw);
    return validateAppState(value, catalog) ? value : null;
  } catch {
    return null;
  }
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

export const APP_SCHEMA_VERSION = 14;
export const MAX_TASK_NAME_LENGTH = 80;
export const MAX_DIARY_LENGTH = 1000;
export const MAX_PLANNED_SECONDS = (23 * 60 + 55) * 60;

export type EpisodeId = number;
export type Speaker = "boss" | "sub";
export type StorySpeaker = Speaker | "both";
export type StoryCharacter = "gem" | "alta";
type LegacyExpression = "normal" | "talk" | "doubt";
type NormalExpression = `normal${1 | 2 | 3 | 4}`;
export type GemExpression = LegacyExpression | NormalExpression
  | `surprised${1 | 2 | 3 | 4}` | `doubt${3 | 4}`
  | `beam${1 | 2}` | `nervous${1 | 2 | 3 | 4}`;
export type AltaExpression = LegacyExpression | NormalExpression
  | `grumpy${1 | 2 | 3 | 4}` | `grin${1 | 2 | 3 | 4}`
  | `sparkle${1 | 2}` | `smirk${3 | 4}`;
export type Expression = GemExpression | AltaExpression;

export type StoryLine = {
  id: string;
  speaker: StorySpeaker;
  text: string;
  left: GemExpression;
  right: AltaExpression;
};

export type StoryRoute = {
  id: string;
  label: string;
  lines: readonly StoryLine[];
};

export type StoryEpisode = {
  id: EpisodeId;
  title: string;
  commonBefore: readonly StoryLine[];
  routes?: readonly StoryRoute[];
  commonAfter: readonly StoryLine[];
};

export type ShopConversation = Omit<StoryEpisode, "routes">;

export type StoryRouteProgress = {
  firstSelectedRouteId?: string;
  extraUnlockedRouteIds: string[];
};

export type UnlockedStory = {
  episodeId: EpisodeId;
  unlockedDate: string;
};

export type SessionStart = {
  startedAt: number;
  startedDate: string;
  startedTime: string;
};

export type ActiveTimer = {
  startInfo: SessionStart | null;
  sessionId: string;
  plannedSeconds: number;
  startedTaskName: string;
  accumulatedMs: number;
  runningSince: number | null;
};

export type DiaryLog = {
  startInfo: SessionStart | null;
  logDate: string;
  id: string;
  completedAt: number;
  completedDate: string;
  completedTime?: string;
  totalTimerSeconds: number;
  diary: string;
  unlockedEpisodeId: EpisodeId | null;
};

export type AppState = {
  schemaVersion: typeof APP_SCHEMA_VERSION;
  bgmVolume: number;
  seVolume: number;
  userName: string;
  notificationHour: number;
  notificationMinute: number;
  defaultTimerMinutes: number;
  taskName: string;
  totalNt: number;
  totalCompletions: number;
  lastCompletionDate: string | null;
  unlockedStories: UnlockedStory[];
  storyRouteProgress: Partial<Record<EpisodeId, StoryRouteProgress>>;
  purchasedSideStoryIds: number[];
  announcedSideStoryIds: number[];
  diaryLogs: DiaryLog[];
  activeTimer: ActiveTimer | null;
};

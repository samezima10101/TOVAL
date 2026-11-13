export const APP_SCHEMA_VERSION = 1;
export const MAX_TASK_NAME_LENGTH = 80;
export const MAX_DIARY_LENGTH = 1000;
export const MAX_PLANNED_SECONDS = (23 * 60 + 55) * 60;

export type EpisodeId = number;
export type Speaker = "boss" | "sub";
export type StorySpeaker = Speaker | "both" | "system";
export type StoryCharacter = "gem" | "alta";
type LegacyExpression = "normal" | "talk" | "doubt" | "none";
type NormalExpression = `normal${1 | 2 | 3 | 4}`;
export type GemExpression =
  | LegacyExpression
  | NormalExpression
  | `surprised${1 | 2 | 3 | 4}`
  | `doubt${1 | 2 | 3 | 4 | 5 | 6}`
  | `beam${1 | 2}`
  | `nervous${1 | 2 | 3 | 4}`
  | `annoyed${1}`
  | "smile3"
  | `shocked${1 | 2 | 3 | 4}`
  | `glare${1 | 2}`
  | `cutesy${1 | 2}`;
export type AltaExpression =
  | LegacyExpression
  | NormalExpression
  | `grumpy${1 | 2 | 3 | 4}`
  | `grin${1 | 2 | 3 | 4}`
  | `sparkle${1 | 2}`
  | `smirk${3 | 4}`
  | `shocked${3 | 4}`
  | "angry2"
  | `nervous${1 | 2 | 3 | 4}`
  | `gemized${2}`;
export type Expression = GemExpression | AltaExpression;

export type StoryLine = {
  effect?: { type: "shout"; target: StoryCharacter };
  slideBackground?: boolean;
  slide?: "slide1" | "slide2" | "slide3" | "slide4";
  id: string;
  speaker: StorySpeaker;
  text: string;
  left: GemExpression;
  right: AltaExpression;
};

export type StoryChoice = {
  id: string;
  label: string;
  lines: readonly StoryLine[];
  choices?: readonly StoryChoice[];
};

export type StoryRouteRequirement = {
  description: string;
  episodeIds: readonly EpisodeId[];
} & (
  | { type: "anyEpisodeRouteCount"; count: number }
  | { type: "allEpisodeRoutes" }
);

export type StoryRoute = StoryChoice & {
  requirement?: StoryRouteRequirement;
};

export type StoryEpisode = {
  id: EpisodeId;
  title: string;
  soloCharacter?: StoryCharacter;
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
  startInfo: SessionStart;
  sessionId: string;
  plannedSeconds: number;
  startedTaskName: string;
  accumulatedMs: number;
  runningSince: number | null;
};

export type DiaryLog = {
  startInfo: SessionStart;
  logDate: string;
  id: string;
  completedAt: number;
  completedDate: string;
  completedTime: string;
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
  // 初回ショップ挨拶を読了したときだけ付ける完了印。
  sideStoryOpeningSeen?: true;
  diaryLogs: DiaryLog[];
  activeTimer: ActiveTimer | null;
};

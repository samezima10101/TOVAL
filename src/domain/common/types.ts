export const APP_SCHEMA_VERSION = 4;
export const STORY_ROUTE_UNLOCK_COST_NT = 60;
export const MAX_PLANNED_SECONDS = (23 * 60 + 55) * 60;
export const STORY_COUNT = 3;

export type EpisodeId = number;
export type Speaker = "boss" | "sub";
export type StoryCharacter = "gem" | "alta";
export type Expression = "normal" | "talk" | "doubt";

export type StoryLine = {
  id: string;
  speaker: Speaker;
  text: string;
  left: Expression;
  right: Expression;
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

export type StoryRouteProgress = {
  firstSelectedRouteId?: string;
  extraUnlockedRouteIds: string[];
};

export type UnlockedStory = {
  episodeId: EpisodeId;
  unlockedDate: string;
  isRead: boolean;
};

export type ActiveTimer = {
  sessionId: string;
  plannedSeconds: number;
  startedTaskName: string;
  accumulatedMs: number;
  runningSince: number | null;
};

export type AppState = {
  schemaVersion: typeof APP_SCHEMA_VERSION;
  userName: string;
  taskName: string;
  totalNt: number;
  totalCompletions: number;
  lastCompletionDate: string | null;
  unlockedStories: UnlockedStory[];
  storyRouteProgress: Partial<Record<EpisodeId, StoryRouteProgress>>;
  activeTimer: ActiveTimer | null;
};

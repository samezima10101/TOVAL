export const APP_SCHEMA_VERSION = 2;
export const MAX_PLANNED_SECONDS = (23 * 60 + 55) * 60;
export const STORY_COUNT = 3;

export type EpisodeId = 1 | 2 | 3;
export type Speaker = "boss" | "sub";
export type StoryCharacter = "gem" | "alta";
export type Expression = "normal" | "talk" | "doubt";

export type StoryLine = {
  row: number;
  speaker: Speaker;
  text: string;
  left: Expression;
  right: Expression;
};

export type StoryEpisode = {
  id: EpisodeId;
  title: string;
  lines: readonly StoryLine[];
};

export type UnlockedStory = {
  episodeId: EpisodeId;
  unlockedDate: string;
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
  activeTimer: ActiveTimer | null;
};

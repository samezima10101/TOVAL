import type { AudioSource } from "expo-audio";

export const DEFAULT_BGM_VOLUME = 0.3;
export const DEFAULT_SE_VOLUME = 1;

// BGM and sound effects have independent persisted runtime volumes.
export const AUDIO_VOLUMES = { bgm: DEFAULT_BGM_VOLUME, se: DEFAULT_SE_VOLUME } as const;

export function isValidAudioVolume(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}

export const TAB_PRESS_SOUND = require("@/assets/audio/tabs.mp3") as AudioSource;

export const BGM_TRACKS = {
  non: { source: null },
  default: {
    source: require("@/assets/audio/timer-bgm.mp3") as AudioSource,
  },
} as const satisfies Record<string, { source: AudioSource }>;

export type BgmTrackId = keyof typeof BGM_TRACKS;
export type AppRoute =
  | "/"
  | "/memory"
  | "/timer"
  | "/story"
  | "/log"
  | "/shop"
  | "/menu"
  | "/side-story";

/** Each screen can select a different registered track without its own player. */
export const SCREEN_BGM: Record<AppRoute, BgmTrackId> = {
  "/": "default",
  "/memory": "default",
  "/timer": "default",
  "/story": "default",
  "/log": "default",
  "/shop": "non",
  "/menu": "default",
  "/side-story": "non",
};

export function getScreenBgm(pathname: string): AudioSource {
  const trackId = SCREEN_BGM[pathname as AppRoute];
  return trackId ? BGM_TRACKS[trackId].source : null;
}

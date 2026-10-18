import type { AudioSource } from "expo-audio";

export const DEFAULT_BGM_ENABLED = true;

// The future menu should own runtime volumes and pass bgm to useScreenBgm.
// BGM enablement is independent of SE. No SE player or persisted volume yet.
export const AUDIO_VOLUMES = { bgm: 0.3, se: 1 } as const;

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
  | "/side-story";

/** Each screen can select a different registered track without its own player. */
export const SCREEN_BGM: Record<AppRoute, BgmTrackId> = {
  "/": "default",
  "/memory": "default",
  "/timer": "default",
  "/story": "default",
  "/log": "default",
  "/shop": "non",
  "/side-story": "non",
};

export function getScreenBgm(pathname: string): AudioSource {
  const trackId = SCREEN_BGM[pathname as AppRoute];
  return trackId ? BGM_TRACKS[trackId].source : null;
}

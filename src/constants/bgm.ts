import type { AudioSource } from "expo-audio";

export const BGM_VOLUME = 0.3;

type BgmTrackDefinition = {
  source: AudioSource;
  volume: number;
};

export const BGM_TRACKS = {
  default: {
    source: require("@/assets/audio/timer-bgm.mp3") as AudioSource,
    volume: BGM_VOLUME,
  },
} as const satisfies Record<string, BgmTrackDefinition>;

export type BgmTrackId = keyof typeof BGM_TRACKS;
export type BgmTrack = BgmTrackDefinition;
export type AppRoute = "/" | "/memory" | "/timer" | "/story" | "/log" | "/shop" | "/side-story";

/** Assign one track to each screen so future screen-specific substitutions stay centralized. */
export const SCREEN_BGM: Record<AppRoute, BgmTrackId> = {
  "/": "default",
  "/memory": "default",
  "/timer": "default",
  "/story": "default",
  "/log": "default",
  "/shop": "default",
  "/side-story": "default",
};

export function getScreenBgm(pathname: string) {
  const trackId = SCREEN_BGM[pathname as AppRoute];
  return trackId ? BGM_TRACKS[trackId] : null;
}

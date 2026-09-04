import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import React from "react";

import { BGM_VOLUME, type BgmTrack } from "@/src/constants/bgm";

/** Plays the track assigned to the currently focused screen through one shared player. */
export default function useScreenBgm(track: BgmTrack | null) {
  const player = useAudioPlayer(null);

  React.useEffect(() => {
    player.loop = true;
    player.volume = track?.volume ?? BGM_VOLUME;
    void setAudioModeAsync({ playsInSilentMode: true }).catch(() => undefined);
  }, [player, track?.volume]);

  React.useEffect(() => {
    if (!track) {
      player.pause();
      return;
    }

    // Pause before replacing so a future route-specific track cannot overlap the old one.
    player.pause();
    player.replace(track.source);
    player.play();
  }, [player, track]);
}

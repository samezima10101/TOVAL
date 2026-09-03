import { useAudioPlayer, setAudioModeAsync } from "expo-audio";
import React from "react";

const BGM_VOLUME = 0.3;
const BGM_SOURCE = require("@/assets/audio/timer-bgm.mp3");

/** Plays the timer BGM only while the timer's active segment is running. */
export default function useTimerBgm(isTimerRunning: boolean) {
  const player = useAudioPlayer(BGM_SOURCE);

  React.useEffect(() => {
    player.loop = true;
    player.volume = BGM_VOLUME;

    void setAudioModeAsync({ playsInSilentMode: true }).catch(() => undefined);
  }, [player]);

  React.useEffect(() => {
    if (isTimerRunning) {
      player.play();
    } else {
      player.pause();
    }
  }, [isTimerRunning, player]);
}

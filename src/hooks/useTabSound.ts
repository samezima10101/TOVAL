import { useAudioPlayer, type AudioPlayer } from "expo-audio";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";

import { prepareAudioSession } from "@/src/audio/audioSession";
import { TAB_PRESS_SOUND } from "@/src/config/audioSettings";

type TabSoundController = {
  play: () => void;
  setVolume: (volume: number) => void;
  setFocused: (focused: boolean) => void;
};

function pausePlayer(player: AudioPlayer) {
  try {
    player.pause();
  } catch (error) {
    console.warn("Tab sound pause failed", error);
  }
}

function configurePlayer(player: AudioPlayer, volume: number) {
  player.loop = false;
  player.volume = volume;
}

/** One player for physical tab presses; navigation and audio mode stay external. */
export default function useTabSound(volume: number): () => void {
  const player = useAudioPlayer(TAB_PRESS_SOUND, {
    downloadFirst: true,
    // A short effect ending/pausing must not deactivate the BGM's session.
    keepAudioSessionActive: true,
  });
  const controller = useRef<TabSoundController | null>(null);
  const focusedRef = useRef(false);

  useEffect(() => {
    let disposed = false;
    let focused = focusedRef.current;
    let active = AppState.currentState === "active";
    let currentVolume = 0;
    let revision = 0;
    let pending = false;
    let draining = false;
    let playbackAuthorized = false;
    let cancelLoading: (() => void) | undefined;
    const canPlay = () => !disposed && focused && active &&
      AppState.currentState === "active" && currentVolume > 0;

    const stop = () => {
      revision++;
      pending = false;
      playbackAuthorized = false;
      cancelLoading?.();
      pausePlayer(player);
    };

    const waitUntilLoaded = () => new Promise<boolean>((resolve, reject) => {
      let settled = false;
      let subscription: ReturnType<typeof player.addListener> | undefined;
      let timeout: ReturnType<typeof setTimeout> | undefined;
      const finish = (ready: boolean, error?: unknown) => {
        if (settled) return;
        settled = true;
        if (timeout !== undefined) clearTimeout(timeout);
        subscription?.remove();
        cancelLoading = undefined;
        if (error) reject(error);
        else resolve(ready);
      };
      cancelLoading = () => finish(false);
      timeout = setTimeout(() => finish(false, new Error("Tab sound loading timed out")), 15000);
      subscription = player.addListener("playbackStatusUpdate", (status) => {
        if (status.error) finish(false, new Error(status.error));
        else if (status.isLoaded) finish(true);
      });
      try {
        const status = player.currentStatus;
        if (status.error) finish(false, new Error(status.error));
        else if (status.isLoaded) finish(true);
      } catch (error) {
        finish(false, error);
      }
    });

    const drain = async () => {
      if (draining) return;
      draining = true;
      try {
        // Keep one latest request, rather than queueing a sound for every tap.
        // Only this worker seeks, so an older seek cannot finish after a newer one.
        while (pending && canPlay()) {
          pending = false;
          const requested = revision;
          try {
            if (!await waitUntilLoaded() || requested !== revision || !canPlay()) continue;
            await prepareAudioSession();
            if (requested !== revision || !canPlay()) continue;
            await player.seekTo(0, 0, 0);
            if (requested !== revision || !canPlay()) continue;
            configurePlayer(player, currentVolume);
            playbackAuthorized = true;
            player.play();
          } catch (error) {
            playbackAuthorized = false;
            console.warn("Tab sound playback failed", error);
          }
        }
      } finally {
        draining = false;
      }
    };

    const controls: TabSoundController = {
      play: () => {
        if (!canPlay()) return;
        revision++;
        pending = true;
        playbackAuthorized = false;
        pausePlayer(player);
        void drain();
      },
      setVolume: (nextVolume) => {
        currentVolume = Number.isFinite(nextVolume) ? Math.max(0, Math.min(1, nextVolume)) : 0;
        if (currentVolume === 0) stop();
        try {
          configurePlayer(player, currentVolume);
        } catch (error) {
          console.warn("Tab sound volume change failed", error);
        }
      },
      setFocused: (nextFocused) => {
        focused = nextFocused;
        if (!focused) stop();
      },
    };
    controller.current = controls;
    const lifecycle = AppState.addEventListener("change", (state) => {
      active = state === "active";
      // expo-audio can resume players it paused on backgrounding. Discard this
      // one-shot on both edges; only a new foreground press may authorize it.
      stop();
    });
    const playback = player.addListener("playbackStatusUpdate", (status) => {
      if (status.didJustFinish) playbackAuthorized = false;
      if (status.playing && (!playbackAuthorized || !canPlay())) pausePlayer(player);
    });
    return () => {
      disposed = true;
      lifecycle.remove();
      playback.remove();
      stop();
      if (controller.current === controls) controller.current = null;
    };
  }, [player]);

  useEffect(() => {
    controller.current?.setVolume(volume);
  }, [player, volume]);

  useFocusEffect(useCallback(() => {
    focusedRef.current = true;
    controller.current?.setFocused(true);
    return () => {
      focusedRef.current = false;
      controller.current?.setFocused(false);
    };
  }, []));

  return useCallback(() => controller.current?.play(), []);
}

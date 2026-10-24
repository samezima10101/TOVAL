import { useAudioPlayer, type AudioPlayer, type AudioSource } from "expo-audio";
import { Asset } from "expo-asset";
import React from "react";
import { AppState } from "react-native";

import { prepareAudioSession } from "@/src/audio/audioSession";

// AudioPlayer is a native SharedObject with a writable volume property.
function updatePlayerVolume(player: AudioPlayer, volume: number) {
  player.volume = volume;
}

/** Root-only player. UI modals and timer eligibility do not own audio state. */
export default function useScreenBgm(source: AudioSource, enabled: boolean, volume: number) {
  const player = useAudioPlayer(null);
  const [error, setError] = React.useState<string | null>(null);
  const [retryRevision, retry] = React.useReducer((value: number) => value + 1, 0);
  const loaded = React.useRef<{ player: typeof player; source: AudioSource } | null>(null);
  const queue = React.useRef<Promise<void>>(Promise.resolve());
  const volumeRef = React.useRef(volume);

  // Dragging the slider only updates volume; keep the current track/session.
  React.useEffect(() => {
    volumeRef.current = Math.max(0, Math.min(1, volume));
    try {
      updatePlayerVolume(player, volumeRef.current);
    } catch (failure) {
      console.warn("BGM volume change failed", failure);
      // Report a failure while synchronizing the external native player.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError("BGMの音量を変更できませんでした。再試行できます。");
    }
  }, [player, volume, retryRevision]);

  React.useEffect(() => {
    let cancelled = false;
    let active = AppState.currentState === "active";
    let revision = 0;
    let failed = false;
    let cancelLoading: (() => void) | undefined;

    const prepareAsset = (asset: Asset): Promise<boolean> => new Promise((resolve, reject) => {
      let settled = false;
      const finish = (ready: boolean, failure?: unknown) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        cancelLoading = undefined;
        if (failure) reject(failure);
        else resolve(ready);
      };
      const timeout = setTimeout(() => finish(false, new Error("BGM download timed out")), 15000);
      cancelLoading = () => finish(false);
      void asset.downloadAsync().then(() => finish(true), (failure: unknown) => finish(false, failure));
    });

    // replace() starts loading asynchronously. play() before ready can race
    // iOS's delayed audio-session deactivation after pause().
    const loadSource = (replacement?: AudioSource): Promise<boolean> => new Promise((resolve, reject) => {
      let settled = false;
      const finish = (ready: boolean, failure?: unknown) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        subscription.remove();
        cancelLoading = undefined;
        if (failure) reject(failure);
        else resolve(ready);
      };
      const subscription = player.addListener("playbackStatusUpdate", (status) => {
        if (status.error) finish(false, new Error(status.error));
        else if (status.isLoaded) finish(true);
      });
      const timeout = setTimeout(() => finish(false, new Error("BGM loading timed out")), 15000);
      cancelLoading = () => finish(false);
      try {
        if (replacement !== undefined) player.replace(replacement);
        const status = player.currentStatus;
        if (status.error) finish(false, new Error(status.error));
        else if (status.isLoaded) finish(true);
      } catch (failure) { finish(false, failure); }
    });

    const reportFailure = (failure: unknown) => {
      if (cancelled || failed) return;
      failed = true;
      revision += 1;
      loaded.current = null;
      console.warn("BGM playback failed", failure);
      setError("BGMを再生・停止できませんでした。再試行できます。");
      try { player.pause(); } catch (pauseError) {
        console.warn("BGM pause failed", pauseError);
      }
    };

    const reconcile = () => {
      const requested = ++revision;
      cancelLoading?.();
      // Stop synchronously even while audio mode setup is pending.
      if (!active || !enabled || source === null) {
        try {
          if (loaded.current?.player === player || player.playing) player.pause();
          setError(null);
        } catch (failure) { reportFailure(failure); }
        return;
      }
      const apply = async () => {
        if (cancelled || requested !== revision) return;
        try {
          failed = false;
          await prepareAudioSession();
          if (cancelled || requested !== revision || AppState.currentState !== "active") return;
          // Expo's SharedObject exposes writable native playback properties.
          player.loop = true;
          updatePlayerVolume(player, volumeRef.current);
          if (loaded.current?.player !== player || loaded.current.source !== source) {
            // Bundled require() assets may still be served over Metro in Expo
            // Go. Download first so AVPlayer loads a local file with its suffix.
            const asset = typeof source === "number" ? Asset.fromModule(source) : null;
            if (asset && !await prepareAsset(asset)) return;
            if (cancelled || requested !== revision || AppState.currentState !== "active") return;
            // Avoid scheduling native session deactivation for an empty player.
            if (loaded.current?.player === player) player.pause();
            loaded.current = { player, source };
            const ready = await loadSource(asset?.localUri ? { uri: asset.localUri } : source);
            if (!ready) return;
          } else if (!player.isLoaded) {
            if (!await loadSource()) return;
          }
          if (failed || cancelled || requested !== revision || AppState.currentState !== "active") return;
          player.play();
          if (!failed) setError(null);
        } catch (failure) { reportFailure(failure); }
      };
      // Serialize across route changes, retries and lifecycle events.
      queue.current = queue.current.then(apply, apply);
    };

    const playback = player.addListener("playbackStatusUpdate", (status) => {
      // A failed source can keep emitting status while a retry configures the
      // session. Only attribute errors to the currently loaded, enabled source.
      if (enabled && loaded.current?.player === player && loaded.current.source === source && status.error) {
        reportFailure(status.error);
      }
    });
    const lifecycle = AppState.addEventListener("change", (state) => {
      active = state === "active";
      reconcile();
    });
    reconcile();
    return () => {
      cancelled = true;
      revision += 1;
      cancelLoading?.();
      lifecycle.remove();
      playback.remove();
      // useAudioPlayer releases the single native player on unmount.
    };
  }, [enabled, player, source, retryRevision]);

  return { error, retry };
}

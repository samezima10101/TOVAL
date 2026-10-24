import { setAudioModeAsync } from "expo-audio";

let preparation: Promise<void> | null = null;

/** Both players share one mode, including when only sound effects are enabled. */
export function prepareAudioSession(): Promise<void> {
  preparation ??= setAudioModeAsync({
    playsInSilentMode: false,
    shouldPlayInBackground: false,
    allowsRecording: false,
    allowsBackgroundRecording: false,
    interruptionMode: "mixWithOthers",
  }).catch((failure: unknown) => {
    preparation = null;
    throw failure;
  });
  return preparation;
}

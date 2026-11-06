import AsyncStorage from "@react-native-async-storage/async-storage";

// Independent of the app-state schema: practice never writes timer/reward data.
export const TUTORIAL_STORAGE_KEY = "@my-june/tutorial-v1";
export type TutorialResult = "completed" | "skipped";

export async function hasFinishedTutorial(): Promise<boolean> {
  const result = await AsyncStorage.getItem(TUTORIAL_STORAGE_KEY);
  if (result === null) return false;
  if (result !== "completed" && result !== "skipped") {
    throw new Error("チュートリアルの保存状態を読み込めませんでした。");
  }
  return true;
}

export async function saveTutorialResult(
  result: TutorialResult,
): Promise<void> {
  await AsyncStorage.setItem(TUTORIAL_STORAGE_KEY, result);
}

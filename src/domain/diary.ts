import { AppState, MAX_DIARY_LENGTH } from "./common/types";

export function normalizeDiary(diary: string): string {
  if (diary.length > MAX_DIARY_LENGTH) {
    throw new RangeError(`日記は${MAX_DIARY_LENGTH}文字以内で入力してください。`);
  }
  return diary.trim();
}

export function editDiary(state: AppState, logId: string, diary: string): AppState {
  const normalized = normalizeDiary(diary);
  if (!state.diaryLogs.some((log) => log.id === logId)) {
    throw new Error("編集する記録が見つかりません。");
  }
  return {
    ...state,
    diaryLogs: state.diaryLogs.map((log) => log.id === logId ? { ...log, diary: normalized } : log),
  };
}

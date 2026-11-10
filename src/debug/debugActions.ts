import { localDateKey, localTimeKey } from "@/src/domain/common/date";
import type { AppState } from "@/src/domain/common/types";
import { STORY_CATALOG } from "@/src/domain/storyData";
import { createInitialAppState } from "@/src/storage/appStateRepository";

export function requireIdle(state: AppState) {
  if (state.activeTimer) throw new Error("進行中のタイマーを終了またはキャンセルしてから操作してください。");
}

export function resetProgress(state: AppState): AppState {
  requireIdle(state);
  return {
    ...createInitialAppState(),
    taskName: state.taskName,
    userName: state.userName,
    bgmVolume: state.bgmVolume,
    seVolume: state.seVolume,
    notificationHour: state.notificationHour,
    notificationMinute: state.notificationMinute,
    defaultTimerMinutes: state.defaultTimerMinutes,
  };
}

// Standalone fixtures replace progress instead of pretending to be real history.
export function storyFixture(state: AppState, allRoutes: boolean): AppState {
  const next = resetProgress(state);
  const today = localDateKey(Date.now());
  return {
    ...next,
    taskName: next.taskName || "デバッグ用タスク",
    totalNt: 3000,
    totalCompletions: STORY_CATALOG.episodes.length,
    lastCompletionDate: today,
    unlockedStories: STORY_CATALOG.episodes.map(({ id }) => ({ episodeId: id, unlockedDate: today })),
    storyRouteProgress: allRoutes ? Object.fromEntries(STORY_CATALOG.episodes.flatMap((episode) => {
      const routes = episode.routes ?? [];
      return routes.length ? [[episode.id, { firstSelectedRouteId: routes[0].id, extraUnlockedRouteIds: routes.slice(1).map(({ id }) => id) }]] : [];
    })) : {},
  };
}

export function diaryFixture(state: AppState): AppState {
  const next = resetProgress(state);
  const date = new Date();
  const diaryLogs = [2, 1, 0].map((daysAgo, index) => {
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate() - daysAgo, 9, 5);
    const startedAt = start.getTime();
    const totalTimerSeconds = [0, 2715, 3600][index];
    const completedAt = startedAt + totalTimerSeconds * 1000;
    const startedDate = localDateKey(startedAt);
    return {
      id: `debug-diary-${startedAt}-${index}`,
      startInfo: { startedAt, startedDate, startedTime: localTimeKey(startedAt) },
      logDate: startedDate,
      completedAt,
      completedDate: localDateKey(completedAt),
      completedTime: localTimeKey(completedAt).slice(0, 5),
      totalTimerSeconds,
      diary: ["", "テスト用の日記です。\n改行と編集を確認します。", "日記の長文表示を確認します。".repeat(60)][index],
      unlockedEpisodeId: null,
    };
  });
  return {
    ...next,
    taskName: next.taskName || "デバッグ用タスク",
    totalNt: diaryLogs.reduce((total, log) => total + log.totalTimerSeconds, 0),
    totalCompletions: diaryLogs.length,
    lastCompletionDate: diaryLogs[diaryLogs.length - 1].completedDate,
    diaryLogs,
  };
}

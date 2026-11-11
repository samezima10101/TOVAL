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

export function setEpisodeProgress(state: AppState, through: number): AppState {
  requireIdle(state);
  const episodes = STORY_CATALOG.episodes;
  if (through !== 0 && !episodes.some(({ id }) => id === through)) {
    throw new Error("解放する話数が正しくありません。");
  }
  const unlockedEpisodes = episodes.filter(({ id }) => id <= through);
  const unlockedIds = new Set(unlockedEpisodes.map(({ id }) => id));
  const now = new Date();
  return {
    ...state,
    unlockedStories: unlockedEpisodes.map(({ id }, index) => {
      const saved = state.unlockedStories.find((story) => story.episodeId === id);
      // New debug rights belong to past days, so the home screen does not
      // mistake several newly granted episodes for today's daily episode.
      return saved ?? {
        episodeId: id,
        unlockedDate: localDateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - unlockedEpisodes.length + index).getTime()),
      };
    }),
    storyRouteProgress: Object.fromEntries(Object.entries(state.storyRouteProgress)
      .filter(([id]) => unlockedIds.has(Number(id)))),
  };
}

export function setChoiceProgress(state: AppState, from: number, through: number, count: number): AppState {
  requireIdle(state);
  const episodes = STORY_CATALOG.episodes;
  if (!episodes.some(({ id }) => id === from) || !episodes.some(({ id }) => id === through) || from > through) {
    throw new Error("開始話と終了話を正しく選択してください。");
  }
  const selected = episodes.filter(({ id }) => id >= from && id <= through);
  if (selected.some(({ id }) => !state.unlockedStories.some((story) => story.episodeId === id))) {
    throw new Error("先に対象のエピソードを解放してください。");
  }
  if (!Number.isInteger(count) || count < 0 || selected.some((episode) => count > (episode.routes?.length ?? 0))) {
    throw new Error("解放する選択肢の個数が正しくありません。");
  }
  const storyRouteProgress = { ...state.storyRouteProgress };
  for (const episode of selected) {
    // Debug grants deliberately bypass purchase conditions and do not spend NT.
    // A count always means the first N top-level choices in content order.
    const routes = (episode.routes ?? []).slice(0, count);
    if (!routes.length) delete storyRouteProgress[episode.id];
    else storyRouteProgress[episode.id] = {
      firstSelectedRouteId: routes[0].id,
      extraUnlockedRouteIds: routes.slice(1).map(({ id }) => id),
    };
  }
  return { ...state, storyRouteProgress };
}

export function adjustNt(state: AppState, amount: string, direction: 1 | -1): AppState {
  const value = amount.trim();
  const quantity = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(quantity) || quantity <= 0) {
    throw new Error("NTは1以上の安全な整数で入力してください。");
  }
  const totalNt = state.totalNt + direction * quantity;
  if (totalNt < 0) throw new Error("残高を超えるNTは減算できません。");
  if (!Number.isSafeInteger(totalNt)) throw new Error("NTの保存上限を超えています。");
  return { ...state, totalNt };
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

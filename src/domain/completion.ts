import { localDateKey } from "./common/date";
import { AppState, EpisodeId, UnlockedStory } from "./common/types";
import { STORY_CATALOG, StoryCatalog } from "./storyData";
import { getTimerSnapshot } from "./timer";

export type CompletionStatus = "completed" | "not-ready" | "no-active-timer";

export type CompletionOutcome = {
  status: CompletionStatus;
  state: AppState;
  earnedNt: number;
  unlockedEpisode: EpisodeId | null;
};

export type CancellationOutcome = {
  cancelled: boolean;
  state: AppState;
};

const cloneState = (state: AppState): AppState => ({
  ...state,
  unlockedStories: state.unlockedStories.map((story) => ({ ...story })),
  activeTimer: state.activeTimer ? { ...state.activeTimer } : null,
});

export function isFirstCompletionOnDate(
  state: AppState,
  dateKey: string,
): boolean {
  return state.lastCompletionDate !== dateKey;
}

function nextUnlockedStory(
  state: AppState,
  dateKey: string,
  catalog: StoryCatalog,
): { unlockedEpisode: EpisodeId | null; unlockedStories: UnlockedStory[] } {
  if (!isFirstCompletionOnDate(state, dateKey)) {
    return {
      unlockedEpisode: null,
      unlockedStories: state.unlockedStories.map((story) => ({ ...story })),
    };
  }

  const unlockedIds = new Set(
    state.unlockedStories.map((story) => story.episodeId),
  );
  const nextEpisode = catalog.episodes.find(
    (episode) => !unlockedIds.has(episode.id),
  );
  if (nextEpisode) {
    return {
      unlockedEpisode: nextEpisode.id,
      unlockedStories: [
        ...state.unlockedStories.map((story) => ({ ...story })),
        {
          episodeId: nextEpisode.id,
          unlockedDate: dateKey,
          isRead: false,
        },
      ],
    };
  }

  return {
    unlockedEpisode: null,
    unlockedStories: state.unlockedStories.map((story) => ({ ...story })),
  };
}

export function completeTimer(
  state: AppState,
  finishedAt = Date.now(),
  catalog: StoryCatalog = STORY_CATALOG,
  diary = "",
): CompletionOutcome {
  if (!state.activeTimer) {
    return {
      status: "no-active-timer",
      state,
      earnedNt: 0,
      unlockedEpisode: null,
    };
  }

  const snapshot = getTimerSnapshot(state.activeTimer, finishedAt);
  if (!snapshot.isComplete) {
    return {
      status: "not-ready",
      state,
      earnedNt: 0,
      unlockedEpisode: null,
    };
  }

  const completionDate = localDateKey(finishedAt);
  const unlock = nextUnlockedStory(state, completionDate, catalog);
  const nextState: AppState = {
    ...cloneState(state),
    totalNt: state.totalNt + snapshot.earnedNt,
    totalCompletions: state.totalCompletions + 1,
    lastCompletionDate: completionDate,
    unlockedStories: unlock.unlockedStories,
    diaryLogs: [
      ...state.diaryLogs,
      {
        id: state.activeTimer.sessionId,
        completedAt: finishedAt,
        completedDate: completionDate,
        totalTimerSeconds: snapshot.elapsedSeconds,
        diary: diary.trim(),
        unlockedEpisodeId: unlock.unlockedEpisode,
      },
    ],
    activeTimer: null,
  };

  return {
    status: "completed",
    state: nextState,
    earnedNt: snapshot.earnedNt,
    unlockedEpisode: unlock.unlockedEpisode,
  };
}

export function cancelTimer(
  state: AppState,
  cancelledAt = Date.now(),
): CancellationOutcome {
  if (!state.activeTimer) {
    return { cancelled: false, state };
  }

  const snapshot = getTimerSnapshot(state.activeTimer, cancelledAt);
  if (snapshot.isComplete) {
    return { cancelled: false, state };
  }

  return {
    cancelled: true,
    state: {
      ...cloneState(state),
      activeTimer: null,
    },
  };
}

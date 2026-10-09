import { localDateKey, shiftLocalDateKey } from "@/src/domain/common/date";
import {
  ActiveTimer,
  APP_SCHEMA_VERSION,
  AppState,
} from "@/src/domain/common/types";
import { cancelTimer, completeTimer } from "@/src/domain/completion";
import {
  getLatestUnlockedEpisode,
  getLatestUnreadEpisode,
  getPlayableStoryLines,
  isStoryRouteUnlocked,
} from "@/src/domain/storyData";
import {
  branchingEpisodeId,
  branchingStory,
  linearStory,
  primaryRoute,
  secondaryRoute,
  storyCatalog,
} from "./fixtures/story";
import {
  formatDuration,
  getTimerSnapshot,
  pauseTimer,
  resumeTimer,
} from "@/src/domain/timer";

function stateWithTimer(timer: ActiveTimer): AppState {
  return {
    schemaVersion: APP_SCHEMA_VERSION,
    userName: "",
    taskName: "読書",
    totalNt: 7,
    totalCompletions: 2,
    lastCompletionDate: null,
    unlockedStories: [],
    storyRouteProgress: {},
    purchasedSideStoryIds: [],
    announcedSideStoryIds: [],
    diaryLogs: [],
    activeTimer: timer,
  };
}

describe("local dates", () => {
  it("moves across month boundaries", () => {
    expect(shiftLocalDateKey("2025-03-01", -1)).toBe("2025-02-28");
    expect(shiftLocalDateKey("2025-12-31", 1)).toBe("2026-01-01");
  });
});

describe("timer calculations", () => {
  const timer: ActiveTimer = {
    sessionId: "session",
    plannedSeconds: 60,
    startedTaskName: "読書",
    accumulatedMs: 0,
    runningSince: 1_000,
  };

  it("handles zero elapsed, exact deadline, remaining, and overtime", () => {
    expect(getTimerSnapshot(timer, 1_000)).toMatchObject({
      elapsedMs: 0,
      elapsedSeconds: 0,
      remainingSeconds: 60,
      overtimeSeconds: 0,
      isComplete: false,
      earnedNt: 0,
    });
    expect(getTimerSnapshot(timer, 30_999)).toMatchObject({
      elapsedMs: 29_999,
      elapsedSeconds: 29,
      remainingSeconds: 31,
      isComplete: false,
    });
    expect(getTimerSnapshot(timer, 61_000)).toMatchObject({
      elapsedSeconds: 60,
      remainingSeconds: 0,
      overtimeSeconds: 0,
      isComplete: true,
      earnedNt: 60,
    });
    expect(getTimerSnapshot(timer, 62_250)).toMatchObject({
      elapsedSeconds: 61,
      overtimeSeconds: 1,
      isComplete: true,
    });
  });

  it("keeps partial seconds in milliseconds until the snapshot floors them", () => {
    const pausedTimer: ActiveTimer = {
      ...timer,
      accumulatedMs: 1_250,
      runningSince: null,
    };
    expect(getTimerSnapshot(pausedTimer, 100_000)).toMatchObject({
      elapsedMs: 1_250,
      elapsedSeconds: 1,
      earnedNt: 1,
    });

    const resumedTimer = resumeTimer(pausedTimer, 5_000);
    expect(getTimerSnapshot(resumedTimer, 6_250)).toMatchObject({
      elapsedMs: 2_500,
      elapsedSeconds: 2,
      earnedNt: 2,
    });
  });

  it("makes repeated pause and resume transitions idempotent", () => {
    const running = resumeTimer({ ...timer, runningSince: null }, 1_000);
    expect(resumeTimer(running, 2_000)).toBe(running);

    const paused = pauseTimer(running, 2_250);
    expect(paused).toMatchObject({ accumulatedMs: 1_250, runningSince: null });
    expect(pauseTimer(paused, 9_000)).toBe(paused);

    const resumed = resumeTimer(paused, 10_000);
    expect(resumed.runningSince).toBe(10_000);
    expect(getTimerSnapshot(resumed, 11_000).elapsedMs).toBe(2_250);
  });

  it("floors NT and formats hours beyond 59 minutes", () => {
    const longTimer = { ...timer, plannedSeconds: 3_600 };
    expect(getTimerSnapshot(longTimer, 1_000 + 3_599_999).earnedNt).toBe(3599);
    expect(formatDuration(3_599)).toBe("00:59:59");
    expect(formatDuration(3_600)).toBe("01:00:00");
    expect(formatDuration(86_101)).toBe("23:55:01");
  });
});

describe("story routes", () => {
  it("plays a linear story without routes", () => {
    expect(linearStory.routes).toBeUndefined();
    expect(getPlayableStoryLines(linearStory)).toEqual([
      ...linearStory.commonBefore,
      ...linearStory.commonAfter,
    ]);
  });

  it("joins a selected route back into the common ending", () => {
    expect(getPlayableStoryLines(branchingStory, secondaryRoute.id)).toEqual([
      ...branchingStory.commonBefore,
      ...secondaryRoute.lines,
      ...branchingStory.commonAfter,
    ]);
    expect(
      isStoryRouteUnlocked(
        {
          firstSelectedRouteId: primaryRoute.id,
          extraUnlockedRouteIds: [secondaryRoute.id],
        },
        secondaryRoute.id,
      ),
    ).toBe(true);
  });
});

describe("home story talk entry", () => {
  it("has no entry without an unlocked story and targets the newest relevant story", () => {
    expect(getLatestUnlockedEpisode([], storyCatalog)).toBeUndefined();

    const latestEpisode =
      storyCatalog.episodes[storyCatalog.episodes.length - 1];
    const unlockedStories = storyCatalog.episodes.map((episode, index) => ({
      episodeId: episode.id,
      unlockedDate: `2025-01-${String(index + 1).padStart(2, "0")}`,
      isRead: true,
    }));
    expect(
      getLatestUnlockedEpisode(
        [
          ...unlockedStories,
          {
            episodeId: latestEpisode.id,
            unlockedDate: "2025-02-01",
            isRead: false,
          },
        ],
        storyCatalog,
      ),
    ).toBe(latestEpisode);

    const unreadEpisode =
      storyCatalog.episodes[Math.max(storyCatalog.episodes.length - 2, 0)];
    expect(
      getLatestUnreadEpisode(
        storyCatalog.episodes.map((episode) => ({
          episodeId: episode.id,
          unlockedDate: "2025-01-01",
          isRead: episode.id !== unreadEpisode.id,
        })),
        storyCatalog,
      ),
    ).toBe(unreadEpisode);
    expect(
      getLatestUnreadEpisode(
        storyCatalog.episodes.map((episode) => ({
          episodeId: episode.id,
          unlockedDate: "2025-01-01",
          isRead: true,
        })),
        storyCatalog,
      ),
    ).toBeUndefined();
  });
});

describe("completion rules", () => {
  const finishedAt = new Date(2025, 0, 2, 12, 0, 0, 123).getTime();
  const completeFixtureTimer = (
    state: AppState,
    finishedAt: number,
    diary = "",
  ) => completeTimer(state, finishedAt, storyCatalog, diary);

  it("rewards actual whole seconds and unlocks one story", () => {
    const outcome = completeFixtureTimer(
      stateWithTimer({
        sessionId: "session",
        plannedSeconds: 60,
        startedTaskName: "読書",
        accumulatedMs: 0,
        runningSince: finishedAt - 61_234,
      }),
      finishedAt,
      "  集中できた  ",
    );

    expect(outcome.status).toBe("completed");
    expect(outcome.earnedNt).toBe(61);
    expect(outcome.unlockedEpisode).toBe(branchingEpisodeId);
    expect(outcome.state.unlockedStories).toEqual([
      {
        episodeId: branchingEpisodeId,
        unlockedDate: localDateKey(finishedAt),
        isRead: false,
      },
    ]);
    expect(outcome.state.activeTimer).toBeNull();
    expect(outcome.state.totalNt).toBe(68);
    expect(outcome.state.totalCompletions).toBe(3);
    expect(outcome.state.lastCompletionDate).toBe(localDateKey(finishedAt));
    expect(outcome.state.diaryLogs).toEqual([
      {
        id: "session",
        completedAt: finishedAt,
        completedDate: localDateKey(finishedAt),
        completedTime: "12:00",
        totalTimerSeconds: 61,
        diary: "集中できた",
        unlockedEpisodeId: branchingEpisodeId,
      },
    ]);
  });

  it("does not reward cancellation or an early finish", () => {
    const state = stateWithTimer({
      sessionId: "session",
      plannedSeconds: 60,
      startedTaskName: "読書",
      accumulatedMs: 0,
      runningSince: finishedAt,
    });
    const early = completeFixtureTimer(state, finishedAt + 59_999);
    expect(early.status).toBe("not-ready");
    expect(early.state).toBe(state);

    const cancelled = cancelTimer(state, finishedAt + 30_000);
    expect(cancelled.cancelled).toBe(true);
    expect(cancelled.state.activeTimer).toBeNull();
    expect(cancelled.state.totalNt).toBe(state.totalNt);
    expect(cancelled.state.totalCompletions).toBe(state.totalCompletions);
    expect(cancelled.state.unlockedStories).toEqual([]);
  });

  it("prevents duplicate completion and unlocks at most once per local day", () => {
    const firstState = completeFixtureTimer(
      stateWithTimer({
        sessionId: "first",
        plannedSeconds: 0,
        startedTaskName: "読書",
        accumulatedMs: 0,
        runningSince: finishedAt,
      }),
      finishedAt,
    ).state;
    expect(completeFixtureTimer(firstState, finishedAt + 1).status).toBe(
      "no-active-timer",
    );

    const secondState = completeFixtureTimer(
      {
        ...firstState,
        activeTimer: {
          sessionId: "second",
          plannedSeconds: 0,
          startedTaskName: "読書",
          accumulatedMs: 0,
          runningSince: finishedAt,
        },
      },
      finishedAt + 10_000,
    );
    expect(secondState.status).toBe("completed");
    expect(secondState.unlockedEpisode).toBeNull();
    expect(secondState.state.unlockedStories).toHaveLength(1);
  });

  it("unlocks on the next date and continues rewards after all stories", () => {
    const dayOne = localDateKey(finishedAt);
    const dayTwo = localDateKey(finishedAt + 24 * 60 * 60 * 1000);
    const finalEpisode =
      storyCatalog.episodes[storyCatalog.episodes.length - 1];
    const state: AppState = {
      ...stateWithTimer({
        sessionId: "session",
        plannedSeconds: 0,
        startedTaskName: "読書",
        accumulatedMs: 0,
        runningSince: finishedAt,
      }),
      lastCompletionDate: dayOne,
      unlockedStories: storyCatalog.episodes
        .slice(0, -1)
        .map((episode) => ({
          episodeId: episode.id,
          unlockedDate: dayOne,
          isRead: true,
        })),
    };
    const third = completeFixtureTimer(
      state,
      finishedAt + 24 * 60 * 60 * 1000,
    );
    expect(third.state.lastCompletionDate).toBe(dayTwo);
    expect(third.unlockedEpisode).toBe(finalEpisode.id);

    const allStoriesState: AppState = {
      ...third.state,
      activeTimer: {
        sessionId: "fourth",
        plannedSeconds: 0,
        startedTaskName: "読書",
        accumulatedMs: 0,
        runningSince: finishedAt,
      },
    };
    const fourth = completeFixtureTimer(
      allStoriesState,
      finishedAt + 2 * 24 * 60 * 60 * 1000,
    );
    expect(fourth.status).toBe("completed");
    expect(fourth.unlockedEpisode).toBeNull();
    expect(fourth.state.totalCompletions).toBe(
      allStoriesState.totalCompletions + 1,
    );
    expect(fourth.state.totalNt).toBeGreaterThan(allStoriesState.totalNt);
  });
});

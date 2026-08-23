import { localDateKey } from "./date";
import { cancelTimer, completeTimer } from "./completion";
import { formatDuration, getTimerSnapshot } from "./timer";
import { AppState, ActiveTimer } from "./types";

function stateWithTimer(timer: ActiveTimer): AppState {
  return {
    schemaVersion: 1,
    userName: "",
    taskName: "読書",
    totalNt: 7,
    totalCompletions: 2,
    lastCompletionDate: null,
    unlockedStories: [],
    activeTimer: timer,
  };
}

describe("timer calculations", () => {
  const timer: ActiveTimer = {
    sessionId: "session",
    startedAt: 1_000,
    plannedSeconds: 60,
    startedTaskName: "読書",
  };

  it("handles zero elapsed, exact deadline, remaining, and overtime", () => {
    expect(getTimerSnapshot(timer, 1_000)).toMatchObject({
      elapsedSeconds: 0,
      remainingSeconds: 60,
      overtimeSeconds: 0,
      isComplete: false,
      earnedNt: 0,
    });
    expect(getTimerSnapshot(timer, 30_999)).toMatchObject({
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

  it("floors NT and formats hours beyond 59 minutes", () => {
    const longTimer = { ...timer, plannedSeconds: 3_600 };
    expect(getTimerSnapshot(longTimer, 1_000 + 3_599_999).earnedNt).toBe(3599);
    expect(formatDuration(3_599)).toBe("00:59:59");
    expect(formatDuration(3_600)).toBe("01:00:00");
    expect(formatDuration(86_101)).toBe("23:55:01");
  });
});

describe("completion rules", () => {
  const finishedAt = new Date(2025, 0, 2, 12, 0, 0, 123).getTime();

  it("rewards actual whole seconds and unlocks one story", () => {
    const outcome = completeTimer(
      stateWithTimer({
        sessionId: "session",
        startedAt: finishedAt - 61_234,
        plannedSeconds: 60,
        startedTaskName: "読書",
      }),
      finishedAt,
    );

    expect(outcome.status).toBe("completed");
    expect(outcome.earnedNt).toBe(61);
    expect(outcome.unlockedEpisode).toBe(1);
    expect(outcome.state.activeTimer).toBeNull();
    expect(outcome.state.totalNt).toBe(68);
    expect(outcome.state.totalCompletions).toBe(3);
    expect(outcome.state.lastCompletionDate).toBe(localDateKey(finishedAt));
  });

  it("does not reward cancellation or an early finish", () => {
    const state = stateWithTimer({
      sessionId: "session",
      startedAt: finishedAt,
      plannedSeconds: 60,
      startedTaskName: "読書",
    });
    const early = completeTimer(state, finishedAt + 59_999);
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
    const firstState = completeTimer(
      stateWithTimer({
        sessionId: "first",
        startedAt: finishedAt,
        plannedSeconds: 0,
        startedTaskName: "読書",
      }),
      finishedAt,
    ).state;
    expect(completeTimer(firstState, finishedAt + 1).status).toBe("no-active-timer");

    const secondState = completeTimer(
      {
        ...firstState,
        activeTimer: {
          sessionId: "second",
          startedAt: finishedAt,
          plannedSeconds: 0,
          startedTaskName: "読書",
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
    const state: AppState = {
      ...stateWithTimer({
        sessionId: "session",
        startedAt: finishedAt,
        plannedSeconds: 0,
        startedTaskName: "読書",
      }),
      lastCompletionDate: dayOne,
      unlockedStories: [
        { episodeId: 1, unlockedDate: dayOne },
        { episodeId: 2, unlockedDate: dayOne },
      ],
    };
    const third = completeTimer(state, finishedAt + 24 * 60 * 60 * 1000);
    expect(third.state.lastCompletionDate).toBe(dayTwo);
    expect(third.unlockedEpisode).toBe(3);

    const allStoriesState: AppState = {
      ...third.state,
      activeTimer: {
        sessionId: "fourth",
        startedAt: finishedAt,
        plannedSeconds: 0,
        startedTaskName: "読書",
      },
    };
    const fourth = completeTimer(allStoriesState, finishedAt + 2 * 24 * 60 * 60 * 1000);
    expect(fourth.status).toBe("completed");
    expect(fourth.unlockedEpisode).toBeNull();
    expect(fourth.state.totalCompletions).toBe(allStoriesState.totalCompletions + 1);
    expect(fourth.state.totalNt).toBeGreaterThan(allStoriesState.totalNt);
  });
});

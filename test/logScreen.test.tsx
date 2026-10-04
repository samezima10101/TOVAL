import React from "react";
import TestRenderer, { act } from "react-test-renderer";

import CalendarScreen from "@/app/log";
import CustomCalendar from "@/src/components/log/CustomCalendar";
import LogModal from "@/src/components/log/LogModal";
import { useAppState } from "@/src/state/AppStateProvider";
import { createInitialAppState } from "@/src/storage/appStateRepository";

jest.mock("@/src/components/common/BackButton", () => () => null);
jest.mock("@/src/components/log/CustomCalendar", () => () => null);
jest.mock("@/src/components/log/LogModal", () => () => null);
jest.mock("@/src/state/AppStateProvider", () => ({ useAppState: jest.fn() }));
jest.mock("@react-native-async-storage/async-storage", () =>
  jest.requireActual("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

it("groups near-midnight logs by their saved date rather than the current timezone", async () => {
  const log = {
    id: "japan-midnight",
    completedAt: Date.UTC(2025, 0, 1, 15, 30),
    completedDate: "2025-01-02",
    totalTimerSeconds: 60,
    diary: "日本時間の0時30分に完了",
    unlockedEpisodeId: null,
  };
  jest.mocked(useAppState).mockReturnValue({
    state: { ...createInitialAppState(), diaryLogs: [log] },
  } as ReturnType<typeof useAppState>);
  let renderer!: TestRenderer.ReactTestRenderer;
  try {
    await act(async () => { renderer = TestRenderer.create(<CalendarScreen />); });
    const calendar = renderer.root.findByType(CustomCalendar);
    expect(calendar.props.recordedDates).toEqual(new Set(["2025-01-02"]));
    await act(async () => { calendar.props.onDayPress("2025-01-02"); });
    const modal = renderer.root.findByType(LogModal);
    expect(modal.props.selectedDate).toBe("2025-01-02");
    expect(modal.props.logsByDate).toEqual({ "2025-01-02": [log] });
  } finally {
    await act(async () => { renderer?.unmount(); });
  }
});

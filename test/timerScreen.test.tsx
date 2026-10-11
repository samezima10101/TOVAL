import mockAsyncStorage from "@react-native-async-storage/async-storage/jest/async-storage-mock";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  AppState as NativeAppState,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import TestRenderer, { act } from "react-test-renderer";

import TimerScreen from "@/app/timer";
import PrimaryButton from "@/src/components/common/PrimaryButton";
import DiaryModal from "@/src/components/timer/DiaryModal";
import { AppState } from "@/src/domain/common/types";
import { AppStateProvider, useAppState } from "@/src/state/AppStateProvider";
import { createInitialAppState } from "@/src/storage/appStateRepository";

jest.mock("@react-native-async-storage/async-storage", () => mockAsyncStorage);
jest.mock("expo-router", () => ({
  router: { replace: jest.fn() },
  useFocusEffect: (effect: () => void | (() => void)) => {
    jest.requireActual<typeof React>("react").useEffect(effect, [effect]);
  },
}));

function HydratedTimerScreen() {
  const { status } = useAppState();
  return status === "ready" ? <TimerScreen /> : null;
}

describe("タイマー画面の省電力モード", () => {
  let renderer: TestRenderer.ReactTestRenderer;
  const nativeAppState = NativeAppState as unknown as { currentState: string };
  let previousAppState: string;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-01T12:00:00Z"));
    jest.clearAllMocks();
    previousAppState = nativeAppState.currentState;
    nativeAppState.currentState = "active";
  });

  afterEach(async () => {
    if (renderer) await act(async () => renderer.unmount());
    nativeAppState.currentState = previousAppState;
    jest.useRealTimers();
  });

  it.each(["onPress", "onRequestClose", "onAccessibilityEscape"])(
    "ボタンで全画面を黒くし、%sで復帰しても計測・NT・終了処理を維持する",
    async (dismissAction) => {
      const initialState = {
        ...createInitialAppState(),
        totalNt: 17,
        activeTimer: {
          sessionId: "power-saving-test",
          plannedSeconds: 3,
          startedTaskName: "読書",
          accumulatedMs: 0,
          runningSince: null,
        },
      };
      const repository = {
        load: jest.fn(async () => initialState),
        save: jest.fn(async (_state: AppState) => undefined),
      };
      await act(async () => {
        renderer = TestRenderer.create(
          <AppStateProvider repository={repository}>
            <HydratedTimerScreen />
          </AppStateProvider>,
        );
      });
      const savesAfterFocus = repository.save.mock.calls.length;
      expect(savesAfterFocus).toBe(1);
      const runningState = repository.save.mock.calls[0][0];
      expect(runningState.activeTimer?.runningSince).toBe(Date.now());
      expect(renderer.root.findByType(PrimaryButton).props.disabled).toBe(true);

      const enterButton = renderer.root.find(
        (node) =>
          node.type === TouchableOpacity &&
          node.props.accessibilityLabel === "省電力モード",
      );
      expect(enterButton.props.accessibilityRole).toBe("button");
      await act(async () => enterButton.props.onPress());

      const modal = renderer.root.find(
        (node) => node.type === Modal && node.props.presentationStyle === "fullScreen",
      );
      expect(modal.props.visible).toBe(true);
      expect(modal.props.presentationStyle).toBe("fullScreen");
      expect(renderer.root.findByType(StatusBar).props.hidden).toBe(true);
      const blackScreen = renderer.root.find(
        (node) =>
          node.props.accessibilityLabel === "省電力モードを解除" &&
          typeof node.props.onPress === "function",
      );
      // Black-out is required; the exact layout and animation settings are not.
      expect(StyleSheet.flatten(blackScreen.props.style)).toMatchObject({
        backgroundColor: "#000000",
      });
      expect(blackScreen.findAllByType(Text)).toHaveLength(0);
      expect(blackScreen.props.accessibilityRole).toBe("button");
      expect(blackScreen.props.accessibilityViewIsModal).toBe(true);
      expect(renderer.root.findByType(SafeAreaView).props).toMatchObject({
        accessibilityElementsHidden: true,
        importantForAccessibility: "no-hide-descendants",
      });

      await act(async () => jest.advanceTimersByTime(5_000));
      expect(repository.save).toHaveBeenCalledTimes(savesAfterFocus);
      expect(router.replace).not.toHaveBeenCalled();
      expect(renderer.root.findByType(PrimaryButton).props.disabled).toBe(false);

      await act(async () => {
        if (dismissAction === "onRequestClose") modal.props.onRequestClose();
        else blackScreen.props[dismissAction]();
      });
      expect(modal.props.visible).toBe(false);
      expect(renderer.root.findAllByType(StatusBar)).toHaveLength(0);
      expect(renderer.root.findByType(SafeAreaView).props).toMatchObject({
        accessibilityElementsHidden: false,
        importantForAccessibility: "auto",
      });
      expect(repository.save).toHaveBeenCalledTimes(savesAfterFocus);
      expect(router.replace).not.toHaveBeenCalled();

      await act(async () => {
        await renderer.root.findByType(PrimaryButton).props.onPress();
      });
      expect(renderer.root.findByType(DiaryModal).props.visible).toBe(true);
      await act(async () => {
        await renderer.root.findByType(DiaryModal).props.onSave("省電力後の日記");
      });
      expect(repository.save).toHaveBeenLastCalledWith(
        expect.objectContaining({
          activeTimer: null,
          totalNt: 22,
          totalCompletions: 1,
          diaryLogs: [expect.objectContaining({ diary: "省電力後の日記", totalTimerSeconds: 5 })],
        }),
      );
      expect(router.replace).toHaveBeenCalledWith({
        pathname: "/story",
        params: { episode: "1", source: "unlock" },
      });
    },
  );
});

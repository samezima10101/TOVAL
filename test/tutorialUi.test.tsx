import mockAsyncStorage from "@react-native-async-storage/async-storage/jest/async-storage-mock";
import React from "react";
import { TextInput, TouchableOpacity } from "react-native";
import TestRenderer, { act } from "react-test-renderer";
import { router, useGlobalSearchParams, usePathname } from "expo-router";

import HomeScreen from "@/app/index";
import TimerScreen from "@/app/timer";
import PrimaryButton from "@/src/components/common/PrimaryButton";
import TimerSetupModal from "@/src/components/home/TimerSetupModal";
import DiaryModal from "@/src/components/timer/DiaryModal";
import TutorialNavigation from "@/src/components/tutorial/TutorialNavigation";
import TutorialStory from "@/src/components/tutorial/TutorialStory";
import { useAppState } from "@/src/state/AppStateProvider";
import { createInitialAppState } from "@/src/storage/appStateRepository";

jest.mock("@react-native-async-storage/async-storage", () => mockAsyncStorage);
jest.mock("expo-router", () => ({
  router: { replace: jest.fn(), push: jest.fn() },
  usePathname: jest.fn(), useGlobalSearchParams: jest.fn(),
  useFocusEffect: (effect: () => void | (() => void)) => { jest.requireActual<typeof React>("react").useEffect(effect, [effect]); },
}));
jest.mock("@/src/state/AppStateProvider", () => ({ useAppState: jest.fn() }));
jest.mock("@/src/components/story/StoryCharacters", () => () => null);

describe("tutorial UI", () => {
  let renderer: TestRenderer.ReactTestRenderer;
  const mockedContext = useAppState as jest.MockedFunction<typeof useAppState>;
  const makeContext = () => ({
    state: createInitialAppState(), status: "ready" as const, hydrationError: null,
    retryHydration: jest.fn(async () => undefined), setTaskName: jest.fn(async () => undefined),
    setTutorialProfile: jest.fn(async () => undefined), advanceTutorial: jest.fn(async () => undefined),
    markStoryRead: jest.fn(async () => undefined), selectInitialStoryRoute: jest.fn(async () => undefined),
    unlockAdditionalStoryRoute: jest.fn(async () => undefined), unlockSideStory: jest.fn(async () => undefined),
    announceSideStories: jest.fn(async () => undefined),
    startTimer: jest.fn(), setTimerRouteFocused: jest.fn(async () => undefined),
    cancelTimer: jest.fn(async () => true), finishTimer: jest.fn(),
  });
  const mount = async (element: React.ReactElement) => { await act(async () => { renderer = TestRenderer.create(element); }); };
  beforeEach(() => { jest.clearAllMocks(); jest.useFakeTimers(); });
  afterEach(async () => { if (renderer) await act(async () => renderer.unmount()); jest.useRealTimers(); });

  it("restores episode and source parameters even when already on /story", async () => {
    const context = makeContext(); context.state.tutorialStep = "episode";
    mockedContext.mockReturnValue(context);
    (usePathname as jest.Mock).mockReturnValue("/story");
    (useGlobalSearchParams as jest.Mock).mockReturnValue({});
    await mount(<TutorialNavigation />);
    expect(router.replace).toHaveBeenCalledWith({ pathname: "/story", params: { episode: "1", source: "home" } });
  });

  it("requests profile midway through the separate tutorial story", async () => {
    const context = makeContext(); mockedContext.mockReturnValue(context);
    await mount(<TutorialStory />);
    const dialogue = () => renderer.root.findByType(TouchableOpacity);
    await act(async () => dialogue().props.onPress()); // reveal welcome
    await act(async () => dialogue().props.onPress()); // next line
    await act(async () => dialogue().props.onPress()); // reveal profile prompt
    const inputs = renderer.root.findAllByType(TextInput);
    expect(inputs).toHaveLength(2);
    await act(async () => { inputs[0].props.onChangeText("June"); inputs[1].props.onChangeText("読書"); });
    await act(async () => renderer.root.findByType(PrimaryButton).props.onPress());
    expect(context.setTutorialProfile).toHaveBeenCalledWith("June", "読書");
    expect(context.markStoryRead).not.toHaveBeenCalled();
    expect(context.advanceTutorial).not.toHaveBeenCalled();
  });

  it("blocks home navigation and the timer until the explanation is acknowledged", async () => {
    const context = makeContext(); context.state.tutorialStep = "navigation"; context.state.taskName = "読書";
    mockedContext.mockReturnValue(context); await mount(<HomeScreen />);
    for (const label of ["メモリーを開く", "ログを開く", "ショップを開く"]) {
      expect(renderer.root.find((node) => node.type === TouchableOpacity && node.props.accessibilityLabel === label).props.disabled).toBe(true);
    }
    expect(renderer.root.findAllByType(PrimaryButton).find((node) => node.props.title === "集中モードを開始")?.props.disabled).toBe(true);
    await act(async () => renderer.root.findAllByType(PrimaryButton).find((node) => node.props.title === "次へ")?.props.onPress());
    expect(context.advanceTutorial).toHaveBeenCalledTimes(1);
  });

  it.each([0, 5, 25, 90])("lets the tutorial start with a freely selected duration of %i minutes", async (minutes) => {
    const onStart = jest.fn(async () => undefined);
    await mount(<TimerSetupModal visible initialMinutes={minutes} tutorial hasActiveTimer={false} onClose={() => undefined} onResume={() => undefined} onStart={onStart} />);
    const button = (label: string) => renderer.root.find((node) => node.type === TouchableOpacity && node.props.accessibilityLabel === label);
    expect(button("設定した時間でタイマーを開始").props.disabled).toBe(false);
    await act(async () => button("5分増やす").props.onPress());
    await act(async () => button("設定した時間でタイマーを開始").props.onPress());
    expect(onStart).toHaveBeenCalledWith((minutes + 5) * 60);
  });

  it("explains power saving before diary and returns home rather than auto-playing the unlocked story", async () => {
    const context = makeContext(); context.state.tutorialStep = "timer";
    context.state.activeTimer = { sessionId: "test", plannedSeconds: 0, accumulatedMs: 0, runningSince: null, startedTaskName: "読書" };
    context.finishTimer.mockResolvedValue({ status: "completed", state: { ...context.state, tutorialStep: "talk", activeTimer: null }, earnedNt: 0, unlockedEpisode: 1 });
    mockedContext.mockReturnValue(context); await mount(<TimerScreen />);
    const finish = () => renderer.root.findAllByType(PrimaryButton).find((node) => node.props.title === "終了して記録")!;
    expect(finish().props.disabled).toBe(true);
    await act(async () => renderer.root.findAllByType(PrimaryButton).find((node) => node.props.title === "次へ")?.props.onPress());
    expect(finish().props.disabled).toBe(false);
    await act(async () => finish().props.onPress());
    const diary = renderer.root.findByType(DiaryModal);
    expect(diary.props).toMatchObject({ visible: true, tutorial: true });
    await act(async () => diary.props.onSave("感想"));
    expect(context.finishTimer).toHaveBeenCalledWith(expect.any(Number), "感想");
    expect(router.replace).toHaveBeenLastCalledWith("/");
  });

  it("advances to episode 1 only after the home bubble is pressed", async () => {
    const context = makeContext(); context.state.tutorialStep = "talk";
    context.state.unlockedStories = [{ episodeId: 1, unlockedDate: "2026-01-01", isRead: false }];
    mockedContext.mockReturnValue(context); await mount(<HomeScreen />);
    expect(context.advanceTutorial).not.toHaveBeenCalled();
    const bubble = renderer.root.find((node) => node.type === TouchableOpacity && node.props.accessibilityLabel === "初めてのタスク完了！を読む");
    expect(bubble.props.disabled).toBe(false);
    await act(async () => bubble.props.onPress());
    expect(context.advanceTutorial).toHaveBeenCalledTimes(1);
  });
});

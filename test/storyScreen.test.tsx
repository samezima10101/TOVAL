import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import TestRenderer, { act } from "react-test-renderer";

import StoryScreen from "@/app/story";
import {
  APP_SCHEMA_VERSION,
  AppState,
  EpisodeId,
} from "@/src/domain/common/types";
import { useAppState } from "@/src/state/AppStateProvider";
import { router, useLocalSearchParams } from "expo-router";

jest.mock("expo-router", () => ({
  router: {
    dismissTo: jest.fn(),
    replace: jest.fn(),
  },
  useLocalSearchParams: jest.fn(),
}));

jest.mock("@/src/components/story/StoryCharacters", () => {
  const ReactModule = require("react");
  const { View } = require("react-native");
  return () =>
    ReactModule.createElement(View, { accessibilityLabel: "キャラクター表示" });
});
jest.mock("@/src/state/AppStateProvider", () => ({
  useAppState: jest.fn(),
}));

type AppStateContext = ReturnType<typeof useAppState>;

const mockedUseAppState = useAppState as jest.MockedFunction<
  typeof useAppState
>;
const mockedUseLocalSearchParams = useLocalSearchParams as jest.MockedFunction<
  typeof useLocalSearchParams
>;

function makeState(): AppState {
  return {
    schemaVersion: APP_SCHEMA_VERSION,
    userName: "",
    taskName: "読書",
    totalNt: 0,
    totalCompletions: 1,
    lastCompletionDate: "2025-01-01",
    unlockedStories: [
      { episodeId: 1, unlockedDate: "2025-01-01", isRead: false },
    ],
    storyRouteProgress: {},
    activeTimer: null,
  };
}

function makeContext(
  markStoryRead: (episodeId: EpisodeId) => Promise<void>,
  state: AppState = makeState(),
  selectInitialStoryRoute: (
    episodeId: EpisodeId,
    routeId: string,
  ) => Promise<void> = async () => undefined,
  unlockAdditionalStoryRoute: (
    episodeId: EpisodeId,
    routeId: string,
  ) => Promise<void> = async () => undefined,
): AppStateContext {
  return {
    state,
    status: "ready",
    hydrationError: null,
    retryHydration: async () => undefined,
    setTaskName: async () => undefined,
    markStoryRead,
    selectInitialStoryRoute,
    unlockAdditionalStoryRoute,
    startTimer: async () => {
      throw new Error("not used");
    },
    setTimerRouteFocused: async () => undefined,
    cancelTimer: async () => false,
    finishTimer: async () => {
      throw new Error("not used");
    },
  };
}

function getMessageButton(renderer: TestRenderer.ReactTestRenderer) {
  return renderer.root.findAllByType(TouchableOpacity)[1];
}

async function advanceToFinalLine(renderer: TestRenderer.ReactTestRenderer) {
  await act(async () => {
    getMessageButton(renderer).props.onPress();
  });
  await act(async () => {
    getMessageButton(renderer).props.onPress();
  });
}

describe("StoryScreen read completion", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseLocalSearchParams.mockReturnValue({
      episode: "1",
      source: "home",
    });
  });

  it("marks the episode read only after the final line and navigates once", async () => {
    mockedUseLocalSearchParams.mockReturnValue({
      episode: "2",
      source: "home",
    });
    const markStoryRead = jest.fn(async (_episodeId: EpisodeId) => undefined);
    mockedUseAppState.mockReturnValue(
      makeContext(markStoryRead, {
        ...makeState(),
        unlockedStories: [
          { episodeId: 2, unlockedDate: "2025-01-01", isRead: false },
        ],
      }),
    );
    let renderer!: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(<StoryScreen />);
    });
    await advanceToFinalLine(renderer);

    await act(async () => {
      getMessageButton(renderer).props.onPress();
      getMessageButton(renderer).props.onPress();
      await Promise.resolve();
    });

    expect(markStoryRead).toHaveBeenCalledTimes(1);
    expect(markStoryRead).toHaveBeenCalledWith(2);
    expect(router.replace).toHaveBeenCalledWith("/");
    expect(router.dismissTo).not.toHaveBeenCalled();
    await act(async () => {
      renderer.unmount();
    });
  });

  it("shows choices after the common opening and continues on the selected route", async () => {
    const selectInitialStoryRoute = jest.fn(
      async (_episodeId: EpisodeId, _routeId: string) => undefined,
    );
    mockedUseLocalSearchParams.mockReturnValue({
      episode: "1",
      source: "home",
    });
    mockedUseAppState.mockReturnValue(
      makeContext(
        jest.fn(async (_episodeId: EpisodeId) => undefined),
        {
          ...makeState(),
          unlockedStories: [
            { episodeId: 1, unlockedDate: "2025-01-01", isRead: false },
          ],
        },
        selectInitialStoryRoute,
      ),
    );
    let renderer!: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(<StoryScreen />);
    });
    await act(async () => {
      getMessageButton(renderer).props.onPress();
      getMessageButton(renderer).props.onPress();
    });

    const choice = renderer.root.find(
      (node) =>
        node.type === TouchableOpacity &&
        node.props.accessibilityLabel === "ありがとうございます！",
    );
    await act(async () => {
      choice.props.onPress();
    });

    expect(
      renderer.root.findAll(
        (node) =>
          node.type === View &&
          node.props.accessibilityLabel === "キャラクター表示",
      ).length,
    ).toBeGreaterThan(0);
    expect(selectInitialStoryRoute).toHaveBeenCalledWith(
      1,
      "episode-01-encourage",
    );
    expect(
      renderer.root.findAll(
        (node) =>
          node.type === Text &&
          node.props.children === "ありがとうございます！",
      ),
    ).toHaveLength(1);

    await act(async () => {
      getMessageButton(renderer).props.onPress();
    });
    expect(
      renderer.root.findAll(
        (node) =>
          node.type === Text &&
          node.props.children === "・・・では失礼します。",
      ),
    ).toHaveLength(1);
    await act(async () => {
      renderer.unmount();
    });
  });

  it("resumes the saved initial route from the home entry", async () => {
    const selectInitialStoryRoute = jest.fn(
      async (_episodeId: EpisodeId, _routeId: string) => undefined,
    );
    mockedUseLocalSearchParams.mockReturnValue({
      episode: "1",
      source: "home",
    });
    mockedUseAppState.mockReturnValue(
      makeContext(
        jest.fn(async (_episodeId: EpisodeId) => undefined),
        {
          ...makeState(),
          unlockedStories: [
            { episodeId: 1, unlockedDate: "2025-01-01", isRead: false },
          ],
          storyRouteProgress: {
            1: {
              firstSelectedRouteId: "episode-01-encourage",
              extraUnlockedRouteIds: [],
            },
          },
        },
        selectInitialStoryRoute,
      ),
    );
    let renderer!: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(<StoryScreen />);
    });
    await act(async () => {
      getMessageButton(renderer).props.onPress();
      getMessageButton(renderer).props.onPress();
    });

    expect(selectInitialStoryRoute).not.toHaveBeenCalled();
    expect(
      renderer.root.findAll(
        (node) =>
          node.type === Text &&
          node.props.children === "ありがとうございます！",
      ),
    ).toHaveLength(1);
    expect(
      renderer.root.findAll(
        (node) => node.props.accessibilityLabel === "ありがとうございます！",
      ),
    ).toHaveLength(0);
    await act(async () => {
      renderer.unmount();
    });
  });

  it("shows inline unlock confirmation, supports back, and does not auto-play after purchase", async () => {
    const unlockAdditionalStoryRoute = jest.fn(
      async (_episodeId: EpisodeId, _routeId: string) => undefined,
    );
    mockedUseLocalSearchParams.mockReturnValue({
      episode: "1",
      source: "memory",
    });
    mockedUseAppState.mockReturnValue(
      makeContext(
        jest.fn(async () => undefined),
        {
          ...makeState(),
          totalNt: 120,
          storyRouteProgress: {
            1: {
              firstSelectedRouteId: "episode-01-encourage",
              extraUnlockedRouteIds: [],
            },
          },
        },
        async () => undefined,
        unlockAdditionalStoryRoute,
      ),
    );
    let renderer!: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(<StoryScreen />);
    });
    await act(async () => {
      getMessageButton(renderer).props.onPress();
      getMessageButton(renderer).props.onPress();
    });

    const lockedChoice = () =>
      renderer.root.find(
        (node) =>
          node.type === TouchableOpacity &&
          node.props.accessibilityLabel ===
            "はい、わかりました。、鍵付き、60 NTで解放",
      );
    await act(async () => lockedChoice().props.onPress());

    expect(
      renderer.root.findAll(
        (node) =>
          node.type === View &&
          node.props.accessibilityLabel === "キャラクター表示",
      ),
    ).toHaveLength(1);
    expect(
      renderer.root.findAll(
        (node) =>
          node.type === Text &&
          node.props.children === "選択肢を解放しますか？",
      ),
    ).toHaveLength(1);
    expect(
      renderer.root.findAll(
        (node) =>
          node.type === TouchableOpacity &&
          node.props.accessibilityLabel === "60 NTで解放する",
      ),
    ).toHaveLength(1);

    const back = renderer.root.find(
      (node) =>
        node.type === TouchableOpacity &&
        node.props.accessibilityLabel === "戻る",
    );
    await act(async () => back.props.onPress());
    expect(lockedChoice()).toBeDefined();

    await act(async () => lockedChoice().props.onPress());
    const confirm = renderer.root.find(
      (node) =>
        node.type === TouchableOpacity &&
        node.props.accessibilityLabel === "60 NTで解放する",
    );
    await act(async () => {
      confirm.props.onPress();
      await Promise.resolve();
    });

    expect(unlockAdditionalStoryRoute).toHaveBeenCalledWith(
      1,
      "episode-01-bow",
    );
    expect(
      renderer.root.findAll(
        (node) => node.props.accessibilityLabel === "次のセリフへ進む",
      ),
    ).toHaveLength(0);
    expect(lockedChoice()).toBeDefined();
    await act(async () => renderer.unmount());
  });

  it("explains insufficient NT inline", async () => {
    mockedUseLocalSearchParams.mockReturnValue({
      episode: "1",
      source: "memory",
    });
    mockedUseAppState.mockReturnValue(
      makeContext(
        jest.fn(async () => undefined),
        {
          ...makeState(),
          totalNt: 0,
          storyRouteProgress: {
            1: {
              firstSelectedRouteId: "episode-01-encourage",
              extraUnlockedRouteIds: [],
            },
          },
        },
      ),
    );
    let renderer!: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(<StoryScreen />);
    });
    await act(async () => {
      getMessageButton(renderer).props.onPress();
      getMessageButton(renderer).props.onPress();
    });
    const lockedChoice = renderer.root.find(
      (node) =>
        node.type === TouchableOpacity &&
        node.props.accessibilityLabel ===
          "はい、わかりました。、鍵付き、60 NTで解放",
    );
    await act(async () => lockedChoice.props.onPress());

    expect(
      renderer.root.findAll(
        (node) =>
          node.type === Text && node.props.children === "NTが不足しています",
      ),
    ).toHaveLength(1);
    expect(
      renderer.root.findAll(
        (node) =>
          node.type === TouchableOpacity &&
          node.props.accessibilityLabel === "選択肢に戻る",
      ),
    ).toHaveLength(1);
    expect(
      renderer.root.findAll(
        (node) =>
          node.type === TouchableOpacity &&
          node.props.accessibilityLabel === "60 NTで解放する",
      ),
    ).toHaveLength(0);
    await act(async () => renderer.unmount());
  });

  it("reports an unlock persistence failure inline and allows retry", async () => {
    const unlockAdditionalStoryRoute = jest
      .fn()
      .mockRejectedValueOnce(new Error("解放を保存できませんでした"))
      .mockResolvedValueOnce(undefined);
    mockedUseLocalSearchParams.mockReturnValue({
      episode: "1",
      source: "memory",
    });
    mockedUseAppState.mockReturnValue(
      makeContext(
        jest.fn(async () => undefined),
        {
          ...makeState(),
          totalNt: 120,
          storyRouteProgress: {
            1: {
              firstSelectedRouteId: "episode-01-encourage",
              extraUnlockedRouteIds: [],
            },
          },
        },
        async () => undefined,
        unlockAdditionalStoryRoute,
      ),
    );
    let renderer!: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(<StoryScreen />);
    });
    await act(async () => {
      getMessageButton(renderer).props.onPress();
      getMessageButton(renderer).props.onPress();
    });
    const lockedChoice = renderer.root.find(
      (node) =>
        node.type === TouchableOpacity &&
        node.props.accessibilityLabel ===
          "はい、わかりました。、鍵付き、60 NTで解放",
    );
    await act(async () => lockedChoice.props.onPress());
    const confirm = () =>
      renderer.root.find(
        (node) =>
          node.type === TouchableOpacity &&
          node.props.accessibilityLabel === "60 NTで解放する",
      );

    await act(async () => {
      confirm().props.onPress();
      await Promise.resolve();
    });
    expect(
      renderer.root.findAll(
        (node) =>
          node.type === Text &&
          node.props.children === "解放を保存できませんでした",
      ),
    ).toHaveLength(1);

    await act(async () => {
      confirm().props.onPress();
      await Promise.resolve();
    });
    expect(unlockAdditionalStoryRoute).toHaveBeenCalledTimes(2);
    expect(
      renderer.root.findAll(
        (node) =>
          node.type === TouchableOpacity &&
          node.props.accessibilityLabel ===
            "はい、わかりました。、鍵付き、60 NTで解放",
      ),
    ).toHaveLength(1);
    await act(async () => renderer.unmount());
  });

  it("keeps the story open and reports a persistence failure", async () => {
    mockedUseLocalSearchParams.mockReturnValue({
      episode: "2",
      source: "home",
    });
    const markStoryRead = jest.fn(async (_episodeId: EpisodeId) => {
      throw new Error("保存できませんでした");
    });
    mockedUseAppState.mockReturnValue(
      makeContext(markStoryRead, {
        ...makeState(),
        unlockedStories: [
          { episodeId: 2, unlockedDate: "2025-01-01", isRead: false },
        ],
      }),
    );
    let renderer!: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(<StoryScreen />);
    });
    await advanceToFinalLine(renderer);

    await act(async () => {
      getMessageButton(renderer).props.onPress();
      await Promise.resolve();
    });

    expect(markStoryRead).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
    expect(
      renderer.root.findAll(
        (node) =>
          node.type === Text && node.props.children === "保存できませんでした",
      ),
    ).toHaveLength(1);
    expect(getMessageButton(renderer).props.accessibilityState).toEqual({
      disabled: false,
    });
    await act(async () => {
      renderer.unmount();
    });
  });
});

import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import TestRenderer, { act } from "react-test-renderer";

import StoryScreen from "@/app/story";
import SideStoryScreen from "@/app/side-story";
import {
  APP_SCHEMA_VERSION,
  AppState,
  EpisodeId,
} from "@/src/domain/common/types";
import { useAppState } from "@/src/state/AppStateProvider";
import { router, useLocalSearchParams } from "expo-router";
import {
  branchingEpisodeId,
  branchingStory,
  linearStory,
  primaryRoute,
  secondaryRoute,
  storyCatalog,
} from "./fixtures/story";

jest.mock("@/src/content/shop", () => jest.requireActual("./fixtures/shop"));

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
const branchingEpisodeParam = String(branchingEpisodeId);
const linearEpisodeParam = String(linearStory.id);
const lockedSecondaryChoiceLabel = `${secondaryRoute.label}、鍵付き、60 NTで解放`;

function makeState(): AppState {
  return {
    schemaVersion: APP_SCHEMA_VERSION,
    userName: "",
    taskName: "読書",
    totalNt: 0,
    totalCompletions: 1,
    lastCompletionDate: "2025-01-01",
    unlockedStories: [
      {
        episodeId: branchingEpisodeId,
        unlockedDate: "2025-01-01",
        isRead: false,
      },
    ],
    storyRouteProgress: {},
    purchasedSideStoryIds: [],
    announcedSideStoryIds: [],
    diaryLogs: [],
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
    setTutorialProfile: async () => undefined,
    advanceTutorial: async () => undefined,
    markStoryRead,
    selectInitialStoryRoute,
    unlockAdditionalStoryRoute,
    unlockSideStory: async () => undefined,
    announceSideStories: async () => undefined,
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
  return renderer.root.find(
    (node) =>
      node.type === TouchableOpacity &&
      (node.props.accessibilityLabel === "次のセリフへ進む" ||
        node.props.accessibilityLabel === "ストーリーを読み終える"),
  );
}

async function finishTyping(renderer: TestRenderer.ReactTestRenderer) {
  await act(async () => {
    jest.runAllTimers();
  });
}

async function advanceLines(
  renderer: TestRenderer.ReactTestRenderer,
  count: number,
) {
  for (let index = 0; index < count; index += 1) {
    await finishTyping(renderer);
    await act(async () => {
      getMessageButton(renderer).props.onPress();
    });
  }
}

async function advanceToFinalLine(
  renderer: TestRenderer.ReactTestRenderer,
  lineCount: number,
) {
  await advanceLines(renderer, lineCount - 1);
}

describe("side story access", () => {
  it("plays the selected purchased conversation and refuses unknown or unpurchased IDs", async () => {
    jest.useFakeTimers();
    mockedUseAppState.mockReturnValue(makeContext(async () => undefined, { ...makeState(), purchasedSideStoryIds: [102] }));
    for (const id of ["102", "103", "999", "garbage"]) {
      mockedUseLocalSearchParams.mockReturnValue({ conversation: id });
      let renderer!: TestRenderer.ReactTestRenderer;
      await act(async () => { renderer = TestRenderer.create(<SideStoryScreen />); });
      expect(renderer.root.findAllByType(TouchableOpacity).some((node) => node.props.accessibilityLabel === "セリフを全文表示")).toBe(id === "102");
      await act(async () => renderer.unmount());
    }
  });

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });
  afterEach(() => jest.useRealTimers());

  it("hides dialogue until purchased and returns to the shop after reading", async () => {
    mockedUseLocalSearchParams.mockReturnValue({});
    mockedUseAppState.mockReturnValue(makeContext(async () => undefined));
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<SideStoryScreen />);
    });
    expect(renderer.root.findAllByType(TouchableOpacity).some((node) => node.props.accessibilityLabel === "次のセリフへ進む")).toBe(false);
    await act(async () => renderer.unmount());

    mockedUseAppState.mockReturnValue(makeContext(async () => undefined, { ...makeState(), purchasedSideStoryIds: [101] }));
    await act(async () => {
      renderer = TestRenderer.create(<SideStoryScreen />);
    });
    expect(renderer.root.findAllByType(TouchableOpacity).some((node) => node.props.accessibilityLabel === "セリフを全文表示")).toBe(true);
    await advanceToFinalLine(renderer, 4);
    await finishTyping(renderer);
    await act(async () => {
      getMessageButton(renderer).props.onPress();
      await Promise.resolve();
    });
    expect(router.dismissTo).toHaveBeenCalledWith("/shop");
    await act(async () => renderer.unmount());
  });
});

describe("StoryScreen read completion", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockedUseLocalSearchParams.mockReturnValue({
      episode: branchingEpisodeParam,
      source: "home",
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("marks the episode read only after the final line and navigates once", async () => {
    mockedUseLocalSearchParams.mockReturnValue({
      episode: linearEpisodeParam,
      source: "home",
    });
    const markStoryRead = jest.fn(async (_episodeId: EpisodeId) => undefined);
    mockedUseAppState.mockReturnValue(
      makeContext(markStoryRead, {
        ...makeState(),
        unlockedStories: [
          {
            episodeId: linearStory.id,
            unlockedDate: "2025-01-01",
            isRead: false,
          },
        ],
      }),
    );
    let renderer!: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(<StoryScreen catalog={storyCatalog} />);
    });
    await advanceToFinalLine(
      renderer,
      linearStory.commonBefore.length + linearStory.commonAfter.length,
    );
    await finishTyping(renderer);

    await act(async () => {
      getMessageButton(renderer).props.onPress();
      getMessageButton(renderer).props.onPress();
      await Promise.resolve();
    });

    expect(markStoryRead).toHaveBeenCalledTimes(1);
    expect(markStoryRead).toHaveBeenCalledWith(linearStory.id);
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
      episode: branchingEpisodeParam,
      source: "home",
    });
    mockedUseAppState.mockReturnValue(
      makeContext(
        jest.fn(async (_episodeId: EpisodeId) => undefined),
        {
          ...makeState(),
          unlockedStories: [
            {
              episodeId: branchingEpisodeId,
              unlockedDate: "2025-01-01",
              isRead: false,
            },
          ],
        },
        selectInitialStoryRoute,
      ),
    );
    let renderer!: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(<StoryScreen catalog={storyCatalog} />);
    });
    await advanceLines(renderer, branchingStory.commonBefore.length);

    const choice = renderer.root.find(
      (node) =>
        node.type === TouchableOpacity &&
        node.props.accessibilityLabel === primaryRoute.label,
    );
    await act(async () => {
      choice.props.onPress();
    });
    await finishTyping(renderer);

    expect(
      renderer.root.findAll(
        (node) =>
          node.type === View &&
          node.props.accessibilityLabel === "キャラクター表示",
      ).length,
    ).toBeGreaterThan(0);
    expect(selectInitialStoryRoute).toHaveBeenCalledWith(
      branchingEpisodeId,
      primaryRoute.id,
    );
    expect(
      renderer.root.findAll(
        (node) =>
          node.type === Text &&
          node.props.children === primaryRoute.lines[0].text,
      ),
    ).toHaveLength(1);

    mockedUseAppState.mockReturnValue(
      makeContext(
        jest.fn(async (_episodeId: EpisodeId) => undefined),
        {
          ...makeState(),
          unlockedStories: [
            {
              episodeId: branchingEpisodeId,
              unlockedDate: "2025-01-01",
              isRead: false,
            },
          ],
          storyRouteProgress: {
            [branchingEpisodeId]: {
              firstSelectedRouteId: primaryRoute.id,
              extraUnlockedRouteIds: [],
            },
          },
        },
        selectInitialStoryRoute,
      ),
    );
    await act(async () => {
      renderer.update(<StoryScreen catalog={storyCatalog} />);
    });
    await finishTyping(renderer);
    expect(
      renderer.root.findAll(
        (node) =>
          node.type === Text &&
          node.props.children === primaryRoute.lines[0].text,
      ),
    ).toHaveLength(1);

    await act(async () => {
      getMessageButton(renderer).props.onPress();
    });
    await finishTyping(renderer);
    expect(
      renderer.root.findAll(
        (node) =>
          node.type === Text &&
          node.props.children === primaryRoute.lines[1].text,
      ),
    ).toHaveLength(1);

    await advanceLines(
      renderer,
      primaryRoute.lines.length + branchingStory.commonAfter.length - 2,
    );
    await finishTyping(renderer);
    expect(
      renderer.root.findAll(
        (node) =>
          node.type === Text &&
          node.props.children === branchingStory.commonAfter[0].text,
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
      episode: branchingEpisodeParam,
      source: "home",
    });
    mockedUseAppState.mockReturnValue(
      makeContext(
        jest.fn(async (_episodeId: EpisodeId) => undefined),
        {
          ...makeState(),
          unlockedStories: [
            {
              episodeId: branchingEpisodeId,
              unlockedDate: "2025-01-01",
              isRead: false,
            },
          ],
          storyRouteProgress: {
            [branchingEpisodeId]: {
              firstSelectedRouteId: primaryRoute.id,
              extraUnlockedRouteIds: [],
            },
          },
        },
        selectInitialStoryRoute,
      ),
    );
    let renderer!: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(<StoryScreen catalog={storyCatalog} />);
    });
    await advanceLines(renderer, branchingStory.commonBefore.length);
    await finishTyping(renderer);

    expect(selectInitialStoryRoute).not.toHaveBeenCalled();
    expect(
      renderer.root.findAll(
        (node) =>
          node.type === Text &&
          node.props.children === primaryRoute.lines[0].text,
      ),
    ).toHaveLength(1);
    expect(
      renderer.root.findAll(
        (node) => node.props.accessibilityLabel === primaryRoute.label,
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
      episode: branchingEpisodeParam,
      source: "memory",
    });
    mockedUseAppState.mockReturnValue(
      makeContext(
        jest.fn(async () => undefined),
        {
          ...makeState(),
          totalNt: 120,
          storyRouteProgress: {
            [branchingEpisodeId]: {
              firstSelectedRouteId: primaryRoute.id,
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
      renderer = TestRenderer.create(<StoryScreen catalog={storyCatalog} />);
    });
    await advanceLines(renderer, branchingStory.commonBefore.length);

    const lockedChoice = () =>
      renderer.root.find(
        (node) =>
          node.type === TouchableOpacity &&
          node.props.accessibilityLabel === lockedSecondaryChoiceLabel,
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
      branchingEpisodeId,
      secondaryRoute.id,
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
      episode: branchingEpisodeParam,
      source: "memory",
    });
    mockedUseAppState.mockReturnValue(
      makeContext(
        jest.fn(async () => undefined),
        {
          ...makeState(),
          totalNt: 0,
          storyRouteProgress: {
            [branchingEpisodeId]: {
              firstSelectedRouteId: primaryRoute.id,
              extraUnlockedRouteIds: [],
            },
          },
        },
      ),
    );
    let renderer!: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(<StoryScreen catalog={storyCatalog} />);
    });
    await advanceLines(renderer, branchingStory.commonBefore.length);
    const lockedChoice = renderer.root.find(
      (node) =>
        node.type === TouchableOpacity &&
        node.props.accessibilityLabel === lockedSecondaryChoiceLabel,
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
      episode: branchingEpisodeParam,
      source: "memory",
    });
    mockedUseAppState.mockReturnValue(
      makeContext(
        jest.fn(async () => undefined),
        {
          ...makeState(),
          totalNt: 120,
          storyRouteProgress: {
            [branchingEpisodeId]: {
              firstSelectedRouteId: primaryRoute.id,
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
      renderer = TestRenderer.create(<StoryScreen catalog={storyCatalog} />);
    });
    await advanceLines(renderer, branchingStory.commonBefore.length);
    const lockedChoice = renderer.root.find(
      (node) =>
        node.type === TouchableOpacity &&
        node.props.accessibilityLabel === lockedSecondaryChoiceLabel,
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
          node.props.accessibilityLabel === lockedSecondaryChoiceLabel,
      ),
    ).toHaveLength(1);
    await act(async () => renderer.unmount());
  });

  it("keeps the story open and reports a persistence failure", async () => {
    mockedUseLocalSearchParams.mockReturnValue({
      episode: linearEpisodeParam,
      source: "home",
    });
    const markStoryRead = jest.fn(async (_episodeId: EpisodeId) => {
      throw new Error("保存できませんでした");
    });
    mockedUseAppState.mockReturnValue(
      makeContext(markStoryRead, {
        ...makeState(),
        unlockedStories: [
          {
            episodeId: linearStory.id,
            unlockedDate: "2025-01-01",
            isRead: false,
          },
        ],
      }),
    );
    let renderer!: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(<StoryScreen catalog={storyCatalog} />);
    });
    await advanceToFinalLine(
      renderer,
      linearStory.commonBefore.length + linearStory.commonAfter.length,
    );
    await finishTyping(renderer);

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

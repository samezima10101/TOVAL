import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import TestRenderer, { act } from "react-test-renderer";

import StoryScreen from "@/app/story";
import StoryChoices from "@/src/components/story/StoryChoices";
import StoryMessageBox from "@/src/components/story/StoryMessageBox";
import StoryUnlockConfirmation from "@/src/components/story/StoryUnlockConfirmation";
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
import { SIDE_STORY } from "./fixtures/shop";

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

function getMessageBox(renderer: TestRenderer.ReactTestRenderer) {
  return renderer.root.findByType(StoryMessageBox);
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
      getMessageBox(renderer).props.onNext();
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
      expect(renderer.root.findAllByType(StoryMessageBox)).toHaveLength(id === "102" ? 1 : 0);
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
    expect(renderer.root.findAllByType(StoryMessageBox)).toHaveLength(0);
    await act(async () => renderer.unmount());

    mockedUseAppState.mockReturnValue(makeContext(async () => undefined, { ...makeState(), purchasedSideStoryIds: [101] }));
    await act(async () => {
      renderer = TestRenderer.create(<SideStoryScreen />);
    });
    expect(renderer.root.findAllByType(StoryMessageBox)).toHaveLength(1);
    await advanceToFinalLine(renderer, SIDE_STORY.commonBefore.length + SIDE_STORY.commonAfter.length);
    await finishTyping(renderer);
    await act(async () => {
      getMessageBox(renderer).props.onNext();
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
      getMessageBox(renderer).props.onNext();
      getMessageBox(renderer).props.onNext();
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

    await act(async () => {
      renderer.root.findByType(StoryChoices).props.onSelect(primaryRoute.id);
    });
    await finishTyping(renderer);

    expect(selectInitialStoryRoute).toHaveBeenCalledWith(
      branchingEpisodeId,
      primaryRoute.id,
    );
    expect(getMessageBox(renderer).props.fullText).toBe(primaryRoute.lines[0].text);

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
    expect(getMessageBox(renderer).props.fullText).toBe(primaryRoute.lines[0].text);

    await act(async () => {
      getMessageBox(renderer).props.onNext();
    });
    await finishTyping(renderer);
    expect(getMessageBox(renderer).props.fullText).toBe(primaryRoute.lines[1].text);

    await advanceLines(
      renderer,
      primaryRoute.lines.length + branchingStory.commonAfter.length - 2,
    );
    await finishTyping(renderer);
    expect(getMessageBox(renderer).props.fullText).toBe(branchingStory.commonAfter[0].text);
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
    expect(getMessageBox(renderer).props.fullText).toBe(primaryRoute.lines[0].text);
    expect(renderer.root.findAllByType(StoryChoices)).toHaveLength(0);
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

    const chooseLockedRoute = () =>
      renderer.root.findByType(StoryChoices).props.onSelect(secondaryRoute.id);
    await act(async () => chooseLockedRoute());

    const confirmation = renderer.root.findByType(StoryUnlockConfirmation);
    expect(confirmation.props.routeLabel).toBe(secondaryRoute.label);
    expect(confirmation.props.totalNt).toBe(120);

    await act(async () => confirmation.props.onBack());
    expect(renderer.root.findByType(StoryChoices).props.lockedRouteIds).toContain(secondaryRoute.id);

    await act(async () => chooseLockedRoute());
    await act(async () => {
      renderer.root.findByType(StoryUnlockConfirmation).props.onConfirm();
      await Promise.resolve();
    });

    expect(unlockAdditionalStoryRoute).toHaveBeenCalledWith(
      branchingEpisodeId,
      secondaryRoute.id,
    );
    expect(renderer.root.findAllByType(StoryMessageBox)).toHaveLength(0);
    expect(renderer.root.findByType(StoryChoices).props.lockedRouteIds).toContain(secondaryRoute.id);
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
    await act(async () => {
      renderer.root.findByType(StoryChoices).props.onSelect(secondaryRoute.id);
    });

    const confirmation = renderer.root.findByType(StoryUnlockConfirmation);
    expect(confirmation.props.totalNt).toBe(0);
    expect(confirmation.props.routeLabel).toBe(secondaryRoute.label);
    // Insufficient funds must not expose an enabled purchase action.
    expect(confirmation.findAllByType(TouchableOpacity).filter((node) => !node.props.disabled))
      .toHaveLength(1);
    await act(async () => confirmation.props.onBack());
    expect(renderer.root.findByType(StoryChoices)).toBeDefined();
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
    await act(async () => {
      renderer.root.findByType(StoryChoices).props.onSelect(secondaryRoute.id);
    });
    const confirm = () => renderer.root.findByType(StoryUnlockConfirmation);

    await act(async () => {
      confirm().props.onConfirm();
      await Promise.resolve();
    });
    expect(confirm().props.error).toBe("解放を保存できませんでした");

    await act(async () => {
      confirm().props.onConfirm();
      await Promise.resolve();
    });
    expect(unlockAdditionalStoryRoute).toHaveBeenCalledTimes(2);
    expect(renderer.root.findByType(StoryChoices).props.lockedRouteIds).toContain(secondaryRoute.id);
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
      getMessageBox(renderer).props.onNext();
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
    expect(getMessageBox(renderer).props.isProcessing).toBe(false);
    await act(async () => {
      renderer.unmount();
    });
  });
});

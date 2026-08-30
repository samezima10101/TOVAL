import React from "react";
import { Text, TouchableOpacity } from "react-native";
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

jest.mock("@/components/StoryCharacters", () => () => null);
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
    activeTimer: null,
  };
}

function makeContext(
  markStoryRead: (episodeId: EpisodeId) => Promise<void>,
): AppStateContext {
  return {
    state: makeState(),
    status: "ready",
    hydrationError: null,
    retryHydration: async () => undefined,
    setTaskName: async () => undefined,
    markStoryRead,
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
    const markStoryRead = jest.fn(async (_episodeId: EpisodeId) => undefined);
    mockedUseAppState.mockReturnValue(makeContext(markStoryRead));
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
    expect(markStoryRead).toHaveBeenCalledWith(1);
    expect(router.replace).toHaveBeenCalledWith("/");
    expect(router.dismissTo).not.toHaveBeenCalled();
    await act(async () => {
      renderer.unmount();
    });
  });

  it("keeps the story open and reports a persistence failure", async () => {
    const markStoryRead = jest.fn(async (_episodeId: EpisodeId) => {
      throw new Error("保存できませんでした");
    });
    mockedUseAppState.mockReturnValue(makeContext(markStoryRead));
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

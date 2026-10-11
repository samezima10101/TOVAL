import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { router } from "expo-router";

import ShopScreen from "@/app/shop";
import StoryListHeader from "@/src/components/common/StoryListHeader";
import StoryListCard from "@/src/components/common/StoryListCard";
import StoryMessageBox from "@/src/components/story/StoryMessageBox";
import { SIDE_STORY, SHOP_FAREWELL, SHOP_GREETING_WITH_ARRIVALS } from "./fixtures/shop";
import { listAvailableConversations } from "@/src/domain/sideStory";
import { useAppState } from "@/src/state/AppStateProvider";
import { createInitialAppState } from "@/src/storage/appStateRepository";

let mockPreventRemove: boolean;
let mockOnBack: () => void;
jest.mock("expo-router/react-navigation", () => ({
  usePreventRemove: (prevent: boolean, onBack: () => void) => { mockPreventRemove = prevent; mockOnBack = onBack; },
}));
jest.mock("expo-router", () => ({ router: { dismissTo: jest.fn(), push: jest.fn() } }));
jest.mock("@expo/vector-icons/Ionicons", () => () => null);
jest.mock("@/src/state/AppStateProvider", () => ({ useAppState: jest.fn() }));
jest.mock("@/src/content/shop", () => jest.requireActual("./fixtures/shop"));
jest.mock("@react-native-async-storage/async-storage", () => require("@react-native-async-storage/async-storage/jest/async-storage-mock"));

const mockedUseAppState = jest.mocked(useAppState);
const state = () => ({ ...createInitialAppState(), totalNt: 180 });

async function advanceDialogue(renderer: TestRenderer.ReactTestRenderer, lineCount: number) {
  for (let index = 0; index < lineCount; index += 1) {
    await act(async () => { jest.runAllTimers(); });
    await act(async () => renderer.root.findByType(StoryMessageBox).props.onNext());
  }
}
beforeEach(() => { jest.useFakeTimers(); jest.clearAllMocks(); });
afterEach(() => jest.useRealTimers());

it("adds multiple conversations on story read completion, not on dates or unlock alone", () => {
  const initial = state();
  expect(listAvailableConversations(initial).map((item) => item.id)).toEqual([101]);
  const unlocked = { ...initial, unlockedStories: [{ episodeId: 2, unlockedDate: "2026-01-01", isRead: false }] };
  expect(listAvailableConversations(unlocked).map((item) => item.id)).toEqual([101]);
  expect(listAvailableConversations({ ...unlocked, unlockedStories: [{ ...unlocked.unlockedStories[0], isRead: true }] }).map((item) => item.id)).toEqual([101, 102, 103]);
});

it("returns home when the header home button is pressed during farewell", async () => {
  mockedUseAppState.mockReturnValue({ state: state() } as unknown as ReturnType<typeof useAppState>);
  let renderer!: TestRenderer.ReactTestRenderer;
  await act(async () => { renderer = TestRenderer.create(<ShopScreen />); });
  try {
    await act(async () => { renderer.root.findByType(StoryListHeader).props.onBack(); });
    expect(router.dismissTo).not.toHaveBeenCalled();
    await act(async () => { renderer.root.findByType(StoryListHeader).props.onBack(); });
    expect(mockPreventRemove).toBe(false);
    expect(router.dismissTo).toHaveBeenCalledTimes(1);
    expect(router.dismissTo).toHaveBeenCalledWith("/");
  } finally {
    await act(async () => renderer.unmount());
  }
});

it("greets, announces arrivals, requests playback and says farewell before returning home", async () => {
  const announce = jest.fn(async () => undefined);
  mockedUseAppState.mockReturnValue({
    state: { ...state(), purchasedSideStoryIds: [101] },
    announceSideStories: announce,
  } as unknown as ReturnType<typeof useAppState>);
  let renderer!: TestRenderer.ReactTestRenderer;
  await act(async () => { renderer = TestRenderer.create(<ShopScreen />); });
  expect(mockPreventRemove).toBe(true);
  const openingLength = SHOP_GREETING_WITH_ARRIVALS.commonBefore.length + SHOP_GREETING_WITH_ARRIVALS.commonAfter.length;
  // Announcement belongs to the completed greeting, not an exact number of lines.
  expect(announce).not.toHaveBeenCalled();
  await advanceDialogue(renderer, openingLength);
  expect(announce).toHaveBeenCalledWith([101]);
  const storyCard = renderer.root.findAllByType(StoryListCard)
    .find((card) => card.props.title === SIDE_STORY.title);
  expect(storyCard).toBeDefined();
  await act(async () => storyCard!.props.onPress());
  expect(router.push).toHaveBeenCalledWith({ pathname: "/side-story", params: { conversation: "101" } });
  await act(async () => { mockOnBack(); });
  expect(router.dismissTo).not.toHaveBeenCalled();
  await advanceDialogue(renderer, SHOP_FAREWELL.commonBefore.length + SHOP_FAREWELL.commonAfter.length);
  expect(mockPreventRemove).toBe(false);
  expect(router.dismissTo).toHaveBeenCalledWith("/");
  await act(async () => renderer.unmount());
});

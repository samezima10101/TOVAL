import React from "react";
import { TouchableOpacity } from "react-native";
import TestRenderer, { act } from "react-test-renderer";
import { router } from "expo-router";

import ShopScreen from "@/app/shop";
import { SIDE_STORY } from "./fixtures/shop";
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

function button(renderer: TestRenderer.ReactTestRenderer, label: string) {
  return renderer.root.find((node) => node.type === TouchableOpacity && node.props.accessibilityLabel === label);
}
async function next(renderer: TestRenderer.ReactTestRenderer) {
  await act(async () => { jest.runAllTimers(); });
  await act(async () => {
    const message = renderer.root.find((node) => node.type === TouchableOpacity &&
      ["次のセリフへ進む", "ストーリーを読み終える"].includes(node.props.accessibilityLabel));
    await message.props.onPress();
  });
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

it("greets, announces arrivals, requests playback and says farewell before returning home", async () => {
  const announce = jest.fn(async () => undefined);
  mockedUseAppState.mockReturnValue({
    state: { ...state(), purchasedSideStoryIds: [101] },
    announceSideStories: announce,
  } as unknown as ReturnType<typeof useAppState>);
  let renderer!: TestRenderer.ReactTestRenderer;
  await act(async () => { renderer = TestRenderer.create(<ShopScreen />); });
  expect(mockPreventRemove).toBe(true);
  await next(renderer);
  expect(announce).not.toHaveBeenCalled();
  await next(renderer);
  expect(announce).toHaveBeenCalledWith([101]);
  await act(async () => { button(renderer, `${SIDE_STORY.title}を再生`).props.onPress(); });
  expect(router.push).toHaveBeenCalledWith({ pathname: "/side-story", params: { conversation: "101" } });
  await act(async () => { mockOnBack(); });
  expect(router.dismissTo).not.toHaveBeenCalled();
  await next(renderer);
  expect(mockPreventRemove).toBe(false);
  expect(router.dismissTo).toHaveBeenCalledWith("/");
  await act(async () => renderer.unmount());
});

import React from "react";
import { Alert, Text, TouchableOpacity } from "react-native";
import TestRenderer, { act } from "react-test-renderer";
import { router } from "expo-router";

import ShopScreen from "@/app/shop";
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
function context(overrides: Partial<ReturnType<typeof useAppState>> = {}) {
  mockedUseAppState.mockReturnValue({ state: state(), unlockSideStory: jest.fn(async () => undefined),
    announceSideStories: jest.fn(async () => undefined), ...overrides } as ReturnType<typeof useAppState>);
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

it("greets, announces new arrivals, plays from the list and says farewell before returning home", async () => {
  const announce = jest.fn(async () => undefined);
  context({ state: { ...state(), purchasedSideStoryIds: [101] }, announceSideStories: announce });
  let renderer!: TestRenderer.ReactTestRenderer;
  await act(async () => { renderer = TestRenderer.create(<ShopScreen />); });
  expect(mockPreventRemove).toBe(true);
  await next(renderer);
  expect(announce).not.toHaveBeenCalled();
  await next(renderer);
  expect(announce).toHaveBeenCalledWith([101]);
  await act(async () => { button(renderer, "雨宿りの帰り道を再生").props.onPress(); });
  expect(router.push).toHaveBeenCalledWith({ pathname: "/side-story", params: { conversation: "101" } });
  expect(button(renderer, "雨宿りの帰り道を再生")).toBeDefined();
  await act(async () => { mockOnBack(); });
  expect(router.dismissTo).not.toHaveBeenCalled();
  await next(renderer);
  expect(mockPreventRemove).toBe(false);
  expect(router.dismissTo).toHaveBeenCalledWith("/");
  await act(async () => renderer.unmount());
});

it("keeps the greeting open if notification saving fails and retries without losing arrivals", async () => {
  const announce = jest.fn().mockRejectedValueOnce(new Error("保存失敗")).mockResolvedValueOnce(undefined);
  context({ announceSideStories: announce });
  let renderer!: TestRenderer.ReactTestRenderer;
  await act(async () => { renderer = TestRenderer.create(<ShopScreen />); });
  await next(renderer);
  await next(renderer);
  expect(renderer.root.findAllByType(Text).some((node) => node.props.children === "保存失敗")).toBe(true);
  await next(renderer);
  expect(announce).toHaveBeenCalledTimes(2);
  expect(button(renderer, "雨宿りの帰り道を60 NTで解放")).toBeDefined();
  await act(async () => renderer.unmount());
});

it("skips repeat announcements and purchases only after confirmation", async () => {
  const purchase = jest.fn(async () => undefined);
  const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
  context({ state: { ...state(), announcedSideStoryIds: [101] }, unlockSideStory: purchase });
  let renderer!: TestRenderer.ReactTestRenderer;
  await act(async () => { renderer = TestRenderer.create(<ShopScreen />); });
  await next(renderer);
  await act(async () => button(renderer, "雨宿りの帰り道を60 NTで解放").props.onPress());
  expect(purchase).not.toHaveBeenCalled();
  await act(async () => { alert.mock.calls[0][2]?.[1].onPress?.(); });
  expect(purchase).toHaveBeenCalledWith(101);
  expect(router.push).not.toHaveBeenCalled();
  await act(async () => renderer.unmount());
  alert.mockRestore();
});

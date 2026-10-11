import React from "react";
import { TouchableOpacity } from "react-native";
import TestRenderer, { act } from "react-test-renderer";

import HomeStoryCard from "@/src/components/home/HomeStoryCard";
import { linearStory } from "./fixtures/story";

jest.mock("@/src/components/story/StoryCharacters", () => () => null);
jest.mock("@expo/vector-icons/Ionicons", () => () => null);

const episode = linearStory;

describe("HomeStoryCard", () => {
  it("does not offer unread-story navigation when all unlocked stories are read", async () => {
    const onOpenTalk = jest.fn();
    const onOpenShop = jest.fn();
    let renderer!: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(
        <HomeStoryCard
          latestUnlockedEpisode={episode}
          onOpenTalk={onOpenTalk}
          onOpenShop={onOpenShop}
        />,
      );
    });

    const actions = renderer.root.findAllByType(TouchableOpacity);
    expect(actions.some((node) => node.props.onPress === onOpenTalk)).toBe(false);
    const shop = actions.find((node) => node.props.onPress === onOpenShop);
    expect(shop).toBeDefined();
    await act(async () => shop!.props.onPress());
    expect(onOpenShop).toHaveBeenCalledTimes(1);
    expect(onOpenTalk).not.toHaveBeenCalled();

    await act(async () => renderer.unmount());
  });
});

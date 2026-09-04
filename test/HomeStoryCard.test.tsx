import React from "react";
import { Text, TouchableOpacity } from "react-native";
import TestRenderer, { act } from "react-test-renderer";

import HomeStoryCard from "@/src/components/home/HomeStoryCard";
import { linearStory } from "./fixtures/story";

jest.mock("@/src/components/story/StoryCharacters", () => () => null);
jest.mock("@expo/vector-icons/Ionicons", () => () => null);

const episode = linearStory;

function getTextChildren(renderer: TestRenderer.ReactTestRenderer): string[] {
  return renderer.root
    .findAllByType(Text)
    .map((node) => node.props.children)
    .filter((child): child is string => typeof child === "string");
}

describe("HomeStoryCard", () => {
  it("uses non-action copy when all unlocked stories are already read", async () => {
    let renderer!: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(
        <HomeStoryCard
          latestUnlockedEpisode={episode}
          onOpenTalk={jest.fn()}
          onOpenShop={jest.fn()}
        />,
      );
    });

    const textChildren = getTextChildren(renderer);
    expect(textChildren).toContain("今日も一緒に集中");
    expect(textChildren).not.toContain("会話を読み返す");
    expect(renderer.root.findAllByType(TouchableOpacity)).toHaveLength(1);

    await act(async () => {
      renderer.unmount();
    });
  });
});

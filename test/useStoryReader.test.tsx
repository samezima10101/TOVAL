import React from "react";
import { Text, TouchableOpacity } from "react-native";
import TestRenderer, { act } from "react-test-renderer";

import type { StoryEpisode } from "@/src/domain/common/types";
import useStoryReader, {
  STORY_CHARACTER_INTERVAL_MS,
} from "@/src/hooks/useStoryReader";
import { linearStory } from "./fixtures/story";

jest.mock("expo-router", () => ({
  router: {
    dismissTo: jest.fn(),
    replace: jest.fn(),
  },
}));

function ReaderHarness({
  episode = linearStory,
  onRender,
}: {
  episode?: StoryEpisode;
  onRender?: (snapshot: {
    lineId: string | undefined;
    visibleText: string;
  }) => void;
}) {
  const reader = useStoryReader(episode, "home", jest.fn(async () => undefined));
  onRender?.({ lineId: reader.line?.id, visibleText: reader.visibleText });
  return (
    <>
      <Text>{reader.visibleText}</Text>
      <Text>{reader.isTyping ? "typing" : "complete"}</Text>
      <TouchableOpacity accessibilityLabel="advance" onPress={reader.handleNext} />
    </>
  );
}

describe("useStoryReader typewriter", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("reveals one character at a time and the first tap only completes the line", async () => {
    let renderer!: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(<ReaderHarness />);
    });
    expect(renderer.root.findAllByType(Text)[0].props.children).toBe("");

    await act(async () => {
      jest.advanceTimersByTime(STORY_CHARACTER_INTERVAL_MS);
    });
    expect(renderer.root.findAllByType(Text)[0].props.children).toBe("l");
    expect(renderer.root.findAllByType(Text)[1].props.children).toBe("typing");

    await act(async () => {
      renderer.root.findByProps({ accessibilityLabel: "advance" }).props.onPress();
    });
    expect(renderer.root.findAllByType(Text)[0].props.children).toBe(
      linearStory.commonBefore[0].text,
    );
    expect(renderer.root.findAllByType(Text)[1].props.children).toBe("complete");

    await act(async () => {
      renderer.root.findByProps({ accessibilityLabel: "advance" }).props.onPress();
    });
    expect(renderer.root.findAllByType(Text)[0].props.children).toBe("");
    expect(renderer.root.findAllByType(Text)[1].props.children).toBe("typing");

    await act(async () => {
      renderer.unmount();
    });
  });

  it("starts the next line empty after a fully revealed longer line", async () => {
    const storyWithLongOpening: StoryEpisode = {
      ...linearStory,
      commonBefore: [
        {
          ...linearStory.commonBefore[0],
          text: "This is a much longer first line.",
        },
      ],
      commonAfter: [
        {
          ...linearStory.commonAfter[0],
          text: "Next line.",
        },
      ],
    };
    const snapshots: Array<{
      lineId: string | undefined;
      visibleText: string;
    }> = [];
    let renderer!: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(
        <ReaderHarness
          episode={storyWithLongOpening}
          onRender={(snapshot) => snapshots.push(snapshot)}
        />,
      );
    });
    await act(async () => {
      jest.runAllTimers();
    });
    expect(renderer.root.findAllByType(Text)[0].props.children).toBe(
      storyWithLongOpening.commonBefore[0].text,
    );

    await act(async () => {
      renderer.root.findByProps({ accessibilityLabel: "advance" }).props.onPress();
    });

    const nextLineSnapshots = snapshots.filter(
      (snapshot) => snapshot.lineId === storyWithLongOpening.commonAfter[0].id,
    );
    expect(nextLineSnapshots.length).toBeGreaterThan(0);
    expect(nextLineSnapshots.every((snapshot) => snapshot.visibleText === "")).toBe(
      true,
    );

    await act(async () => {
      renderer.unmount();
    });
  });

  it("cleans up the active timer when the reader unmounts", async () => {
    let renderer!: TestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(<ReaderHarness />);
    });
    const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");
    await act(async () => {
      renderer.unmount();
    });

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });
});

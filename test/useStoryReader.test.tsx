import React from "react";
import { Text, TouchableOpacity } from "react-native";
import TestRenderer, { act } from "react-test-renderer";

import type { StoryEpisode } from "@/src/domain/common/types";
import useStoryReader, {
  STORY_CHARACTER_INTERVAL_MS,
} from "@/src/hooks/useStoryReader";

jest.mock("expo-router", () => ({
  router: {
    dismissTo: jest.fn(),
    replace: jest.fn(),
  },
}));

const episode: StoryEpisode = {
  id: 1,
  title: "テスト",
  lines: [
    {
      row: 1,
      speaker: "sub",
      text: "a🙂b",
      left: "normal",
      right: "talk",
    },
    {
      row: 2,
      speaker: "boss",
      text: "次の行",
      left: "talk",
      right: "normal",
    },
  ],
};

function ReaderHarness() {
  const reader = useStoryReader(episode, "home", jest.fn(async () => undefined));
  return (
    <>
      <Text>{reader.visibleText}</Text>
      <Text>{reader.isTyping ? "typing" : "complete"}</Text>
      <TouchableOpacity
        accessibilityLabel="advance"
        onPress={reader.handleNext}
      />
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

  it("reveals Unicode code points at a fixed interval", async () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<ReaderHarness />);
    });

    expect(renderer.root.findAllByType(Text)[0].props.children).toBe("");
    await act(async () => {
      jest.advanceTimersByTime(STORY_CHARACTER_INTERVAL_MS);
    });
    expect(renderer.root.findAllByType(Text)[0].props.children).toBe("a");
    await act(async () => {
      jest.advanceTimersByTime(STORY_CHARACTER_INTERVAL_MS);
    });
    expect(renderer.root.findAllByType(Text)[0].props.children).toBe("a🙂");

    await act(async () => {
      renderer.unmount();
    });
  });

  it("uses the first tap to finish typing and the next tap to advance", async () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<ReaderHarness />);
      jest.runAllTimers();
    });

    const advance = () =>
      act(async () => {
        renderer.root.findByProps({ accessibilityLabel: "advance" }).props.onPress();
      });

    await advance();
    expect(renderer.root.findAllByType(Text)[0].props.children).toBe("a🙂b");
    expect(renderer.root.findAllByType(Text)[1].props.children).toBe("complete");

    await advance();
    expect(renderer.root.findAllByType(Text)[0].props.children).toBe("");
    expect(renderer.root.findAllByType(Text)[1].props.children).toBe("typing");

    await act(async () => {
      renderer.unmount();
    });
  });

  it("cleans up a pending timer when the reader unmounts", async () => {
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

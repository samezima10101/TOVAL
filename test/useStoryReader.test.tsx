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

const nextEpisode: StoryEpisode = {
  id: 2,
  title: "次のエピソード",
  lines: [
    {
      row: 1,
      speaker: "boss",
      text: "新しい先頭行",
      left: "talk",
      right: "normal",
    },
  ],
};

function ReaderHarness({ episode: currentEpisode = episode }: { episode?: StoryEpisode }) {
  const reader = useStoryReader(
    currentEpisode,
    "home",
    jest.fn(async () => undefined),
  );
  return (
    <>
      <Text>{reader.visibleText}</Text>
      <Text>{reader.isTyping ? "typing" : "complete"}</Text>
      <Text accessibilityLabel="line-row">{reader.line?.row ?? ""}</Text>
      <TouchableOpacity
        accessibilityLabel="advance"
        onPress={reader.handleNext}
      />
    </>
  );
}

function getVisibleText(renderer: TestRenderer.ReactTestRenderer) {
  return renderer.root.findAllByType(Text)[0].props.children;
}

function getStatus(renderer: TestRenderer.ReactTestRenderer) {
  return renderer.root.findAllByType(Text)[1].props.children;
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

  it("starts the next line empty after advancing a fully revealed line", async () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<ReaderHarness />);
    });
    await act(async () => {
      jest.runAllTimers();
    });

    await act(async () => {
      renderer.root.findByProps({ accessibilityLabel: "advance" }).props.onPress();
    });

    expect(renderer.root.findByProps({ accessibilityLabel: "line-row" }).props.children).toBe(2);
    expect(getVisibleText(renderer)).toBe("");
    expect(getStatus(renderer)).toBe("typing");

    await act(async () => {
      renderer.unmount();
    });
  });

  it("does not let the previous line timer reveal text into the next line", async () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<ReaderHarness />);
    });
    await act(async () => {
      jest.advanceTimersByTime(STORY_CHARACTER_INTERVAL_MS);
    });
    expect(getVisibleText(renderer)).toBe("a");

    const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");
    await act(async () => {
      renderer.root.findByProps({ accessibilityLabel: "advance" }).props.onPress();
    });
    await act(async () => {
      renderer.root.findByProps({ accessibilityLabel: "advance" }).props.onPress();
    });
    expect(getVisibleText(renderer)).toBe("");

    await act(async () => {
      jest.advanceTimersByTime(STORY_CHARACTER_INTERVAL_MS);
    });
    expect(getVisibleText(renderer)).toBe("次");
    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();

    await act(async () => {
      renderer.unmount();
    });
  });

  it("resets to the first line without stale text when the episode changes", async () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<ReaderHarness />);
    });
    await act(async () => {
      jest.runAllTimers();
    });
    await act(async () => {
      renderer.root.findByProps({ accessibilityLabel: "advance" }).props.onPress();
    });
    expect(renderer.root.findByProps({ accessibilityLabel: "line-row" }).props.children).toBe(2);

    await act(async () => {
      renderer.update(<ReaderHarness episode={nextEpisode} />);
    });

    expect(renderer.root.findByProps({ accessibilityLabel: "line-row" }).props.children).toBe(1);
    expect(getVisibleText(renderer)).toBe("");
    expect(getStatus(renderer)).toBe("typing");

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

import React from "react";
import TestRenderer, { act } from "react-test-renderer";

import { BGM_TRACKS } from "@/src/constants/bgm";
import type { BgmTrack } from "@/src/constants/bgm";
import useScreenBgm from "@/src/hooks/useScreenBgm";

jest.mock("expo-audio", () => {
  const player = {
    loop: false,
    volume: 0,
    pause: jest.fn(),
    play: jest.fn(),
    replace: jest.fn(),
  };

  return {
    setAudioModeAsync: jest.fn(() => Promise.resolve()),
    useAudioPlayer: jest.fn(() => player),
  };
});

function Harness({ track }: { track: BgmTrack | null }) {
  useScreenBgm(track);
  return null;
}

describe("useScreenBgm", () => {
  it("uses one player and pauses before changing tracks", () => {
    const track = BGM_TRACKS.default;
    const nextTrack: BgmTrack = { source: "next-track", volume: 0.2 };
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(<Harness track={track} />);
    });

    const player =
      jest.requireMock("expo-audio").useAudioPlayer.mock.results[0].value;
    expect(player.replace).toHaveBeenCalledWith(track.source);
    expect(player.play).toHaveBeenCalledTimes(1);

    act(() => {
      renderer.update(<Harness track={nextTrack} />);
    });

    expect(player.pause).toHaveBeenCalledTimes(2);
    expect(player.replace).toHaveBeenLastCalledWith(nextTrack.source);
    expect(player.play).toHaveBeenCalledTimes(2);
    act(() => {
      renderer.unmount();
    });
  });
});

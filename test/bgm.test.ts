import { BGM_TRACKS, SCREEN_BGM, getScreenBgm } from "@/src/constants/bgm";

describe("screen BGM mapping", () => {
  it("assigns a track to every app screen", () => {
    for (const route of Object.keys(SCREEN_BGM)) {
      expect(getScreenBgm(route)).toBe(
        BGM_TRACKS[SCREEN_BGM[route as keyof typeof SCREEN_BGM]],
      );
    }
  });

  it("does not play a track for an unknown route", () => {
    expect(getScreenBgm("/missing")).toBeNull();
  });
});

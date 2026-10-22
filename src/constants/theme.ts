import type { FontSource } from "expo-font";

export const Colors = {
  primary: "#009de0",
  accent: "#a78fb1",
  background: "#F7F9FC",
  surface: "#FFFFFF",
  text: "#050505",
  textSub: "#000000",
  border: "#E2E8F0",
  warning: "#cc4e65",
};

// UI-v3. Each weight has its own registered font; do not add fontWeight to it.
export const Fonts = {
  regular: "ZenKakuGothicNew-Regular",
  medium: "ZenKakuGothicNew-Medium",
  bold: "ZenKakuGothicNew-Bold",
  timer: "BebasNeue-Regular",
  pixel: "DotGothic16-Regular",
} as const;

// Local assets keep first launch and subsequent launches available offline.
export const FONT_ASSETS = {
  [Fonts.regular]: require("@/assets/fonts/ZenKakuGothicNew-Regular.ttf"),
  [Fonts.medium]: require("@/assets/fonts/ZenKakuGothicNew-Medium.ttf"),
  [Fonts.bold]: require("@/assets/fonts/ZenKakuGothicNew-Bold.ttf"),
  [Fonts.timer]: require("@/assets/fonts/BebasNeue-Regular.ttf"),
  [Fonts.pixel]: require("@/assets/fonts/DotGothic16-Regular.ttf"),
} satisfies Record<string, FontSource>;

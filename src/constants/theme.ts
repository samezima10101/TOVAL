/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import type { FontSource } from "expo-font";

export const Colors = {
  primary: "#254aa5",
  accent: "#a78fb1",
  background: "#F7F9FC",
  surface: "#FFFFFF",
  text: "#2D3748",
  textSub: "#718096",
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

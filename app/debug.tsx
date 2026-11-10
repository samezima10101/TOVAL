import { Redirect } from "expo-router";

// Keep the literal condition here so Metro removes the entire debug dependency
// tree from external exports. A direct URL also returns to the menu.
const DebugScreen: import("react").ComponentType | null = (__DEV__ || process.env.EXPO_PUBLIC_APP_ENV === "internal")
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ? require("@/src/debug/DebugScreen").default
  : null;

export default function DebugRoute() {
  return DebugScreen ? <DebugScreen /> : <Redirect href="/menu" />;
}

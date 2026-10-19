import { Stack, usePathname, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

import AppFontLoader from "@/src/components/common/AppFontLoader";
import AppFrame from "@/src/components/common/AppFrame";
import AppStartupGate from "@/src/components/common/AppStartupGate";
import { AUDIO_VOLUMES, getScreenBgm } from "@/src/config/audioSettings";
import useScreenBgm from "@/src/hooks/useScreenBgm";
import { AppStateProvider, useAppState } from "@/src/state/AppStateProvider";

export const unstable_settings = { initialRouteName: "(tabs)" };

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppFontLoader>
        <AppStateProvider>
          <AppShell />
        </AppStateProvider>
      </AppFontLoader>
    </SafeAreaProvider>
  );
}

function AppShell() {
  const pathname = usePathname();
  const segments = useSegments();
  const { state, status } = useAppState();
  const bgm = useScreenBgm(
    status === "ready" && state ? getScreenBgm(pathname) : null,
    status === "ready" && !!state?.bgmEnabled,
    AUDIO_VOLUMES.bgm,
  );

  return (
    <AppStartupGate>
      <AppFrame
        bgmError={bgm.error}
        onRetryBgm={bgm.retry}
        showFooter={segments[0] !== "(tabs)"}
      >
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="timer" options={{ title: "タイマー" }} />
          <Stack.Screen name="story" options={{ title: "ストーリー" }} />
          <Stack.Screen
            name="side-story"
            options={{ title: "サイドストーリー" }}
          />
        </Stack>
      </AppFrame>
    </AppStartupGate>
  );
}

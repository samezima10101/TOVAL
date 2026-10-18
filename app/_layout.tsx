import { Stack, usePathname } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

import AppFontLoader from "@/src/components/common/AppFontLoader";
import AppFrame from "@/src/components/common/AppFrame";
import AppStartupGate from "@/src/components/common/AppStartupGate";
import { AUDIO_VOLUMES, getScreenBgm } from "@/src/config/audioSettings";
import useScreenBgm from "@/src/hooks/useScreenBgm";
import { AppStateProvider, useAppState } from "@/src/state/AppStateProvider";

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
  const { state, status } = useAppState();
  const bgm = useScreenBgm(
    status === "ready" && state ? getScreenBgm(pathname) : null,
    status === "ready" && !!state?.bgmEnabled,
    AUDIO_VOLUMES.bgm,
  );

  return (
    <AppStartupGate>
      <AppFrame bgmError={bgm.error} onRetryBgm={bgm.retry}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ title: "ホーム" }} />
          <Stack.Screen name="memory" options={{ title: "メモリー" }} />
          <Stack.Screen name="timer" options={{ title: "タイマー" }} />
          <Stack.Screen name="story" options={{ title: "ストーリー" }} />
          <Stack.Screen name="log" options={{ title: "ログ" }} />
          <Stack.Screen name="shop" options={{ title: "ショップ" }} />
          <Stack.Screen
            name="side-story"
            options={{ title: "サイドストーリー" }}
          />
        </Stack>
      </AppFrame>
    </AppStartupGate>
  );
}

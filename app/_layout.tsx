import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import AppFontLoader from "@/src/components/common/AppFontLoader";
import AppFrame from "@/src/components/common/AppFrame";
import AppStartupGate from "@/src/components/common/AppStartupGate";
import { getScreenBgm } from "@/src/config/audioSettings";
import useScreenBgm from "@/src/hooks/useScreenBgm";
import { AppStateProvider, useAppState } from "@/src/state/AppStateProvider";
import { ReminderNotificationProvider } from "@/src/state/ReminderNotificationProvider";
import TutorialProvider from "@/src/tutorial/TutorialProvider";

export const unstable_settings = { initialRouteName: "(tabs)" };

// DEBUG_CENTER: release bundles use the ordinary provider directly.
const RootStateProvider: typeof AppStateProvider = (__DEV__ || process.env.EXPO_PUBLIC_APP_ENV === "internal")
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ? require("@/src/debug/DebugAppProvider").default
  : AppStateProvider;

const RootNotificationProvider: typeof ReminderNotificationProvider = (__DEV__ || process.env.EXPO_PUBLIC_APP_ENV === "internal")
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ? require("@/src/debug/DebugReminderProvider").default
  : ReminderNotificationProvider;

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar hidden />
      <AppFontLoader>
        <RootStateProvider>
          <RootNotificationProvider>
            <AppShell />
          </RootNotificationProvider>
        </RootStateProvider>
      </AppFontLoader>
    </SafeAreaProvider>
  );
}

function AppShell() {
  const pathname = usePathname();
  const { state, status, bgmVolume } = useAppState();
  const bgm = useScreenBgm(
    status === "ready" && state ? getScreenBgm(pathname) : null,
    status === "ready" && bgmVolume > 0,
    bgmVolume,
  );

  return (
    <AppStartupGate>
      <TutorialProvider>
        <Stack
          screenOptions={{ headerShown: false }}
          screenLayout={({ children }) => (
            <AppFrame bgmError={bgm.error} onRetryBgm={bgm.retry}>
              {children}
            </AppFrame>
          )}
        />
      </TutorialProvider>
    </AppStartupGate>
  );
}

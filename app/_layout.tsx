import { Stack, usePathname } from "expo-router";
import { getFocusedRouteNameFromRoute } from "expo-router/react-navigation";
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
  const { state, status } = useAppState();
  const bgm = useScreenBgm(
    status === "ready" && state ? getScreenBgm(pathname) : null,
    status === "ready" && !!state?.bgmEnabled,
    AUDIO_VOLUMES.bgm,
  );

  return (
    <AppStartupGate>
      <Stack
        screenOptions={{ headerShown: false }}
        screenLayout={({ children, route }) => {
          const tabName = getFocusedRouteNameFromRoute(route);
          const isShopTab = route.name === "(tabs)" && (
            tabName === undefined ? pathname === "/shop" : tabName === "shop"
          );
          return (
            <AppFrame
              background={route.name === "side-story" || isShopTab ? "shop" : "primary"}
              bgmError={bgm.error}
              onRetryBgm={bgm.retry}
              isMenuOpen={route.name === "menu"}
            >
              {children}
            </AppFrame>
          );
        }}
      />
    </AppStartupGate>
  );
}

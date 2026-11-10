import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, type PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Fonts } from "@/src/constants/theme";
import { AppStateProvider } from "@/src/state/AppStateProvider";
import { createAppStateRepository } from "@/src/storage/appStateRepository";
import { developmentStorage } from "@/src/storage/developmentStorage";
import { DEBUG_STORAGE_KEY, DebugSessionContext } from "./DebugSession";

const sandboxRepository = createAppStateRepository(
  developmentStorage(AsyncStorage, DEBUG_STORAGE_KEY),
  undefined,
  DEBUG_STORAGE_KEY,
);

// Separate provider instances keep queues, timer refs and audio previews isolated.
// A reload always returns to normal data; sandbox data remains for the next visit.
export default function DebugAppProvider({ children }: PropsWithChildren) {
  const [sandbox, setSandbox] = useState(false);
  return (
    <DebugSessionContext.Provider value={{ sandbox, setSandbox }}>
      <AppStateProvider key={sandbox ? "sandbox" : "normal"} repository={sandbox ? sandboxRepository : undefined}>
        <View style={styles.screen}>
          {children}
          {sandbox ? (
            <View style={styles.banner} pointerEvents="none">
              <Text style={styles.label}>TEST DATA · 通常へ戻る操作はメニューのデバッグ画面</Text>
            </View>
          ) : null}
        </View>
      </AppStateProvider>
    </DebugSessionContext.Provider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  banner: { backgroundColor: "#134B45", paddingHorizontal: 12, paddingVertical: 4 },
  label: { color: "#FFFFFF", fontFamily: Fonts.medium, fontSize: 12, textAlign: "center" },
});

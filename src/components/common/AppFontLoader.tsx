import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Colors, FONT_ASSETS } from "@/src/constants/theme";

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function AppFontLoader({ children }: React.PropsWithChildren) {
  const [attempt, setAttempt] = React.useState(0);
  return (
    <FontAttempt key={attempt} onRetry={() => setAttempt((value) => value + 1)}>
      {children}
    </FontAttempt>
  );
}

function FontAttempt({
  children,
  onRetry,
}: React.PropsWithChildren<{ onRetry: () => void }>) {
  const [loaded, error] = useFonts(FONT_ASSETS);

  React.useEffect(() => {
    if (loaded || error) {
      void SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [loaded, error]);

  if (!loaded && !error) return null;

  if (error) {
    // These controls deliberately use the system font so a failed font can be retried.
    return (
      <View style={styles.container}>
        <Text style={styles.message} accessibilityRole="alert">
          フォントを読み込めませんでした。
        </Text>
        <Pressable
          onPress={onRetry}
          style={styles.retry}
          accessibilityRole="button"
        >
          <Text style={styles.retryText}>もう一度読み込む</Text>
        </Pressable>
      </View>
    );
  }

  return children;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
    padding: 24,
    gap: 16,
  },
  message: { color: Colors.text, fontSize: 18, textAlign: "center" },
  retry: { backgroundColor: Colors.primary, borderRadius: 12, padding: 16 },
  retryText: { color: Colors.surface, fontSize: 16 },
});

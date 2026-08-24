import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import PrimaryButton from "@/components/PrimaryButton";
import { Colors } from "@/constants/theme";
import { AppStateProvider, useAppState } from "@/src/state/AppStateProvider";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <AppShell />
      </AppStateProvider>
    </SafeAreaProvider>
  );
}

function AppShell() {
  const pathname = usePathname();
  const { state, status, hydrationError, retryHydration } = useAppState();
  const immersive = pathname === "/timer" || pathname === "/story";

  if (status === "loading") {
    return <StatusMessage message="My-Juneを準備しています…" />;
  }

  if (status === "error" || !state) {
    return (
      <StatusMessage
        message="保存したデータを読み込めませんでした。"
        detail={hydrationError?.message}
        actionLabel="もう一度読み込む"
        onAction={() => void retryHydration()}
      />
    );
  }

  return (
    <View style={styles.rootContainer}>
      <StatusBar style={immersive ? "light" : "dark"} />
      {!immersive ? (
        <SafeAreaView edges={["top"]} style={styles.safeAreaTop}>
          <View style={styles.globalHeader} accessibilityRole="header">
            <Text style={styles.pointText}>{state.totalNt} NT</Text>
            <View
              style={styles.gaugeBackground}
              accessibilityLabel={`${state.totalNt} NT`}
            >
              <View
                style={[
                  styles.gaugeFill,
                  { width: `${Math.min(100, state.totalNt % 100)}%` },
                ]}
              />
            </View>
          </View>
        </SafeAreaView>
      ) : null}
      <View style={styles.screenContainer}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ title: "ホーム" }} />
          <Stack.Screen name="memory" options={{ title: "メモリー" }} />
          <Stack.Screen name="timer" options={{ title: "タイマー" }} />
          <Stack.Screen name="story" options={{ title: "ストーリー" }} />
          <Stack.Screen name="log" options={{ title: "ログ" }} />
        </Stack>
      </View>
      {!immersive ? (
        <SafeAreaView edges={["bottom"]} style={styles.safeAreaBottom}>
          <View style={styles.footer}>
            <Image
              source={require("@/assets/images/icon.png")}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="My-Juneロゴ"
            />
            <Text style={styles.logoText}>My-June</Text>
          </View>
        </SafeAreaView>
      ) : null}
    </View>
  );
}

function StatusMessage({
  message,
  detail,
  actionLabel,
  onAction,
}: {
  message: string;
  detail?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <SafeAreaView style={styles.statusContainer}>
      <Text style={styles.statusTitle}>{message}</Text>
      {detail ? <Text style={styles.statusDetail}>{detail}</Text> : null}
      {actionLabel && onAction ? (
        <PrimaryButton
          title={actionLabel}
          onPress={onAction}
          style={styles.retryButton}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    backgroundColor: Colors.background,
    flex: 1,
  },
  safeAreaTop: {
    backgroundColor: Colors.surface,
  },
  safeAreaBottom: {
    backgroundColor: Colors.surface,
  },
  globalHeader: {
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderBottomColor: Colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  pointText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginRight: 14,
  },
  gaugeBackground: {
    backgroundColor: Colors.border,
    borderRadius: 5,
    flex: 1,
    height: 10,
    overflow: "hidden",
  },
  gaugeFill: {
    backgroundColor: Colors.accent,
    borderRadius: 5,
    height: "100%",
  },
  screenContainer: {
    backgroundColor: Colors.background,
    flex: 1,
  },

  footer: {
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "center",
    minHeight: 48,
    paddingVertical: 6,
  },
  logo: {
    height: 30,
    marginRight: 8,
    width: 30,
  },
  logoText: {
    color: Colors.textSub,
    fontSize: 13,
    fontWeight: "700",
  },
  statusContainer: {
    alignItems: "center",
    backgroundColor: Colors.background,
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  statusTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  statusDetail: {
    color: Colors.textSub,
    fontSize: 13,
    marginTop: 10,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
  },
});

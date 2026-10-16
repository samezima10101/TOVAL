import { Stack, usePathname } from "expo-router";
import React from "react";
import { Alert, Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import PrimaryButton from "@/src/components/common/PrimaryButton";
import { getScreenBgm } from "@/src/constants/bgm";
import { Colors } from "@/src/constants/theme";
import useScreenBgm from "@/src/hooks/useScreenBgm";
import { AppStateProvider, useAppState } from "@/src/state/AppStateProvider";
import { PreservedDataError } from "@/src/storage/appStateRepository";

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
  const { state, status, hydrationError, retryHydration, initializePreservedData,
    timerSaveError, retryTimerSave } = useAppState();
  const [recoveryError, setRecoveryError] = React.useState<string | null>(null);
  const [isRecovering, setIsRecovering] = React.useState(false);
  const retryTimer = () => {
    void retryTimerSave().catch(() => Alert.alert("保存できませんでした", "計測は停止したままです。もう一度再試行してください。"));
  };
  const confirmInitialization = () => Alert.alert(
    "この端末のMy-Juneデータを初期化しますか？",
    "タスク、集中記録・日記、NT残高、会話の解放・購入状態、進行中のタイマーを初期状態に戻します。元データは端末内の別領域に退避しますが、アプリ内で自動復元する機能はありません。退避に失敗した場合は初期化しません。",
    [
      { text: "戻る", style: "cancel" },
      { text: "退避して初期化する", style: "destructive", onPress: () => {
        setIsRecovering(true);
        setRecoveryError(null);
        void initializePreservedData().catch((error: unknown) => {
          setRecoveryError(error instanceof Error ? error.message : "初期化できませんでした。");
        }).finally(() => setIsRecovering(false));
      } },
    ],
  );
  useScreenBgm(status === "ready" && state ? getScreenBgm(pathname) : null);

  if (status === "loading") {
    return <StatusMessage message="My-Juneを準備しています…" />;
  }

  if (status === "error" || !state) {
    return (
      <StatusMessage
        message="保存したデータを読み込めませんでした。"
        detail={recoveryError ?? hydrationError?.message}
        actionLabel="もう一度読み込む"
        onAction={() => { setRecoveryError(null); void retryHydration(); }}
        disabled={isRecovering}
        secondaryLabel={hydrationError instanceof PreservedDataError ? "退避と初期化の内容を確認" : undefined}
        onSecondaryAction={confirmInitialization}
      />
    );
  }

  return (
    <View style={styles.rootContainer}>
      <SafeAreaView edges={["top"]} style={styles.safeAreaTop}>
        <View style={styles.globalHeader} accessibilityRole="header">
          <Text style={styles.pointText}>{state.totalNt} NT</Text>
        </View>
      </SafeAreaView>

      {timerSaveError ? (
        <View style={styles.saveError} accessibilityRole="alert">
          <Text style={styles.statusDetail}>{timerSaveError}</Text>
          <PrimaryButton title="タイマー保存を再試行" onPress={retryTimer} />
        </View>
      ) : null}

      <View style={styles.screenContainer}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ title: "ホーム" }} />
          <Stack.Screen name="memory" options={{ title: "メモリー" }} />
          <Stack.Screen name="timer" options={{ title: "タイマー" }} />
          <Stack.Screen name="story" options={{ title: "ストーリー" }} />
          <Stack.Screen name="log" options={{ title: "ログ" }} />
          <Stack.Screen name="shop" options={{ title: "ショップ" }} />
          <Stack.Screen name="side-story" options={{ title: "サイドストーリー" }} />
        </Stack>
      </View>

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
    </View>
  );
}

function StatusMessage({
  message,
  detail,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondaryAction,
  disabled,
}: {
  message: string;
  detail?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
  disabled?: boolean;
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
          disabled={disabled}
        />
      ) : null}
      {secondaryLabel && onSecondaryAction ? (
        <PrimaryButton title={secondaryLabel} onPress={onSecondaryAction}
          disabled={disabled} style={styles.retryButton} />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  saveError: { backgroundColor: Colors.surface, padding: 12, gap: 8 },
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
    fontSize: 20,
    fontWeight: "700",
    marginRight: 14,
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
    minHeight: 60,
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

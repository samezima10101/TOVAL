import React from "react";
import { Alert, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import PrimaryButton from "@/src/components/common/PrimaryButton";
import { Colors, Fonts } from "@/src/constants/theme";
import { useAppState } from "@/src/state/AppStateProvider";
import { PreservedDataError } from "@/src/storage/appStateRepository";

// Keep recovery state mounted across loading, errors and the ready screen.
export default function AppStartupGate({ children }: React.PropsWithChildren) {
  const { state, status, hydrationError, retryHydration, initializePreservedData } = useAppState();
  const [recoveryError, setRecoveryError] = React.useState<string | null>(null);
  const [isRecovering, setIsRecovering] = React.useState(false);
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

  return children;
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
    fontFamily: Fonts.bold,
    textAlign: "center",
  },
  statusDetail: {
    fontFamily: Fonts.regular,
    color: Colors.textSub,
    fontSize: 13,
    marginTop: 10,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
  },
});

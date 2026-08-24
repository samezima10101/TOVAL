import React from "react";
import { Colors } from "@/constants/theme";
import { MAX_PLANNED_SECONDS } from "@/src/domain/types";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const MAX_MINUTES = MAX_PLANNED_SECONDS / 60;

function clampMinutes(value: number): number {
  return Math.max(0, Math.min(MAX_MINUTES, Math.round(value / 5) * 5));
}

function displayMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

export default function TimerSetupModal({
  visible,
  initialMinutes = 25,
  hasActiveTimer,
  onClose,
  onStart,
  onResume,
}: {
  visible: boolean;
  initialMinutes?: number;
  hasActiveTimer: boolean;
  onClose: () => void;
  onStart: (plannedSeconds: number) => Promise<void>;
  onResume: () => void;
}) {
  const [minutes, setMinutes] = React.useState(() => clampMinutes(initialMinutes));
  const [isStarting, setIsStarting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (visible) {
      setMinutes(clampMinutes(initialMinutes));
      setError(null);
    }
  }, [initialMinutes, visible]);

  const adjust = (amount: number) => {
    setMinutes((current) => clampMinutes(current + amount));
  };

  const handleStart = async () => {
    setError(null);
    setIsStarting(true);
    try {
      await onStart(minutes * 60);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "タイマーを開始できませんでした。");
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>集中時間を設定</Text>
          {hasActiveTimer ? (
            <>
              <Text style={styles.description}>
                進行中のタイマーがあります。新しく作らず、そのセッションを再開します。
              </Text>
              <TouchableOpacity
                style={styles.primaryAction}
                onPress={onResume}
                accessibilityRole="button"
                accessibilityLabel="進行中のタイマーを再開"
              >
                <Text style={styles.primaryActionText}>タイマーを再開</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.description}>
                5分単位、または1時間単位で調整できます。0:00はデバッグ用です。
              </Text>
              <View style={styles.timeRow}>
                <TouchableOpacity
                  onPress={() => adjust(-60)}
                  style={styles.adjustButton}
                  accessibilityRole="button"
                  accessibilityLabel="1時間減らす"
                >
                  <Text style={styles.adjustText}>−1h</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => adjust(-5)}
                  style={styles.adjustButton}
                  accessibilityRole="button"
                  accessibilityLabel="5分減らす"
                >
                  <Text style={styles.adjustText}>−5m</Text>
                </TouchableOpacity>
                <Text style={styles.timeText} accessibilityLabel={`設定時間 ${displayMinutes(minutes)}`}>
                  {displayMinutes(minutes)}
                </Text>
                <TouchableOpacity
                  onPress={() => adjust(5)}
                  style={styles.adjustButton}
                  accessibilityRole="button"
                  accessibilityLabel="5分増やす"
                >
                  <Text style={styles.adjustText}>＋5m</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => adjust(60)}
                  style={styles.adjustButton}
                  accessibilityRole="button"
                  accessibilityLabel="1時間増やす"
                >
                  <Text style={styles.adjustText}>＋1h</Text>
                </TouchableOpacity>
              </View>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <TouchableOpacity
                style={[styles.primaryAction, isStarting && styles.disabledAction]}
                onPress={() => void handleStart()}
                disabled={isStarting}
                accessibilityRole="button"
                accessibilityLabel="設定した時間でタイマーを開始"
                accessibilityState={{ disabled: isStarting, busy: isStarting }}
              >
                <Text style={styles.primaryActionText}>
                  {isStarting ? "保存中…" : "タイマーを開始"}
                </Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeAction}
            disabled={isStarting}
            accessibilityRole="button"
            accessibilityLabel="タイマー設定を閉じる"
          >
            <Text style={styles.closeText}>閉じる</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  card: {
    borderRadius: 20,
    padding: 24,
    backgroundColor: Colors.surface,
  },
  title: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  description: {
    color: Colors.textSub,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
    textAlign: "center",
  },
  timeRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
  },
  timeText: {
    color: Colors.text,
    flex: 1,
    fontSize: 30,
    fontVariant: ["tabular-nums"],
    fontWeight: "700",
    textAlign: "center",
  },
  adjustButton: {
    alignItems: "center",
    borderColor: Colors.border,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 42,
    paddingHorizontal: 5,
    paddingVertical: 10,
  },
  adjustText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  primaryAction: {
    alignItems: "center",
    backgroundColor: Colors.accent,
    borderRadius: 28,
    marginTop: 24,
    paddingVertical: 15,
  },
  disabledAction: {
    opacity: 0.6,
  },
  primaryActionText: {
    color: Colors.surface,
    fontSize: 17,
    fontWeight: "700",
  },
  closeAction: {
    alignItems: "center",
    marginTop: 14,
    padding: 8,
  },
  closeText: {
    color: Colors.textSub,
    fontSize: 15,
    fontWeight: "600",
  },
  error: {
    color: Colors.warning,
    fontSize: 13,
    marginTop: 12,
    textAlign: "center",
  },
});

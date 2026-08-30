import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Colors } from "@/src/constants/theme";
import useTimerSetup from "@/src/hooks/useTimerSetup";

type Props = {
  visible: boolean;
  initialMinutes?: number;
  hasActiveTimer: boolean;
  onClose: () => void;
  onStart: (plannedSeconds: number) => Promise<void>;
  onResume: () => void;
};

export default function TimerSetupModal({
  visible,
  initialMinutes = 25,
  hasActiveTimer,
  onClose,
  onStart,
  onResume,
}: Props) {
  const { isStarting, error, displayHours, displayMins, adjust, handleStart } =
    useTimerSetup(initialMinutes, visible, onStart);

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

              <View style={styles.pickerContainer}>
                {/* 時間の設定カラム */}
                <View style={styles.pickerColumn}>
                  <TouchableOpacity
                    onPress={() => adjust(60)}
                    style={styles.arrowButton}
                    accessibilityRole="button"
                    accessibilityLabel="1時間増やす"
                  >
                    <Text style={styles.arrowText}>＋</Text>
                  </TouchableOpacity>
                  <Text style={[styles.numberText, { color: Colors.primary }]}>
                    {displayHours}
                  </Text>
                  <TouchableOpacity
                    onPress={() => adjust(-60)}
                    style={styles.arrowButton}
                    accessibilityRole="button"
                    accessibilityLabel="1時間減らす"
                  >
                    <Text style={styles.arrowText}>－</Text>
                  </TouchableOpacity>
                  <Text style={[styles.unitText, { color: Colors.textSub }]}>
                    hour
                  </Text>
                </View>

                <Text style={[styles.colon, { color: Colors.text }]}>:</Text>

                {/* 分の設定カラム */}
                <View style={styles.pickerColumn}>
                  <TouchableOpacity
                    onPress={() => adjust(5)}
                    style={styles.arrowButton}
                    accessibilityRole="button"
                    accessibilityLabel="5分増やす"
                  >
                    <Text style={styles.arrowText}>＋</Text>
                  </TouchableOpacity>
                  <Text style={[styles.numberText, { color: Colors.primary }]}>
                    {String(displayMins).padStart(2, "0")}
                  </Text>
                  <TouchableOpacity
                    onPress={() => adjust(-5)}
                    style={styles.arrowButton}
                    accessibilityRole="button"
                    accessibilityLabel="5分減らす"
                  >
                    <Text style={styles.arrowText}>－</Text>
                  </TouchableOpacity>
                  <Text style={[styles.unitText, { color: Colors.textSub }]}>
                    min
                  </Text>
                </View>
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <TouchableOpacity
                style={[
                  styles.primaryAction,
                  isStarting && styles.disabledAction,
                ]}
                onPress={handleStart}
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

  // 新しいピッカーUI用のスタイル
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    marginBottom: 10,
  },
  pickerColumn: {
    alignItems: "center",
    width: 80,
  },
  arrowButton: {
    padding: 10,
  },
  arrowText: {
    fontSize: 24,
    color: Colors.border,
    fontWeight: "bold",
  },
  numberText: {
    fontSize: 48,
    fontWeight: "bold",
    marginVertical: 10,
    fontVariant: ["tabular-nums"],
  },
  unitText: {
    fontSize: 16,
    marginTop: 5,
  },
  colon: {
    fontSize: 36,
    fontWeight: "bold",
    marginHorizontal: 10,
    marginBottom: 25, // 「hour/min」のテキスト分だけ少し上にズラして中央を合わせるための余白
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

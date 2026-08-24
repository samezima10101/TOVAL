import React, { useMemo } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type LoginRecord = {
  storyTitle: string;
  totalTimerMinutes: number;
};
type RecordModalProps = {
  visible: boolean;
  selectedDate: string | null;
  loginData: Record<string, LoginRecord>;
  onClose: () => void;
  onChangeDate: (date: string) => void;
};

export default function LogModal({
  visible,
  selectedDate,
  loginData,
  onClose,
  onChangeDate,
}: RecordModalProps) {
  // ログイン記録がある日付一覧を昇順ソートして取得
  const loginDates = useMemo(() => Object.keys(loginData).sort(), [loginData]);

  // モーダル内の「←」ボタン処理
  const handlePrev = () => {
    if (!selectedDate) return;
    const prevDates = loginDates.filter((date) => date < selectedDate);
    if (prevDates.length > 0) {
      onChangeDate(prevDates[prevDates.length - 1]);
    }
  };

  // モーダル内の「→」ボタン処理
  const handleNext = () => {
    if (!selectedDate) return;
    const nextDates = loginDates.filter((date) => date > selectedDate);
    if (nextDates.length > 0) {
      onChangeDate(nextDates[0]);
    }
  };

  const currentRecord = selectedDate ? loginData[selectedDate] : null;
  const hasPrev = selectedDate
    ? loginDates.some((date) => date < selectedDate)
    : false;
  const hasNext = selectedDate
    ? loginDates.some((date) => date > selectedDate)
    : false;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalDateTitle}>{selectedDate}</Text>

          {currentRecord ? (
            <View style={styles.recordContainer}>
              <Text style={styles.recordText}>
                1. 解放したストーリー：{"\n"}
                {currentRecord.storyTitle}
              </Text>
              <Text style={styles.recordText}>
                2. タイマー合計時間：{"\n"}
                {currentRecord.totalTimerMinutes}分
              </Text>
            </View>
          ) : (
            <View style={styles.recordContainer}>
              <Text style={styles.noRecordText}>ログイン記録なし</Text>
            </View>
          )}

          <View style={styles.modalActions}>
            <TouchableOpacity
              onPress={handlePrev}
              disabled={!hasPrev}
              style={styles.arrowButton}
            >
              <Text
                style={[styles.arrowText, !hasPrev && styles.disabledArrowText]}
              >
                ← 前の記録
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>閉じる</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNext}
              disabled={!hasNext}
              style={styles.arrowButton}
            >
              <Text
                style={[styles.arrowText, !hasNext && styles.disabledArrowText]}
              >
                次の記録 →
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalDateTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  recordContainer: {
    minHeight: 80,
    justifyContent: "center",
  },
  recordText: {
    fontSize: 16,
    marginBottom: 12,
    lineHeight: 24,
    color: "#333",
  },
  noRecordText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
  },
  arrowButton: {
    paddingVertical: 8,
  },
  arrowText: {
    fontSize: 14,
    color: "#00adf5",
    fontWeight: "bold",
  },
  disabledArrowText: {
    color: "#ccc",
  },
  closeButton: {
    backgroundColor: "#00adf5",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

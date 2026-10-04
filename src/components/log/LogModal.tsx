import React from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { shiftLocalDateKey } from "@/src/domain/common/date";
import { DiaryLog } from "@/src/domain/common/types";

type RecordModalProps = {
  visible: boolean;
  selectedDate: string | null;
  logsByDate: Record<string, DiaryLog[]>;
  onClose: () => void;
  onChangeDate: (date: string) => void;
};

export default function LogModal({
  visible,
  selectedDate,
  logsByDate,
  onClose,
  onChangeDate,
}: RecordModalProps) {
  const currentLogs = selectedDate ? logsByDate[selectedDate] ?? [] : [];

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.dateTitle}>{selectedDate}</Text>
          <ScrollView style={styles.records}>
            {currentLogs.length > 0 ? (
              currentLogs.map((log) => (
                <View key={log.id} style={styles.record}>
                  <Text style={styles.time}>
                    {log.completedTime ? `${log.completedTime} ・ ` : ""}{Math.floor(log.totalTimerSeconds / 60)}分
                  </Text>
                  <Text style={styles.diary} selectable>
                    {log.diary || "振り返りなし"}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.noRecord}>記録なし</Text>
            )}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => selectedDate && onChangeDate(shiftLocalDateKey(selectedDate, -1))}
              disabled={!selectedDate}
              accessibilityRole="button"
              accessibilityLabel="前の日"
              style={styles.arrowButton}
            >
              <Text style={[styles.arrowText, !selectedDate && styles.disabledText]}>← 前の日</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>閉じる</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => selectedDate && onChangeDate(shiftLocalDateKey(selectedDate, 1))}
              disabled={!selectedDate}
              accessibilityRole="button"
              accessibilityLabel="次の日"
              style={styles.arrowButton}
            >
              <Text style={[styles.arrowText, !selectedDate && styles.disabledText]}>次の日 →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    flex: 1,
    justifyContent: "center",
  },
  content: { backgroundColor: "#fff", borderRadius: 12, maxHeight: "75%", padding: 24, width: "85%" },
  dateTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 16, textAlign: "center" },
  records: { minHeight: 100 },
  record: { borderBottomColor: "#e2e8f0", borderBottomWidth: 1, gap: 6, paddingVertical: 12 },
  time: { color: "#718096", fontSize: 13, fontWeight: "700" },
  diary: { color: "#333", fontSize: 16, lineHeight: 24 },
  noRecord: { color: "#999", fontSize: 16, paddingVertical: 30, textAlign: "center" },
  actions: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  arrowButton: { paddingVertical: 8 },
  arrowText: { color: "#00adf5", fontSize: 14, fontWeight: "bold" },
  disabledText: { color: "#ccc" },
  closeButton: { backgroundColor: "#00adf5", borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  closeText: { color: "#fff", fontWeight: "bold" },
});

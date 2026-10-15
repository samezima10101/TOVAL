import React, { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { shiftLocalDateKey } from "@/src/domain/common/date";
import { DiaryLog, MAX_DIARY_LENGTH } from "@/src/domain/common/types";
import { formatFocusDuration } from "@/src/domain/timer";
import PrimaryButton from "@/src/components/common/PrimaryButton";

type RecordModalProps = {
  visible: boolean;
  selectedDate: string | null;
  logsByDate: Record<string, DiaryLog[]>;
  onClose: () => void;
  onChangeDate: (date: string) => void;
  onSaveDiary: (logId: string, diary: string) => Promise<void>;
};

export default function LogModal({
  visible,
  selectedDate,
  logsByDate,
  onClose,
  onChangeDate,
  onSaveDiary,
}: RecordModalProps) {
  const currentLogs = selectedDate ? logsByDate[selectedDate] ?? [] : [];
  const totalSeconds = currentLogs.reduce((total, log) => total + log.totalTimerSeconds, 0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savingRef = useRef(false);
  const cancelEdit = () => {
    if (savingRef.current) return;
    setEditingId(null);
    setDraft("");
    setError(null);
  };
  const save = async () => {
    if (savingRef.current || editingId === null) return;
    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      await onSaveDiary(editingId, draft);
      setEditingId(null);
      setDraft("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "日記を保存できませんでした。もう一度お試しください。");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <Modal animationType="fade" transparent visible={visible}
      onRequestClose={editingId !== null ? cancelEdit : onClose} accessibilityViewIsModal>
      <KeyboardAvoidingView behavior="padding" style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.dateTitle}>{selectedDate}</Text>
          <Text style={styles.total}>集中時間の合計　{formatFocusDuration(totalSeconds)}</Text>
          <ScrollView style={styles.records} keyboardShouldPersistTaps="handled">
            {currentLogs.length > 0 ? (
              currentLogs.map((log) => (
                <View key={log.id} style={styles.record}>
                  <Text style={styles.time}>
                    開始時刻　{log.startInfo?.startedTime ?? "記録なし"}
                  </Text>
                  <Text style={styles.time}>集中時間　{formatFocusDuration(log.totalTimerSeconds)}</Text>
                  <Text style={styles.diary} selectable>
                    {log.diary || "振り返りなし"}
                  </Text>
                  {editingId === log.id ? (
                    <View style={styles.editor}>
                      <TextInput multiline value={draft} onChangeText={setDraft}
                        maxLength={MAX_DIARY_LENGTH} editable={!saving}
                        accessibilityLabel="日記を編集" style={styles.input} />
                      <Text style={styles.time}>{draft.length} / {MAX_DIARY_LENGTH}文字</Text>
                      {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : null}
                      <PrimaryButton title="日記を保存" onPress={() => void save()}
                        disabled={saving || draft.length > MAX_DIARY_LENGTH} loading={saving} />
                      <TouchableOpacity onPress={cancelEdit} disabled={saving} accessibilityRole="button" style={styles.editButton}>
                        <Text style={styles.arrowText}>編集をキャンセル</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity accessibilityRole="button" accessibilityLabel="日記を編集する"
                      disabled={editingId !== null} style={styles.editButton}
                      onPress={() => { setEditingId(log.id); setDraft(log.diary); setError(null); }}>
                      <Text style={[styles.arrowText, editingId !== null && styles.disabledText]}>日記を編集する</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            ) : (
              <Text style={styles.noRecord}>記録なし</Text>
            )}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => selectedDate && onChangeDate(shiftLocalDateKey(selectedDate, -1))}
              disabled={!selectedDate || editingId !== null}
              accessibilityRole="button"
              accessibilityLabel="前の日"
              style={styles.arrowButton}
            >
              <Text style={[styles.arrowText, (!selectedDate || editingId !== null) && styles.disabledText]}>← 前の日</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} disabled={editingId !== null} accessibilityRole="button"
              style={[styles.closeButton, editingId !== null && styles.disabledButton]}>
              <Text style={styles.closeText}>閉じる</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => selectedDate && onChangeDate(shiftLocalDateKey(selectedDate, 1))}
              disabled={!selectedDate || editingId !== null}
              accessibilityRole="button"
              accessibilityLabel="次の日"
              style={styles.arrowButton}
            >
              <Text style={[styles.arrowText, (!selectedDate || editingId !== null) && styles.disabledText]}>次の日 →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  total: { fontSize: 15, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  editor: { gap: 10 },
  input: { borderWidth: 1, borderColor: "#cbd5e0", borderRadius: 8, padding: 10, minHeight: 120, color: "#333", textAlignVertical: "top" },
  error: { color: "#b91c1c", fontSize: 13 },
  editButton: { alignSelf: "flex-start", paddingVertical: 10 },
  disabledButton: { opacity: 0.4 },
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

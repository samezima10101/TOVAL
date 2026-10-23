import React, { useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import FileTextboxBackground from "@/src/components/common/FileTextboxBackground";
import PrimaryButton from "@/src/components/common/PrimaryButton";
import { Fonts } from "@/src/constants/theme";
import { DiaryLog, MAX_DIARY_LENGTH } from "@/src/domain/common/types";
import { getStoryEpisode } from "@/src/domain/storyData";
import { formatFocusDuration } from "@/src/domain/timer";

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
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const currentLogs = selectedDate ? logsByDate[selectedDate] ?? [] : [];
  const totalSeconds = currentLogs.reduce((total, log) => total + log.totalTimerSeconds, 0);
  const storyTitles = [...new Set(currentLogs.flatMap((log) => {
    const episode = log.unlockedEpisodeId === null ? undefined : getStoryEpisode(log.unlockedEpisodeId);
    return episode ? [episode.title] : [];
  }))];
  const recordedDates = useMemo(
    () => Object.keys(logsByDate).filter((date) => logsByDate[date].length > 0).sort(),
    [logsByDate],
  );
  // Empty calendar dates can also be opened, so find each neighbor by comparison.
  const previousDate = selectedDate
    ? recordedDates.filter((date) => date < selectedDate).at(-1)
    : undefined;
  const nextDate = selectedDate
    ? recordedDates.find((date) => date > selectedDate)
    : undefined;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savingRef = useRef(false);
  const editing = editingId !== null;
  const previousDisabled = !previousDate || editing;
  const nextDisabled = !nextDate || editing;
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
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={editing ? cancelEdit : onClose}
      accessibilityViewIsModal
    >
      <KeyboardAvoidingView
        behavior="padding"
        style={[styles.overlay, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}
      >
        <View style={styles.content}>
          <View style={[styles.recordRow, { height: Math.min(440, height * 0.56) }]}>
            <TouchableOpacity
              onPress={() => { if (previousDate && !previousDisabled) onChangeDate(previousDate); }}
              disabled={previousDisabled}
              accessibilityRole="button"
              accessibilityLabel="前の記録がある日"
              accessibilityState={{ disabled: previousDisabled }}
              style={[styles.arrowButton, previousDisabled && styles.disabledButton]}
            >
              <Svg width={16} height={28} viewBox="0 0 16 28" accessible={false}>
                <Path d="M10 5 L5 14 L10 23" stroke="#FFFFFF" strokeWidth={1.5} fill="none" />
              </Svg>
            </TouchableOpacity>

            <View style={styles.frame}>
              <FileTextboxBackground style={styles.frameImage} />
              <ScrollView
                key={selectedDate}
                style={styles.records}
                contentContainerStyle={styles.recordsContent}
                keyboardShouldPersistTaps="handled"
                contentInsetAdjustmentBehavior="never"
                indicatorStyle="white"
              >
                <Text style={styles.dateTitle} accessibilityRole="header">{selectedDate}</Text>
                {currentLogs.length > 0 ? (
                  <>
                    <Text style={styles.summary}>STORY: {storyTitles.join(" / ") || "解放なし"}</Text>
                    <Text style={styles.summary} accessibilityLabel={`集中時間の合計 ${formatFocusDuration(totalSeconds)}`}>
                      {currentLogs.length > 1 ? "TOTAL TIME" : "TIME"}: {formatFocusDuration(totalSeconds)}
                    </Text>
                    {currentLogs.map((log, index) => (
                      <View key={log.id} style={[styles.record, index > 0 && styles.followingRecord]}>
                        <Text style={styles.time}>開始時刻: {log.startInfo?.startedTime ?? "記録なし"}</Text>
                        {currentLogs.length > 1 ? (
                          <Text style={styles.summary}>TIME: {formatFocusDuration(log.totalTimerSeconds)}</Text>
                        ) : null}
                        {editingId === log.id ? (
                          <View style={styles.editor}>
                            <Text style={styles.summary}>MEMO:</Text>
                            <TextInput
                              multiline
                              value={draft}
                              onChangeText={setDraft}
                              maxLength={MAX_DIARY_LENGTH}
                              editable={!saving}
                              accessibilityLabel="日記を編集"
                              style={styles.input}
                              selectionColor="#E0DFFF"
                            />
                            <Text style={styles.time}>{draft.length} / {MAX_DIARY_LENGTH}文字</Text>
                            {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : null}
                            <PrimaryButton
                              title="日記を保存"
                              onPress={() => void save()}
                              disabled={saving || draft.length > MAX_DIARY_LENGTH}
                              loading={saving}
                            />
                            <TouchableOpacity
                              onPress={cancelEdit}
                              disabled={saving}
                              accessibilityRole="button"
                              accessibilityState={{ disabled: saving }}
                              style={[styles.editButton, saving && styles.disabledButton]}
                            >
                              <Text style={styles.editText}>編集をキャンセル</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <>
                            <Text style={styles.diary} selectable>MEMO: {log.diary || "振り返りなし"}</Text>
                            <TouchableOpacity
                              accessibilityRole="button"
                              accessibilityLabel="日記を編集する"
                              accessibilityState={{ disabled: editing }}
                              disabled={editing}
                              style={[styles.editButton, editing && styles.disabledButton]}
                              onPress={() => { setEditingId(log.id); setDraft(log.diary); setError(null); }}
                            >
                              <Text style={styles.editText}>日記を編集する</Text>
                            </TouchableOpacity>
                          </>
                        )}
                      </View>
                    ))}
                  </>
                ) : (
                  <Text style={styles.noRecord}>記録なし</Text>
                )}
              </ScrollView>
            </View>

            <TouchableOpacity
              onPress={() => { if (nextDate && !nextDisabled) onChangeDate(nextDate); }}
              disabled={nextDisabled}
              accessibilityRole="button"
              accessibilityLabel="次の記録がある日"
              accessibilityState={{ disabled: nextDisabled }}
              style={[styles.arrowButton, nextDisabled && styles.disabledButton]}
            >
              <Svg width={16} height={28} viewBox="0 0 16 28" accessible={false}>
                <Path d="M6 5 L11 14 L6 23" stroke="#FFFFFF" strokeWidth={1.5} fill="none" />
              </Svg>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={onClose}
            disabled={editing}
            accessibilityRole="button"
            accessibilityLabel="ログを閉じる"
            accessibilityState={{ disabled: editing }}
            style={[styles.closeButton, editing && styles.disabledButton]}
          >
            <Text style={styles.closeText}>× CLOSE</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.76)",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  content: { alignItems: "center", flexShrink: 1, gap: 28, maxHeight: "100%", maxWidth: 440, width: "100%" },
  recordRow: { alignItems: "center", flexDirection: "row", flexShrink: 1, minHeight: 120, width: "100%" },
  frame: { flex: 1, height: "100%", paddingTop: 48, paddingHorizontal: 22, paddingBottom: 24 },
  frameImage: { shadowColor: "#FFFFFF", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.65, shadowRadius: 12 },
  records: { flex: 1 },
  recordsContent: { paddingBottom: 8 },
  dateTitle: { color: "#E0E3EE", fontSize: 13, fontFamily: Fonts.pixel, letterSpacing: 1, marginBottom: 18 },
  summary: { color: "#FFFFFF", fontSize: 16, fontFamily: Fonts.pixel, lineHeight: 26, letterSpacing: 1 },
  record: { gap: 8, paddingTop: 12 },
  followingRecord: { borderTopColor: "rgba(255,255,255,0.3)", borderTopWidth: 1, marginTop: 12 },
  time: { color: "#E0E3EE", fontSize: 13, fontFamily: Fonts.pixel, lineHeight: 22 },
  diary: { fontFamily: Fonts.pixel, color: "#FFFFFF", fontSize: 16, lineHeight: 26, letterSpacing: 1 },
  editor: { gap: 10 },
  input: { fontFamily: Fonts.regular, borderWidth: 1, borderColor: "rgba(255,255,255,0.6)", backgroundColor: "rgba(0,0,0,0.2)", padding: 10, minHeight: 120, color: "#FFFFFF", fontSize: 16, lineHeight: 24, textAlignVertical: "top" },
  error: { fontFamily: Fonts.regular, color: "#FFE0E7", fontSize: 13, lineHeight: 21 },
  editButton: { alignSelf: "flex-start", justifyContent: "center", minHeight: 44, paddingVertical: 10 },
  editText: { color: "#FFFFFF", fontSize: 13, fontFamily: Fonts.regular, textDecorationLine: "underline" },
  disabledButton: { opacity: 0.2 },
  noRecord: { fontFamily: Fonts.pixel, color: "#E0E3EE", fontSize: 16, paddingVertical: 30 },
  arrowButton: { alignItems: "center", justifyContent: "center", minHeight: 44, width: 44 },
  closeButton: { alignItems: "center", justifyContent: "center", minHeight: 44, paddingHorizontal: 20 },
  closeText: { color: "#FFFFFF", fontSize: 18, fontFamily: Fonts.regular },
});

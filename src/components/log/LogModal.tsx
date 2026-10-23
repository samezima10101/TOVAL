import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Keyboard,
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
import {
  KeyboardEditorInput,
  KeyboardEditorToolbar,
  useKeyboardEditor,
} from "@/src/components/common/KeyboardEditor";
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

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
function formatStartTime(time: string | undefined): string {
  if (!time) return "記録なし";
  const [hours, minutes] = time.split(":").map(Number);
  return `${hours}時${minutes}分`;
}

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
  const date = selectedDate ? new Date(`${selectedDate}T12:00:00`) : null;
  const dateLabel = date
    ? `${date.getMonth() + 1}月${date.getDate()}日${WEEKDAYS[date.getDay()]}曜日`
    : "";
  const currentLogs = selectedDate ? (logsByDate[selectedDate] ?? []) : [];
  const totalSeconds = currentLogs.reduce(
    (total, log) => total + log.totalTimerSeconds,
    0,
  );
  const storyTitles = [
    ...new Set(
      currentLogs.flatMap((log) => {
        const episode =
          log.unlockedEpisodeId === null
            ? undefined
            : getStoryEpisode(log.unlockedEpisodeId);
        return episode ? [`第${episode.id}話　${episode.title}`] : [];
      }),
    ),
  ];
  const recordedDates = useMemo(
    () =>
      Object.keys(logsByDate)
        .filter((date) => logsByDate[date].length > 0)
        .sort(),
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
  const inputRef = useRef<TextInput>(null);
  const recordsRef = useRef<ScrollView>(null);
  const scrollOffsetRef = useRef(0);
  const revealFrameRef = useRef<number | null>(null);
  const revealRequestRef = useRef(0);
  const [recordsHeight, setRecordsHeight] = useState(200);
  const revealInput = useCallback(() => {
    const request = ++revealRequestRef.current;
    if (revealFrameRef.current !== null)
      cancelAnimationFrame(revealFrameRef.current);
    revealFrameRef.current = requestAnimationFrame(() => {
      revealFrameRef.current = null;
      const input = inputRef.current;
      const scroll = recordsRef.current;
      if (!input?.isFocused() || !scroll) return;
      // The native keyboard helper assumes a full-screen ScrollView. Measure
      // this folder's actual viewport instead, preserving its existing offset.
      scroll
        .getNativeScrollRef()
        ?.measureInWindow(
          (
            _x: number,
            viewportY: number,
            _width: number,
            viewportHeight: number,
          ) => {
            input.measureInWindow(
              (_inputX, inputY, _inputWidth, inputHeight) => {
                if (
                  request !== revealRequestRef.current ||
                  inputRef.current !== input ||
                  !input.isFocused()
                )
                  return;
                const top = viewportY + 8;
                const bottom = viewportY + viewportHeight - 8;
                let delta = 0;
                if (inputY + inputHeight > bottom)
                  delta = inputY + inputHeight - bottom;
                else if (inputY < top) delta = inputY - top;
                if (Math.abs(delta) > 1) {
                  scroll.scrollTo({
                    y: Math.max(0, scrollOffsetRef.current + delta),
                    animated: false,
                  });
                }
              },
            );
          },
        );
    });
  }, []);
  const cancelReveal = useCallback(() => {
    revealRequestRef.current++;
    if (revealFrameRef.current !== null)
      cancelAnimationFrame(revealFrameRef.current);
  }, []);
  useEffect(() => {
    const subscription = Keyboard.addListener("keyboardDidShow", revealInput);
    return () => {
      subscription.remove();
      cancelReveal();
    };
  }, [revealInput, cancelReveal]);
  const { toolbarBottom, contentBottomInset } = useKeyboardEditor();
  const editing = editingId !== null;
  const previousDisabled = !previousDate || editing;
  const nextDisabled = !nextDate || editing;
  const cancelEdit = () => {
    if (savingRef.current) return;
    Keyboard.dismiss();
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
      Keyboard.dismiss();
      setEditingId(null);
      setDraft("");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "日記を保存できませんでした。もう一度お試しください。",
      );
      requestAnimationFrame(() => inputRef.current?.focus());
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
      <View
        style={[
          styles.overlay,
          {
            paddingTop: insets.top + 16,
            paddingBottom: editing ? contentBottomInset : insets.bottom + 16,
          },
        ]}
      >
        <View style={styles.content}>
          <Text style={styles.dateTitle} accessibilityRole="header">
            {dateLabel}
          </Text>

          <View
            style={[styles.frame, { height: Math.min(440, height * 0.56) }]}
          >
            <FileTextboxBackground style={styles.frameImage} />
            <ScrollView
              ref={recordsRef}
              onScroll={({ nativeEvent }) => {
                scrollOffsetRef.current = nativeEvent.contentOffset.y;
              }}
              scrollEventThrottle={16}
              onContentSizeChange={revealInput}
              automaticallyAdjustKeyboardInsets={false}
              onLayout={({ nativeEvent: { layout } }) => {
                setRecordsHeight(layout.height);
                revealInput();
              }}
              key={selectedDate}
              style={styles.records}
              contentContainerStyle={styles.recordsContent}
              keyboardShouldPersistTaps="handled"
              contentInsetAdjustmentBehavior="never"
              indicatorStyle="white"
            >
              {currentLogs.length > 0 ? (
                <>
                  <Text style={styles.summary}>
                    {storyTitles.join("\n") || "解放なし"}
                  </Text>
                  <Text
                    style={styles.summary}
                    accessibilityLabel={`集中時間の合計 ${formatFocusDuration(totalSeconds)}`}
                  >
                    {currentLogs.length > 1 ? "TOTAL TIME" : "TIME"}:{" "}
                    {formatFocusDuration(totalSeconds)}
                  </Text>
                  {currentLogs.map((log, index) => (
                    <View
                      key={log.id}
                      style={[
                        styles.record,
                        index > 0 && styles.followingRecord,
                      ]}
                    >
                      <Text style={styles.time}>
                        開始時刻: {formatStartTime(log.startInfo?.startedTime)}
                      </Text>
                      {currentLogs.length > 1 ? (
                        <Text style={styles.summary}>
                          TIME: {formatFocusDuration(log.totalTimerSeconds)}
                        </Text>
                      ) : null}
                      <Text style={styles.diary}>MEMO:</Text>
                      {editingId === log.id ? (
                        <View style={styles.editor}>
                          <KeyboardEditorInput
                            key={log.id}
                            ref={inputRef}
                            autoGrow
                            maxInputHeight={Math.max(94, recordsHeight - 16)}
                            value={draft}
                            onChangeText={setDraft}
                            onFocus={revealInput}
                            onLayout={revealInput}
                            maxLength={MAX_DIARY_LENGTH}
                            editable={!saving}
                            accessibilityLabel="日記を編集"
                          />
                          {error ? (
                            <Text
                              style={styles.error}
                              accessibilityRole="alert"
                            >
                              {error}
                            </Text>
                          ) : null}
                        </View>
                      ) : (
                        <>
                          <Text style={styles.diary} selectable>
                            {log.diary || "振り返りなし"}
                          </Text>
                          <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel="日記を編集する"
                            accessibilityState={{ disabled: editing }}
                            disabled={editing}
                            style={[
                              styles.editButton,
                              editing && styles.disabledButton,
                            ]}
                            onPress={() => {
                              setEditingId(log.id);
                              setDraft(log.diary);
                              setError(null);
                            }}
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

          {!editing ? (
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => {
                  if (previousDate && !previousDisabled)
                    onChangeDate(previousDate);
                }}
                disabled={previousDisabled}
                accessibilityRole="button"
                accessibilityLabel="前の記録がある日"
                accessibilityState={{ disabled: previousDisabled }}
                style={[
                  styles.arrowButton,
                  previousDisabled && styles.disabledButton,
                ]}
              >
                <Svg
                  width={16}
                  height={28}
                  viewBox="0 0 16 28"
                  accessible={false}
                >
                  <Path
                    d="M10 5 L5 14 L10 23"
                    stroke="#FFFFFF"
                    strokeWidth={1.5}
                    fill="none"
                  />
                </Svg>
              </TouchableOpacity>
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
              <TouchableOpacity
                onPress={() => {
                  if (nextDate && !nextDisabled) onChangeDate(nextDate);
                }}
                disabled={nextDisabled}
                accessibilityRole="button"
                accessibilityLabel="次の記録がある日"
                accessibilityState={{ disabled: nextDisabled }}
                style={[
                  styles.arrowButton,
                  nextDisabled && styles.disabledButton,
                ]}
              >
                <Svg
                  width={16}
                  height={28}
                  viewBox="0 0 16 28"
                  accessible={false}
                >
                  <Path
                    d="M6 5 L11 14 L6 23"
                    stroke="#FFFFFF"
                    strokeWidth={1.5}
                    fill="none"
                  />
                </Svg>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
        {editing ? (
          <KeyboardEditorToolbar
            bottom={toolbarBottom}
            onCancel={cancelEdit}
            onSave={() => void save()}
            busy={saving}
            saveDisabled={draft.length > MAX_DIARY_LENGTH}
            cancelLabel="日記の編集をキャンセル"
            saveLabel="日記の変更を保存"
            status={`${draft.length} / ${MAX_DIARY_LENGTH}文字`}
          />
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.76)",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  content: {
    alignItems: "center",
    flexShrink: 1,
    gap: 16,
    maxHeight: "100%",
    maxWidth: 440,
    width: "100%",
  },
  actions: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 280,
  },
  frame: {
    flexShrink: 1,
    minHeight: 120,
    width: "100%",
    paddingTop: 32,
    paddingHorizontal: 22,
    paddingBottom: 20,
  },
  frameImage: {
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 12,
  },
  records: { flex: 1 },
  recordsContent: { paddingBottom: 8 },
  dateTitle: {
    color: "#E0E3EE",
    fontSize: 18,
    fontFamily: Fonts.pixel,
    letterSpacing: 1,
    textAlign: "center",
  },
  summary: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: Fonts.pixel,
    lineHeight: 26,
    letterSpacing: 1,
  },
  record: { gap: 8, paddingTop: 12 },
  followingRecord: {
    borderTopColor: "rgba(255,255,255,0.3)",
    borderTopWidth: 1,
    marginTop: 12,
  },
  time: {
    color: "#E0E3EE",
    fontSize: 13,
    fontFamily: Fonts.pixel,
    lineHeight: 22,
  },
  diary: {
    fontFamily: Fonts.pixel,
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 26,
    letterSpacing: 1,
  },
  editor: { gap: 8 },
  error: {
    fontFamily: Fonts.regular,
    color: "#FFE0E7",
    fontSize: 13,
    lineHeight: 21,
  },
  editButton: {
    alignSelf: "flex-end",
    justifyContent: "center",
    minHeight: 44,
    paddingVertical: 10,
  },
  editText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: Fonts.regular,
    textDecorationLine: "underline",
  },
  disabledButton: { opacity: 0.2 },
  noRecord: {
    fontFamily: Fonts.pixel,
    color: "#E0E3EE",
    fontSize: 16,
    paddingVertical: 30,
  },
  arrowButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    width: 44,
  },
  closeButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 20,
  },
  closeText: { color: "#FFFFFF", fontSize: 18, fontFamily: Fonts.regular },
});

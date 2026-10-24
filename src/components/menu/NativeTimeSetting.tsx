import DateTimePicker from "@react-native-community/datetimepicker";
import { useRef, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SettingsTitle } from "@/src/components/menu/SettingsLayout";
import { Fonts } from "@/src/constants/theme";

type NativeTimeSettingProps = {
  kind: "duration" | "notification";
  minutes: number;
  onSave: (minutes: number) => Promise<void>;
};

export default function NativeTimeSetting({
  kind,
  minutes,
  onSave,
}: NativeTimeSettingProps) {
  const duration = kind === "duration";
  const label = duration ? "デフォルト時間" : "通知時刻";
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queued = useRef<Date | null>(null);
  const busy = useRef(false);
  // A duration uses a fixed date and UTC so DST and 12-hour clock settings
  // cannot change its hours. Notification times follow the device's clock.
  const savedDate = duration
    ? new Date(Date.UTC(2000, 0, 1, Math.floor(minutes / 60), minutes % 60))
    : new Date(2000, 0, 1, Math.floor(minutes / 60), minutes % 60);

  const save = async (date: Date) => {
    setDraft(date);
    queued.current = date;
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setError(null);
    try {
      // Coalesce wheel changes while a write is pending; keep the latest
      // selection and serialize writes through the existing settings API.
      while (queued.current) {
        const selection = queued.current;
        queued.current = null;
        const selectedMinutes = duration
          ? selection.getUTCHours() * 60 + selection.getUTCMinutes()
          : selection.getHours() * 60 + selection.getMinutes();
        try {
          await onSave(selectedMinutes);
          if (!queued.current) {
            setDraft(null);
            setError(null);
          }
        } catch {
          if (!queued.current) {
            setError("変更を保存できませんでした。選択した時間は未保存です。");
          }
        }
      }
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  const selected = draft ?? savedDate;
  const displayedMinutes = duration
    ? selected.getUTCHours() * 60 + selected.getUTCMinutes()
    : selected.getHours() * 60 + selected.getMinutes();
  const picker =
    Platform.OS === "ios" ? (
      <DateTimePicker
        value={selected}
        mode="time"
        display="spinner"
        themeVariant="dark"
        minuteInterval={duration ? 5 : 1}
        locale={duration ? "en_GB" : undefined}
        timeZoneName={duration ? "UTC" : undefined}
        onValueChange={(_, date) => void save(date)}
        accessibilityLabel={label}
        accessibilityHint={
          duration
            ? "時間と分を5分単位で選択すると自動保存します"
            : "時刻を選択すると自動保存します"
        }
        style={styles.timeWheels}
      />
    ) : null;

  const feedback = (
    <>
      {saving ? (
        <Text style={styles.status} accessibilityLiveRegion="polite">
          保存中…
        </Text>
      ) : null}
      {error ? (
        <View style={styles.timeFailure}>
          <Text style={styles.error} accessibilityRole="alert">
            {error}
          </Text>
          <TouchableOpacity
            onPress={() => {
              if (draft) void save(draft);
            }}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel={`${label}の保存を再試行`}
            style={styles.action}
          >
            <Text style={styles.editText}>再試行</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (busy.current) return;
              setDraft(null);
              setError(null);
            }}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel={`${label}を保存済みの値に戻す`}
            style={styles.action}
          >
            <Text style={styles.editText}>元に戻す</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </>
  );

  return (
    <View style={styles.timeContainer}>
      {Platform.OS === "ios" ? (
        <>
          <TouchableOpacity
            onPress={() => setExpanded(true)}
            style={styles.timeButton}
            accessibilityRole="button"
            accessibilityLabel={`${label} ${Math.floor(displayedMinutes / 60)}${duration ? "時間" : "時"}${displayedMinutes % 60}分`}
            accessibilityHint="タップして時間を選択します"
          >
            <Text style={styles.value} maxFontSizeMultiplier={1.2}>
              {String(Math.floor(displayedMinutes / 60)).padStart(2, "0")}:
              {String(displayedMinutes % 60).padStart(2, "0")}
            </Text>
          </TouchableOpacity>
          <Modal
            visible={expanded}
            transparent
            animationType="slide"
            onRequestClose={() => setExpanded(false)}
            accessibilityViewIsModal
          >
            <View style={styles.timeOverlay}>
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={() => setExpanded(false)}
                accessibilityRole="button"
                accessibilityLabel="時間選択を閉じる"
              />
              <View
                style={[
                  styles.timeSheet,
                  { paddingBottom: insets.bottom + 16 },
                ]}
              >
                <View style={styles.timeSheetHeader}>
                  <SettingsTitle>{label}</SettingsTitle>
                  <TouchableOpacity
                    onPress={() => setExpanded(false)}
                    style={styles.action}
                    accessibilityRole="button"
                    accessibilityLabel={`${label}の選択を完了`}
                  >
                    <Text style={styles.editText}>完了</Text>
                  </TouchableOpacity>
                </View>
                {picker}
                {feedback}
              </View>
            </View>
          </Modal>
        </>
      ) : (
        <Text style={styles.value}>
          {String(Math.floor(minutes / 60)).padStart(2, "0")}:
          {String(minutes % 60).padStart(2, "0")}
        </Text>
      )}
      {!expanded ? feedback : null}
    </View>
  );
}

const styles = StyleSheet.create({
  value: { color: "#FFFFFF", fontFamily: Fonts.medium, fontSize: 18 },
  status: { color: "#E0E3EE", fontFamily: Fonts.regular, fontSize: 12 },
  action: { justifyContent: "center", minHeight: 44, paddingVertical: 10 },
  editText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: Fonts.regular,
    textDecorationLine: "underline",
  },
  error: { color: "#FFE0E7", fontFamily: Fonts.regular, fontSize: 13 },
  timeContainer: { alignItems: "flex-end", maxWidth: "55%" },
  timeButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 8,
  },
  timeOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  timeSheet: {
    backgroundColor: "#24262C",
    paddingHorizontal: 16,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  timeSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timeWheels: { width: "100%", height: 216 },
  timeFailure: { alignItems: "flex-end" },
});

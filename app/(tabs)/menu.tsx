import DateTimePicker from "@react-native-community/datetimepicker";
import { useBottomTabBarHeight } from "expo-router/js-tabs";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Keyboard,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import FileTextboxBackground from "@/src/components/common/FileTextboxBackground";
import {
  KeyboardEditorInput,
  KeyboardEditorToolbar,
  useKeyboardEditor,
} from "@/src/components/common/KeyboardEditor";
import PrimaryButton from "@/src/components/common/PrimaryButton";
import ScreenBackground from "@/src/components/common/ScreenBackground";
import { Fonts } from "@/src/constants/theme";
import { MAX_USER_NAME_LENGTH } from "@/src/domain/reminder";
import { MAX_TASK_NAME_LENGTH } from "@/src/domain/common/types";
import { useAppState } from "@/src/state/AppStateProvider";
import { useReminderNotifications } from "@/src/state/ReminderNotificationProvider";

function SettingsCard({ children }: { children: ReactNode }) {
  return (
    <View style={styles.panel}>
      <FileTextboxBackground shape="rectangle" />
      {children}
    </View>
  );
}

function SettingsRow({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.settingRow}>
      <Text
        style={[styles.sectionTitle, styles.rowTitle]}
        accessibilityRole="header"
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        maxFontSizeMultiplier={1.2}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

function BgmToggle() {
  const { state, setBgmEnabled } = useAppState();
  const busy = useRef(false);
  const [saving, setSaving] = useState(false);
  const [failedValue, setFailedValue] = useState<boolean | null>(null);

  const save = async (enabled: boolean) => {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setFailedValue(null);
    try {
      await setBgmEnabled(enabled);
    } catch {
      setFailedValue(enabled);
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  if (!state) return null;
  return (
    <View style={styles.bgmContainer}>
      <View style={styles.settingRow}>
        <Text style={[styles.sectionTitle, styles.rowTitle]}>
          BGM {state.bgmEnabled ? "オン" : "オフ"}
          {saving ? "（保存中…）" : ""}
        </Text>
        <Switch
          value={state.bgmEnabled}
          disabled={saving}
          onValueChange={(enabled) => {
            void save(enabled);
          }}
          accessibilityLabel="BGMのオン・オフ"
        />
      </View>
      {failedValue !== null ? (
        <View accessibilityRole="alert">
          <Text style={styles.error}>
            BGM設定を保存できませんでした。保存済みの設定を維持しています。
          </Text>
          <PrimaryButton
            title="BGM設定の保存を再試行"
            onPress={() => {
              void save(failedValue);
            }}
            disabled={saving}
          />
        </View>
      ) : null}
    </View>
  );
}

type NativeTimeSettingProps = {
  kind: "duration" | "notification";
  minutes: number;
  onSave: (minutes: number) => Promise<void>;
};

function NativeTimeSetting({ kind, minutes, onSave }: NativeTimeSettingProps) {
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
                  <Text style={styles.sectionTitle}>{label}</Text>
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

type TextSettingKey = "taskName" | "userName";

export default function MenuScreen() {
  const { top } = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const tabBarHeight = useBottomTabBarHeight();
  const screenRef = useRef<View>(null);
  const scrollRef = useRef<ScrollView>(null);
  const inputRefs = useRef<Record<TextSettingKey, TextInput | null>>({
    taskName: null,
    userName: null,
  });
  const scrollOffset = useRef(0);
  const revealRequest = useRef(0);
  const textSavingRef = useRef(false);
  const [bottomOffset, setBottomOffset] = useState(0);
  const [editingField, setEditingField] = useState<TextSettingKey | null>(null);
  const [drafts, setDrafts] = useState<Partial<Record<TextSettingKey, string>>>(
    {},
  );
  const [errors, setErrors] = useState<
    Partial<Record<TextSettingKey, string | null>>
  >({});
  const [textSaving, setTextSaving] = useState(false);
  const { toolbarBottom, contentBottomInset } = useKeyboardEditor({
    bottomOffset,
    minBottom: tabBarHeight,
  });
  const {
    state,
    setTaskName,
    setUserName,
    setNotificationTime,
    setDefaultTimerMinutes,
  } = useAppState();
  const {
    status,
    error: notificationError,
    retry,
  } = useReminderNotifications();
  const [actionError, setActionError] = useState<string | null>(null);
  const [isOpeningSettings, setIsOpeningSettings] = useState(false);

  const revealTextInput = useCallback(() => {
    const request = ++revealRequest.current;
    const input = Object.values(inputRefs.current).find((candidate) =>
      candidate?.isFocused(),
    );
    const scroll = scrollRef.current;
    if (!input?.isFocused() || !scroll) return;
    scroll
      .getNativeScrollRef()
      ?.measureInWindow(
        (_x: number, y: number, _width: number, height: number) => {
          input.measureInWindow((_inputX, inputY, _inputWidth, inputHeight) => {
            if (request !== revealRequest.current || !input.isFocused()) return;
            const visibleTop = y + top + 76 + 8;
            const visibleBottom = y + height - 8;
            const delta =
              inputY + inputHeight > visibleBottom
                ? inputY + inputHeight - visibleBottom
                : inputY < visibleTop
                  ? inputY - visibleTop
                  : 0;
            if (Math.abs(delta) > 1)
              scroll.scrollTo({
                y: Math.max(0, scrollOffset.current + delta),
                animated: false,
              });
          });
        },
      );
  }, [top]);

  const cancelTextReveal = useCallback(() => {
    revealRequest.current++;
  }, []);

  useEffect(() => {
    const subscription = Keyboard.addListener(
      "keyboardDidShow",
      revealTextInput,
    );
    return () => {
      subscription.remove();
      cancelTextReveal();
    };
  }, [revealTextInput, cancelTextReveal]);

  const clearTextDraft = (field: TextSettingKey) => {
    setDrafts((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
    setErrors((current) => ({ ...current, [field]: null }));
  };

  const cancelTextEdit = () => {
    if (textSavingRef.current || !editingField) return;
    clearTextDraft(editingField);
    setEditingField(null);
    Keyboard.dismiss();
  };

  const saveTextEdit = async () => {
    if (textSavingRef.current || !editingField || !state) return;
    const field = editingField;
    const value = drafts[field] ?? state[field];
    const label = field === "taskName" ? "タスク名" : "ユーザー名";
    const limit = field === "taskName" ? MAX_TASK_NAME_LENGTH : MAX_USER_NAME_LENGTH;
    // Legacy values can exceed today's cap. Preserve them until shortened;
    // the keyboard's Done action must follow the same guard as the OK button.
    if (value.length > limit) return;
    if (!value.trim()) {
      setErrors((current) => ({
        ...current,
        [field]: label + "を入力してください。",
      }));
      inputRefs.current[field]?.focus();
      return;
    }
    textSavingRef.current = true;
    setTextSaving(true);
    setErrors((current) => ({ ...current, [field]: null }));
    try {
      await (field === "taskName" ? setTaskName : setUserName)(value);
      clearTextDraft(field);
      setEditingField(null);
      Keyboard.dismiss();
    } catch (cause) {
      setErrors((current) => ({
        ...current,
        [field]:
          cause instanceof Error
            ? cause.message
            : label + "を保存できませんでした。",
      }));
      requestAnimationFrame(() => inputRefs.current[field]?.focus());
    } finally {
      textSavingRef.current = false;
      setTextSaving(false);
    }
  };

  const openNotificationSettings = async () => {
    if (isOpeningSettings) return;
    setActionError(null);
    setIsOpeningSettings(true);
    try {
      await Linking.openSettings();
    } catch {
      setActionError(
        "設定を開けませんでした。端末の設定から通知を許可してください。",
      );
    } finally {
      setIsOpeningSettings(false);
    }
  };

  const retryNotifications = async () => {
    setActionError(null);
    try {
      await retry();
    } catch {
      setActionError("通知を設定できませんでした。もう一度お試しください。");
    }
  };

  if (!state) return null;

  const textSettings = [
    {
      key: "taskName" as const,
      title: "集中するタスク",
      label: "タスク名",
      placeholder: "集中するタスクを入力",
      limit: MAX_TASK_NAME_LENGTH,
    },
    {
      key: "userName" as const,
      title: "ユーザー名",
      label: "ユーザー名",
      placeholder: "ユーザー名を入力",
      limit: MAX_USER_NAME_LENGTH,
    },
  ];
  const activeSetting = textSettings.find(({ key }) => key === editingField);
  const activeDraft = editingField
    ? (drafts[editingField] ?? state[editingField])
    : "";
  const activeLength = activeDraft.length;

  return (
    <View
      ref={screenRef}
      style={{ flex: 1 }}
      onLayout={() => {
        screenRef.current?.measureInWindow((_x, y, _width, height) =>
          setBottomOffset(Math.max(0, windowHeight - y - height)),
        );
      }}
    >
      <ScreenBackground source={require("@/assets/bg/starry-bg.png")} />
      <ScrollView
        ref={scrollRef}
        style={editingField ? { marginBottom: contentBottomInset } : undefined}
        onLayout={revealTextInput}
        onContentSizeChange={revealTextInput}
        onScroll={({ nativeEvent }) => {
          scrollOffset.current = nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: top + 76 + 20, paddingBottom: tabBarHeight + 20 },
        ]}
        contentInsetAdjustmentBehavior="never"
        scrollIndicatorInsets={{ top: top + 76, bottom: tabBarHeight }}
      >
        <Text style={styles.title} accessibilityRole="header">
          メニュー
        </Text>
        <SettingsCard>
          <BgmToggle />
        </SettingsCard>
        {textSettings.map((setting) => (
          <SettingsCard key={setting.key}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              {setting.title}
            </Text>
            <KeyboardEditorInput
              ref={(input) => {
                inputRefs.current[setting.key] = input;
              }}
              autoFocus={false}
              multiline={false}
              value={drafts[setting.key] ?? state[setting.key]}
              onFocus={() => {
                setDrafts((current) => ({
                  ...current,
                  [setting.key]: current[setting.key] ?? state[setting.key],
                }));
                setEditingField(setting.key);
                revealTextInput();
              }}
              onLayout={revealTextInput}
              onChangeText={(value) => {
                setDrafts((current) => ({ ...current, [setting.key]: value }));
                setErrors((current) => ({ ...current, [setting.key]: null }));
              }}
              style={[
                styles.value,
                styles.textInput,
                editingField === setting.key && styles.textInputActive,
              ]}
              maxLength={setting.limit}
              editable={!textSaving}
              placeholder={setting.placeholder}
              placeholderTextColor="#B7BCCB"
              autoCorrect={false}
              returnKeyType="done"
              submitBehavior="submit"
              onSubmitEditing={() => void saveTextEdit()}
              accessibilityLabel={setting.label}
              accessibilityHint={
                "タップして" + setting.limit + "文字以内で編集します"
              }
            />
            {editingField !== setting.key &&
            drafts[setting.key] !== undefined &&
            drafts[setting.key] !== state[setting.key] ? (
              <Text style={styles.status}>未保存</Text>
            ) : null}
            {errors[setting.key] ? (
              <Text style={styles.error} accessibilityRole="alert">
                {errors[setting.key]}
              </Text>
            ) : null}
          </SettingsCard>
        ))}
        <SettingsCard>
          <SettingsRow title="デフォルト時間">
            <NativeTimeSetting
              kind="duration"
              minutes={state.defaultTimerMinutes}
              onSave={setDefaultTimerMinutes}
            />
          </SettingsRow>
          <Text style={styles.description}>
            ホームのタイマー設定を開いたときの初期値です。
          </Text>
        </SettingsCard>
        <SettingsCard>
          <SettingsRow title="通知設定">
            <NativeTimeSetting
              kind="notification"
              minutes={state.notificationHour * 60 + state.notificationMinute}
              onSave={(minutes) =>
                setNotificationTime({
                  notificationHour: Math.floor(minutes / 60),
                  notificationMinute: minutes % 60,
                })
              }
            />
          </SettingsRow>
          <Text style={styles.description} accessibilityLiveRegion="polite">
            {status === "loading"
              ? "通知を設定しています…"
              : status === "scheduled"
                ? "お知らせを設定しました。"
                : status === "denied"
                  ? "通知が許可されていません。端末の設定から通知を許可してください。"
                  : status === "permission-required"
                    ? "お知らせを受け取るには、通知を許可してください。"
                    : status === "unsupported"
                      ? "この環境では通知を利用できません。iPhoneでご利用ください。"
                      : "通知を設定できませんでした。"}
          </Text>
          {notificationError || actionError ? (
            <Text style={styles.error} accessibilityRole="alert">
              {[notificationError, actionError].filter(Boolean).join("\n")}
            </Text>
          ) : null}
          {status === "denied" ? (
            <PrimaryButton
              title="端末の設定を開く"
              onPress={() => void openNotificationSettings()}
              loading={isOpeningSettings}
            />
          ) : null}
          {status === "permission-required" || status === "error" ? (
            <PrimaryButton
              title={
                status === "permission-required"
                  ? "通知を許可"
                  : "通知設定を再試行"
              }
              onPress={() => void retryNotifications()}
            />
          ) : null}
        </SettingsCard>
      </ScrollView>
      {activeSetting ? (
        <KeyboardEditorToolbar
          bottom={toolbarBottom}
          onCancel={cancelTextEdit}
          onSave={() => void saveTextEdit()}
          busy={textSaving}
          saveDisabled={activeLength > activeSetting.limit}
          cancelLabel={activeSetting.label + "の編集をキャンセル"}
          saveLabel={activeSetting.label + "の変更を保存"}
          status={activeLength + " / " + activeSetting.limit + "文字"}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 24 },
  title: { color: "#FFFFFF", fontFamily: Fonts.bold, fontSize: 24 },
  value: { color: "#FFFFFF", fontFamily: Fonts.medium, fontSize: 18 },
  textInput: {
    flex: 0,
    minHeight: 44,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0,
    backgroundColor: "rgba(0, 31, 111, 0.14)",
  },
  textInputActive: { backgroundColor: "rgba(33, 44, 77, 0.25)" },
  sectionTitle: { color: "#FFFFFF", fontFamily: Fonts.bold, fontSize: 19 },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  rowTitle: { flex: 1 },
  description: {
    color: "#E0E3EE",
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 22,
  },
  status: { color: "#E0E3EE", fontFamily: Fonts.regular, fontSize: 12 },
  action: { justifyContent: "center", minHeight: 44, paddingVertical: 10 },
  editText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: Fonts.regular,
    textDecorationLine: "underline",
  },
  error: { color: "#FFE0E7", fontFamily: Fonts.regular, fontSize: 13 },
  bgmContainer: { gap: 8 },
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
  panel: {
    position: "relative",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 20,
  },
});

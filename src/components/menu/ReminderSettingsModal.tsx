import DateTimePicker from "@react-native-community/datetimepicker";
import { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors, Fonts } from "@/src/constants/theme";
import {
  MAX_USER_NAME_LENGTH,
  type NotificationTime,
} from "@/src/domain/reminder";

type Props = {
  onClose: () => void;
} & (
  | { mode: "userName"; initialValue: string; onSave: (userName: string) => Promise<void> }
  | { mode: "time"; initialValue: NotificationTime; onSave: (time: NotificationTime) => Promise<void> }
);

export default function ReminderSettingsModal(props: Props) {
  const insets = useSafeAreaInsets();
  const [userName, setUserName] = useState(props.mode === "userName" ? props.initialValue : "");
  const [time, setTime] = useState(() => {
    const value = new Date();
    if (props.mode === "time") {
      value.setHours(props.initialValue.notificationHour, props.initialValue.notificationMinute, 0, 0);
    }
    return value;
  });
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);
  const title = props.mode === "userName" ? "ユーザー名を編集" : "通知時刻を編集";
  const saveDisabled = isSaving || (props.mode === "time" && Platform.OS !== "ios");

  const handleSave = async () => {
    if (savingRef.current || (props.mode === "time" && Platform.OS !== "ios")) return;

    if (props.mode === "userName") {
      if (!userName.trim()) {
        setError("ユーザー名を入力してください。");
        return;
      }
      if ([...userName.trim()].length > MAX_USER_NAME_LENGTH) {
        setError(`ユーザー名は${MAX_USER_NAME_LENGTH}文字以内で入力してください。`);
        return;
      }
    }

    savingRef.current = true;
    setError(null);
    setIsSaving(true);
    try {
      if (props.mode === "userName") {
        await props.onSave(userName.trim());
      } else {
        await props.onSave({ notificationHour: time.getHours(), notificationMinute: time.getMinutes() });
      }
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "設定を保存できませんでした。",
      );
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!savingRef.current) props.onClose();
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      accessibilityViewIsModal
    >
      <KeyboardAvoidingView
        style={[
          styles.overlay,
          {
            paddingTop: Math.max(20, insets.top),
            paddingBottom: Math.max(20, insets.bottom),
          },
        ]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.card}
          contentContainerStyle={styles.cardContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          <Text style={styles.description}>
            {props.mode === "userName"
              ? "お知らせに使う名前を設定します。"
              : "毎日、設定した時刻にタイマーのお知らせが届きます。"}
          </Text>
          {props.mode === "userName" ? (
            <>
              <Text style={styles.label}>ユーザー名</Text>
              <TextInput
                value={userName}
                onChangeText={(value) => {
                  setUserName(value);
                  setError(null);
                }}
                placeholder="ゲスト"
                placeholderTextColor={Colors.textSub}
                style={styles.input}
                editable={!isSaving}
                autoCorrect={false}
                returnKeyType="done"
                accessibilityLabel="ユーザー名"
                accessibilityHint={`${MAX_USER_NAME_LENGTH}文字以内で入力してください`}
              />
              <Text style={styles.hint}>{MAX_USER_NAME_LENGTH}文字以内</Text>
            </>
          ) : (
            <View style={styles.timePicker}>
              {Platform.OS === "ios" ? (
                <DateTimePicker
                  value={time}
                  mode="time"
                  display="default"
                  themeVariant="light"
                  minuteInterval={1}
                  disabled={isSaving}
                  onValueChange={(_, selectedTime) => {
                    if (!savingRef.current) {
                      setTime(selectedTime);
                      setError(null);
                    }
                  }}
                  accessibilityLabel="通知時刻"
                />
              ) : (
                <Text style={styles.description}>通知時刻の編集はiPhoneで利用できます。</Text>
              )}
            </View>
          )}
          {error ? (
            <Text style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}
          <TouchableOpacity
            style={[styles.saveButton, saveDisabled && styles.disabled]}
            onPress={() => void handleSave()}
            disabled={saveDisabled}
            accessibilityRole="button"
            accessibilityLabel={props.mode === "userName" ? "ユーザー名を保存" : "通知時刻を保存"}
            accessibilityState={{ disabled: saveDisabled, busy: isSaving }}
          >
            <Text style={styles.saveText}>{isSaving ? "保存中…" : "保存"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleClose}
            style={[styles.cancelButton, isSaving && styles.disabled]}
            disabled={isSaving}
            accessibilityRole="button"
            accessibilityLabel={props.mode === "userName" ? "ユーザー名編集をキャンセル" : "通知時刻編集をキャンセル"}
            accessibilityState={{ disabled: isSaving }}
          >
            <Text style={styles.cancelText}>キャンセル</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  card: {
    flexGrow: 0,
    maxHeight: "100%",
    backgroundColor: Colors.surface,
    borderRadius: 20,
  },
  cardContent: { padding: 24 },
  title: {
    color: Colors.text,
    fontSize: 22,
    fontFamily: Fonts.bold,
    textAlign: "center",
  },
  description: {
    fontFamily: Fonts.regular,
    color: Colors.textSub,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
  },
  label: {
    fontFamily: Fonts.medium,
    color: Colors.text,
    fontSize: 15,
    marginTop: 20,
  },
  input: {
    fontFamily: Fonts.regular,
    borderColor: Colors.border,
    borderRadius: 10,
    borderWidth: 1,
    color: Colors.text,
    fontSize: 17,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
  },
  hint: {
    fontFamily: Fonts.regular,
    color: Colors.textSub,
    fontSize: 12,
    marginTop: 6,
  },
  timePicker: { alignItems: "center", marginTop: 20 },
  error: {
    fontFamily: Fonts.regular,
    color: Colors.warning,
    fontSize: 13,
    marginTop: 12,
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: Colors.accent,
    borderRadius: 28,
    marginTop: 24,
    paddingVertical: 15,
  },
  disabled: { opacity: 0.6 },
  saveText: { color: Colors.surface, fontSize: 17, fontFamily: Fonts.bold },
  cancelButton: { alignItems: "center", marginTop: 12, padding: 12, minHeight: 44 },
  cancelText: { color: Colors.textSub, fontSize: 15, fontFamily: Fonts.medium },
});

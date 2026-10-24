import { useState } from "react";
import { Linking, StyleSheet, Text } from "react-native";

import PrimaryButton from "@/src/components/common/PrimaryButton";
import NativeTimeSetting from "@/src/components/menu/NativeTimeSetting";
import { SettingsCard, SettingsRow } from "@/src/components/menu/SettingsLayout";
import { Fonts } from "@/src/constants/theme";
import { useAppState } from "@/src/state/AppStateProvider";
import { useReminderNotifications } from "@/src/state/ReminderNotificationProvider";

export default function NotificationSettings() {
  const { state, setNotificationTime } = useAppState();
  const {
    status,
    error: notificationError,
    retry,
  } = useReminderNotifications();
  const [actionError, setActionError] = useState<string | null>(null);
  const [isOpeningSettings, setIsOpeningSettings] = useState(false);

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

  return (
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
  );
}

const styles = StyleSheet.create({
  description: {
    color: "#E0E3EE",
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 22,
  },
  error: { color: "#FFE0E7", fontFamily: Fonts.regular, fontSize: 13 },
});

import { useBottomTabBarHeight } from "expo-router/js-tabs";
import { useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PrimaryButton from "@/src/components/common/PrimaryButton";
import ScreenBackground from "@/src/components/common/ScreenBackground";
import BgmToggle from "@/src/components/home/BgmToggle";
import TaskNameModal from "@/src/components/home/TaskNameModal";
import ReminderSettingsModal from "@/src/components/menu/ReminderSettingsModal";
import { Colors, Fonts } from "@/src/constants/theme";
import { useAppState } from "@/src/state/AppStateProvider";
import { useReminderNotifications } from "@/src/state/ReminderNotificationProvider";

export default function MenuScreen() {
  const { top } = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { state, setTaskName, setUserName, setNotificationTime } =
    useAppState();
  const {
    status,
    error: notificationError,
    retry,
  } = useReminderNotifications();
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editingReminder, setEditingReminder] = useState<
    "userName" | "time" | null
  >(null);
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
    <View style={{ flex: 1 }}>
      <ScreenBackground source={require("@/assets/bg/starry-bg.png")} />
      <ScrollView
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
        <View style={styles.panel}>
          <BgmToggle />
        </View>
        <View style={[styles.panel, styles.taskPanel]}>
          <Text style={styles.label}>集中するタスク</Text>
          <Text style={styles.taskName}>{state.taskName || "未設定"}</Text>
          <PrimaryButton
            title="タスク名を編集"
            onPress={() => setIsEditingTask(true)}
          />
        </View>
        <View style={[styles.panel, styles.reminderPanel]}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            ユーザー名
          </Text>
          <Text style={styles.savedName}>{state.userName}</Text>
          <PrimaryButton
            title="ユーザー名を編集"
            onPress={() => setEditingReminder("userName")}
          />
        </View>
        <View style={[styles.panel, styles.reminderPanel]}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            通知設定
          </Text>
          <Text style={styles.reminderTime}>
            時刻　 {String(state.notificationHour).padStart(2, "0")}:
            {String(state.notificationMinute).padStart(2, "0")}
          </Text>
          <PrimaryButton
            title="通知時刻を編集"
            onPress={() => setEditingReminder("time")}
          />
          <Text
            style={styles.notificationStatus}
            accessibilityLiveRegion="polite"
          >
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
        </View>
        <TaskNameModal
          visible={isEditingTask}
          initialValue={state.taskName}
          onClose={() => setIsEditingTask(false)}
          onSave={async (taskName) => {
            await setTaskName(taskName);
            setIsEditingTask(false);
          }}
        />
        {editingReminder === "userName" ? (
          <ReminderSettingsModal
            mode="userName"
            initialValue={state.userName}
            onClose={() => setEditingReminder(null)}
            onSave={async (userName) => {
              await setUserName(userName);
              setEditingReminder(null);
            }}
          />
        ) : null}
        {editingReminder === "time" ? (
          <ReminderSettingsModal
            mode="time"
            initialValue={{
              notificationHour: state.notificationHour,
              notificationMinute: state.notificationMinute,
            }}
            onClose={() => setEditingReminder(null)}
            onSave={async (time) => {
              await setNotificationTime(time);
              setEditingReminder(null);
            }}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 24 },
  title: { color: "#FFFFFF", fontFamily: Fonts.bold, fontSize: 24 },
  label: { color: Colors.textSub, fontFamily: Fonts.regular, fontSize: 14 },
  taskName: { color: Colors.text, fontFamily: Fonts.medium, fontSize: 20 },
  taskPanel: { paddingTop: 20, gap: 12 },
  reminderPanel: { paddingTop: 20, gap: 12 },
  sectionTitle: { color: Colors.text, fontFamily: Fonts.bold, fontSize: 19 },
  savedName: { color: Colors.text, fontFamily: Fonts.medium, fontSize: 18 },
  reminderTime: { color: Colors.text, fontFamily: Fonts.bold, fontSize: 20 },
  notificationBody: {
    color: Colors.text,
    fontFamily: Fonts.regular,
    fontSize: 15,
    lineHeight: 24,
  },
  notificationStatus: {
    color: Colors.textSub,
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 22,
  },
  error: { color: Colors.warning, fontFamily: Fonts.regular, fontSize: 13 },
  panel: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 2,
    paddingBottom: 20,
  },
});

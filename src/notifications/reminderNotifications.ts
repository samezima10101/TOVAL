import { AppState as NativeAppState, Platform } from "react-native";

import {
  isValidNotificationTime,
  type ReminderSettings,
} from "@/src/domain/reminder";

export type ReminderNotificationStatus =
  | "loading"
  | "scheduled"
  | "permission-required"
  | "denied"
  | "unsupported"
  | "error";

export type ReminderSyncStatus = Exclude<
  ReminderNotificationStatus,
  "loading" | "error"
>;

// Reusing the identifier replaces the pending iOS request, including after a
// restart. Do not cancel before replacing: a failed update retains the old one.
const REMINDER_NOTIFICATION_ID = "myjune-daily-timer-reminder";
let handlerInstalled = false;

export async function syncReminderNotifications(
  settings: ReminderSettings,
  requestPermission: boolean,
): Promise<ReminderSyncStatus> {
  if (Platform.OS !== "ios") return "unsupported";
  if (
    !settings.userName.trim() ||
    !isValidNotificationTime(
      settings.notificationHour,
      settings.notificationMinute,
    )
  ) {
    throw new Error("通知の設定が正しくありません。");
  }

  // Load inside the operation so an outdated development build can show a
  // recoverable notification error without blocking the rest of the app.
  const Notifications = await import("expo-notifications");
  if (!handlerInstalled) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    handlerInstalled = true;
  }

  let permission = await Notifications.getPermissionsAsync();
  if (
    requestPermission &&
    NativeAppState.currentState === "active" &&
    permission.canAskAgain &&
    permission.ios?.status ===
      Notifications.IosAuthorizationStatus.NOT_DETERMINED
  ) {
    permission = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowSound: true, allowBadge: false },
    });
  }

  const authorization = permission.ios?.status;
  const allowed =
    authorization === Notifications.IosAuthorizationStatus.AUTHORIZED ||
    authorization === Notifications.IosAuthorizationStatus.PROVISIONAL ||
    authorization === Notifications.IosAuthorizationStatus.EPHEMERAL;
  if (!allowed) {
    await Notifications.cancelScheduledNotificationAsync(
      REMINDER_NOTIFICATION_ID,
    );
    return authorization ===
      Notifications.IosAuthorizationStatus.NOT_DETERMINED &&
      permission.canAskAgain
      ? "permission-required"
      : "denied";
  }

  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_NOTIFICATION_ID,
    content: {
      title: "MyJune",
      body: `${settings.userName}～　来て～`,
      sound: "default",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour: settings.notificationHour,
      minute: settings.notificationMinute,
      second: 0,
      repeats: true,
    },
  });
  return "scheduled";
}

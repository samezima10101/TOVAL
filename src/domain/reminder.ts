export const DEFAULT_USER_NAME = "ゲスト";
export const DEFAULT_NOTIFICATION_HOUR = 21;
export const DEFAULT_NOTIFICATION_MINUTE = 30;
export const MAX_USER_NAME_LENGTH = 40;

export type ReminderSettings = {
  userName: string;
  notificationHour: number;
  notificationMinute: number;
};

export type NotificationTime = Pick<ReminderSettings, "notificationHour" | "notificationMinute">;

export function isValidNotificationTime(hour: unknown, minute: unknown): boolean {
  return typeof hour === "number" && Number.isInteger(hour) && hour >= 0 && hour <= 23 &&
    typeof minute === "number" && Number.isInteger(minute) && minute >= 0 && minute <= 59;
}

export function normalizeReminderSettings(settings: ReminderSettings): ReminderSettings {
  const userName = settings.userName.trim();
  if (!userName) {
    throw new Error("ユーザー名を入力してください。");
  }
  if (Array.from(userName).length > MAX_USER_NAME_LENGTH) {
    throw new RangeError(`ユーザー名は${MAX_USER_NAME_LENGTH}文字以内で入力してください。`);
  }
  if (!isValidNotificationTime(settings.notificationHour, settings.notificationMinute)) {
    throw new RangeError("通知時間は0:00から23:59の間で設定してください。");
  }
  return {
    userName,
    notificationHour: settings.notificationHour,
    notificationMinute: settings.notificationMinute,
  };
}

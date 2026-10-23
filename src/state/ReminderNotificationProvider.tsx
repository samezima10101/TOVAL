import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState as NativeAppState } from "react-native";

import {
  type ReminderNotificationStatus,
  syncReminderNotifications,
} from "@/src/notifications/reminderNotifications";
import { useAppState } from "@/src/state/AppStateProvider";

type ReminderNotificationContextValue = {
  status: ReminderNotificationStatus;
  error: string | null;
  retry: () => Promise<void>;
};

const ReminderNotificationContext = createContext<ReminderNotificationContextValue | null>(null);

export function ReminderNotificationProvider({ children }: { children: ReactNode }) {
  const { state, status: hydrationStatus } = useAppState();
  const userName = state?.userName;
  const notificationHour = state?.notificationHour;
  const notificationMinute = state?.notificationMinute;
  const [result, setResult] = useState<{
    status: ReminderNotificationStatus;
    error: string | null;
  }>({ status: "loading", error: null });
  const queue = useRef<Promise<void>>(Promise.resolve());
  const revision = useRef(0);
  const initialPermissionPending = useRef(true);

  const reconcile = useCallback((requestPermission: boolean): Promise<void> => {
    const requestedRevision = ++revision.current;
    const apply = async () => {
      if (requestedRevision !== revision.current || hydrationStatus !== "ready" ||
          userName === undefined || notificationHour === undefined || notificationMinute === undefined) return;
      setResult({ status: "loading", error: null });
      try {
        // A save can finish just after locking the phone. Update an authorized
        // request then too; only the permission prompt needs an active app.
        const shouldRequest = (requestPermission || initialPermissionPending.current) &&
          NativeAppState.currentState === "active";
        if (shouldRequest) initialPermissionPending.current = false;
        const status = await syncReminderNotifications(
          { userName, notificationHour, notificationMinute },
          shouldRequest,
        );
        if (requestedRevision === revision.current) setResult({ status, error: null });
      } catch (cause) {
        console.warn("Daily reminder scheduling failed", cause);
        if (requestedRevision === revision.current) {
          setResult({
            status: "error",
            error: "通知を設定できませんでした。保存した名前・時刻で再試行できます。更新前の通知が残っている場合があります。",
          });
        }
      }
    };
    // Settings changes, OS permission prompts and foreground events may overlap.
    // Serialize native writes; the last saved settings always run last.
    queue.current = queue.current.then(apply, apply);
    return queue.current;
  }, [hydrationStatus, notificationHour, notificationMinute, userName]);

  useEffect(() => {
    void reconcile(false);
    const subscription = NativeAppState.addEventListener("change", (next) => {
      if (next === "active") void reconcile(false);
    });
    return () => {
      revision.current += 1;
      subscription.remove();
    };
  }, [reconcile]);

  const retry = useCallback(() => reconcile(true), [reconcile]);
  const value = useMemo(() => ({ ...result, retry }), [result, retry]);

  return (
    <ReminderNotificationContext.Provider value={value}>
      {children}
    </ReminderNotificationContext.Provider>
  );
}

export function useReminderNotifications() {
  const context = useContext(ReminderNotificationContext);
  if (!context) throw new Error("ReminderNotificationProvider is required.");
  return context;
}

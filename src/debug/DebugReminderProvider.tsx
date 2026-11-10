import type { PropsWithChildren } from "react";

import { ReminderNotificationProvider } from "@/src/state/ReminderNotificationProvider";
import { useDebugSession } from "./DebugSession";

export default function DebugReminderProvider({ children }: PropsWithChildren) {
  const { sandbox } = useDebugSession();
  return <ReminderNotificationProvider suspended={sandbox}>{children}</ReminderNotificationProvider>;
}

import { useEffect, useState } from "react";
import { AppState } from "react-native";

import { todayKey } from "@/src/domain/common/date";

/** Refresh at local midnight, on foregrounding, and after a clock/timezone change. */
export default function useLocalToday(): string {
  const [today, setToday] = useState(() => todayKey());
  useEffect(() => {
    let midnight: ReturnType<typeof setTimeout>;
    const refresh = () => {
      setToday(todayKey());
      clearTimeout(midnight);
      const now = new Date();
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      midnight = setTimeout(refresh, Math.max(1, next.getTime() - now.getTime()));
    };
    // Reconcile time since the render, then keep listening while home is mounted.
    refresh();
    const clockCheck = setInterval(refresh, 30_000);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => {
      clearTimeout(midnight);
      clearInterval(clockCheck);
      subscription.remove();
    };
  }, []);
  return today;
}

import React from "react";
import { AppState as NativeAppState } from "react-native";

export default function useTimerTick() {
  const [now, setNow] = React.useState(Date.now);

  React.useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    const subscription = NativeAppState.addEventListener(
      "change",
      (nextState) => {
        if (nextState === "active") {
          setNow(Date.now());
        }
      },
    );

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  return now;
}

import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

export default function useTutorialReducedMotion() {
  const [reduceMotion, setReduceMotion] = useState(true);
  useEffect(() => {
    let active = true;
    let changed = false;
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (enabled) => {
        changed = true;
        if (active) setReduceMotion(enabled);
      },
    );
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (active && !changed) setReduceMotion(enabled);
      })
      .catch(() => undefined);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  return reduceMotion;
}

import {
  useEffect,
  useLayoutEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { AccessibilityInfo, Animated, type StyleProp, type ViewStyle } from "react-native";

// Keep the entire box mounted and readable during step transitions.
export default function TutorialTransition({
  contentKey,
  style,
  children,
}: PropsWithChildren<{ contentKey: string; style?: StyleProp<ViewStyle> }>) {
  const [progress] = useState(() => new Animated.Value(1));
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

  useLayoutEffect(() => {
    progress.setValue(reduceMotion ? 1 : 0);
    if (reduceMotion) return;
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 140,
      useNativeDriver: true,
      isInteraction: false,
    });
    animation.start();
    return () => animation.stop();
  }, [contentKey, progress, reduceMotion]);

  return (
    <Animated.View
      style={[style, {
        opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] }),
        transform: [{
          translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [4, 0] }),
        }],
      }]}
    >
      {children}
    </Animated.View>
  );
}

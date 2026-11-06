import {
  useLayoutEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { Animated, type StyleProp, type ViewStyle } from "react-native";
import useTutorialReducedMotion from "./useTutorialReducedMotion";

// Keep the entire box mounted and readable during step transitions.
export default function TutorialTransition({
  contentKey,
  style,
  children,
}: PropsWithChildren<{ contentKey: string; style?: StyleProp<ViewStyle> }>) {
  const [progress] = useState(() => new Animated.Value(1));
  const reduceMotion = useTutorialReducedMotion();

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

import { useEffect, useLayoutEffect, useState, type PropsWithChildren } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export type Spotlight = {
  key: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

// Block everything except the current action's measured native control.
export function CoachMark({
  spot,
  interactive = false,
  fullScreen = false,
}: {
  spot: Spotlight | null;
  interactive?: boolean;
  fullScreen?: boolean;
}) {
  const [opacity] = useState(() => new Animated.Value(1));
  const reduceMotion = useTutorialReducedMotion();
  const targetKey = spot?.key;
  useEffect(() => {
    opacity.setValue(1);
    if (!interactive || !targetKey || reduceMotion) return;
    const timing = (toValue: number) =>
      Animated.timing(opacity, {
        toValue,
        duration: 800,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
        isInteraction: false,
      });
    const animation = Animated.loop(
      Animated.sequence([timing(0.25), timing(1)]),
    );
    animation.start();
    return () => animation.stop();
  }, [interactive, targetKey, reduceMotion, opacity]);

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="box-none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {spot ? (
        <>
          <View
            style={[styles.dim, { top: 0, left: 0, right: 0, height: spot.y }]}
          />
          <View
            style={[
              styles.dim,
              { top: spot.y, left: 0, width: spot.x, height: spot.height },
            ]}
          />
          <View
            style={[
              styles.dim,
              {
                top: spot.y,
                left: spot.x + spot.width,
                right: 0,
                height: spot.height,
              },
            ]}
          />
          <View
            style={[
              styles.dim,
              { top: spot.y + spot.height, left: 0, right: 0, bottom: 0 },
            ]}
          />
          {!interactive ? (
            <View
              style={{
                position: "absolute",
                top: spot.y,
                left: spot.x,
                width: spot.width,
                height: spot.height,
              }}
            />
          ) : null}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.outline,
              {
                opacity,
                top: spot.y,
                left: spot.x,
                width: spot.width,
                height: spot.height,
              },
            ]}
          />
        </>
      ) : (
        <View style={[StyleSheet.absoluteFill, !fullScreen && styles.dim]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dim: { position: "absolute", backgroundColor: "rgba(3, 13, 31, 0.65)" },
  outline: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "#BDF9F5",
    borderRadius: 10,
  },
});

// Keep the entire box mounted and readable during step transitions.
export function TutorialTransition({
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

function useTutorialReducedMotion() {
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

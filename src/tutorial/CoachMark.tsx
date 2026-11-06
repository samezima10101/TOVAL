import { useEffect, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import useTutorialReducedMotion from "./useTutorialReducedMotion";

export type Spotlight = {
  key: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

// Block everything except the current action's measured native control.
export default function CoachMark({
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
              interactive && styles.actionOutline,
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
  actionOutline: { borderColor: "#BDF9F5" },
});

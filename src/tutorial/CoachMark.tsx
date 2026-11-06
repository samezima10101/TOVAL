import { StyleSheet, View } from "react-native";

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
}: {
  spot: Spotlight | null;
  interactive?: boolean;
}) {
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
          <View
            pointerEvents="none"
            style={[
              styles.outline,
              {
                top: spot.y,
                left: spot.x,
                width: spot.width,
                height: spot.height,
              },
            ]}
          />
        </>
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.dim]} />
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

import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

export const STORY_WINDOW_HEADER_HEIGHT = 24;

export default function StoryWindowBackground({
  variant,
}: {
  variant: "broadcast" | "dialogue";
}) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const { width, height } = size;
  const inset = 0.6;
  const cut = Math.min(12, width / 4, height / 4);
  const bottomCut = Math.min(14, width / 4, height / 4);
  const outline = `M${inset} ${cut} L${cut} ${inset} H${width - inset} V${height - bottomCut} L${width - bottomCut} ${height - inset} H${inset} Z`;

  if (variant === "broadcast") {
    return (
      <View style={[StyleSheet.absoluteFill, styles.broadcastFrame]} pointerEvents="none" accessible={false}>
        <View style={styles.broadcastHeader} />
      </View>
    );
  }

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      accessible={false}
      onLayout={({ nativeEvent: { layout } }) => setSize((previous) =>
        previous.width === layout.width && previous.height === layout.height
          ? previous
          : { width: layout.width, height: layout.height })}
    >
      {width > 0 && height > 0 ? (
        <Svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} accessible={false}>
          <Path
            d={outline}
            fill="rgba(22, 43, 76, 0.65)"
            stroke="#AFC4E5"
            strokeOpacity={0.85}
            strokeWidth={1.2}
          />
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  broadcastFrame: {
    borderWidth: 1.5,
    borderColor: "#AFC4E5",
  },
  broadcastHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: STORY_WINDOW_HEADER_HEIGHT - 1.5,
    backgroundColor: "#152B4F",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(238, 213, 227, 0.55)",
  },
});

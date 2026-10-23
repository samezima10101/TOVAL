import { useId, useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from "react-native";
import Svg, { ClipPath, Defs, LinearGradient, Path, Stop } from "react-native-svg";

type FileTextboxBackgroundProps = {
  style?: StyleProp<ViewStyle>;
};

// Geometry and colors from assets/images/file_textbox.svg (340 x 184).
// Keep the tab/chamfers in points; only the right and bottom edges move.
const TAB_WIDTH = 93;
const TAB_TOP_WIDTH = 80.6504;
const TAB_HEIGHT = 19;
const TOP_CUT_WIDTH = 17.853;
const TOP_CUT_HEIGHT = 15.7969;
const BOTTOM_CUT_WIDTH = 13.67;
const BOTTOM_CUT_HEIGHT = 10.623;

export default function FileTextboxBackground({ style }: FileTextboxBackgroundProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const clipId = `fileTextboxClip${id}`;
  const gradientId = `fileTextboxGradient${id}`;
  const onLayout = ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    setSize((previous) =>
      previous.width === layout.width && previous.height === layout.height
        ? previous
        : { width: layout.width, height: layout.height },
    );
  };

  // Very small frames shrink all ornaments uniformly so they cannot overlap.
  const scale = Math.min(1, size.width / 120, size.height / 56);
  const width = scale > 0 ? size.width / scale : 0;
  const height = scale > 0 ? size.height / scale : 0;
  const outline = [
    `M${TAB_WIDTH} ${TAB_HEIGHT}`,
    `H${width - TOP_CUT_WIDTH}`,
    `L${width} ${TAB_HEIGHT + TOP_CUT_HEIGHT}`,
    `V${height - BOTTOM_CUT_HEIGHT}`,
    `L${width - BOTTOM_CUT_WIDTH} ${height}`,
    `H0 V0 H${TAB_TOP_WIDTH} Z`,
  ].join(" ");

  return (
    <View
      onLayout={onLayout}
      style={[StyleSheet.absoluteFill, style]}
      pointerEvents="none"
      accessible={false}
    >
      {scale > 0 ? (
        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${width} ${height}`}
          accessible={false}
        >
          <Defs>
            <ClipPath id={clipId}>
              <Path d={outline} />
            </ClipPath>
            <LinearGradient
              id={gradientId}
              x1={width - 75.474}
              y1={-4.03188}
              x2={width - 84.994}
              y2={52.7531}
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset={0.336538} stopColor="#CFCFCF" />
              <Stop offset={0.490385} stopColor="#FFFFFF" />
              <Stop offset={0.649038} stopColor="#CFCFCF" />
            </LinearGradient>
          </Defs>
          <Path d={outline} fill={`url(#${gradientId})`} fillOpacity={0.38} />
          <Path
            d={outline}
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity={0.49}
            strokeWidth={2}
            clipPath={`url(#${clipId})`}
          />
        </Svg>
      ) : null}
    </View>
  );
}

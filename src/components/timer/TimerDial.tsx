import { StyleSheet, View } from "react-native";
import Svg, { Circle, G, Path, Text as SvgText } from "react-native-svg";

import { Fonts } from "@/src/constants/theme";

type TimerDialProps = {
  progress: number;
  timerText: string;
  accessibilityLabel: string;
};

const CENTER = 180;
const RADIUS = 126;

export default function TimerDial({
  progress,
  timerText,
  accessibilityLabel,
}: TimerDialProps) {
  const remaining = Number.isFinite(progress)
    ? Math.min(1, Math.max(0, progress))
    : 0;
  const startAngle = -Math.PI / 2 + Math.PI * 2 * (1 - remaining);
  const startX = CENTER + RADIUS * Math.cos(startAngle);
  const startY = CENTER + RADIUS * Math.sin(startAngle);
  const arc = `M ${startX} ${startY} A ${RADIUS} ${RADIUS} 0 ${remaining > 0.5 ? 1 : 0} 1 ${CENTER} ${CENTER - RADIUS}`;
  const fontSize = 96 * Math.min(1, 8 / timerText.length);

  return (
    <View
      style={styles.dial}
      accessible
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel}
      pointerEvents="none"
    >
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 360 360"
        preserveAspectRatio="xMidYMid meet"
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {remaining > 0 ? (
          <G fill="none" strokeLinecap="round">
            {remaining === 1 ? (
              <>
                <Circle
                  cx={CENTER}
                  cy={CENTER}
                  r={RADIUS}
                  stroke="#D8E2F8"
                  strokeWidth={34}
                />
                <Circle
                  cx={CENTER}
                  cy={CENTER}
                  r={RADIUS}
                  stroke="#4A80E8"
                  strokeWidth={32}
                />
              </>
            ) : (
              <>
                <Path d={arc} stroke="#D8E2F8" strokeWidth={34} />
                <Path d={arc} stroke="#4A80E8" strokeWidth={32} />
              </>
            )}
          </G>
        ) : null}
        <G
          fontFamily={Fonts.timer}
          fontSize={fontSize}
          textAnchor="middle"
        >
          <SvgText
            x={CENTER}
            y={CENTER}
            alignmentBaseline="central"
            fill="#D9DDE2"
            stroke="#D9DDE2"
            strokeWidth={5}
            strokeLinejoin="round"
          >
            {timerText}
          </SvgText>
          <SvgText
            x={CENTER}
            y={CENTER}
            alignmentBaseline="central"
            fill="#303236"
          >
            {timerText}
          </SvgText>
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  dial: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 400,
    aspectRatio: 1,
    maxHeight: "100%",
    flexShrink: 1,
  },
});

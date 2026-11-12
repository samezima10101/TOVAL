import { Image } from "expo-image";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";

// Coordinates in cockpit-bg.png (941 × 1672), before ScreenBackground's cover crop.
const BACKGROUND = { width: 941, height: 1672 };
const SAMPLE_MONITOR = { x: 0, y: 1100, width: 191, height: 248 };

export default function HomeShopEntrance({ onPress, disabled }: {
  onPress: () => void;
  disabled: boolean;
}) {
  const { width, height } = useWindowDimensions();
  const scale = Math.max(width / BACKGROUND.width, height / BACKGROUND.height);
  const offsetX = (width - BACKGROUND.width * scale) / 2;
  const offsetY = (height - BACKGROUND.height * scale) / 2;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Pressable
        style={({ pressed }) => [{
          position: "absolute",
          left: offsetX + SAMPLE_MONITOR.x * scale,
          top: offsetY + SAMPLE_MONITOR.y * scale,
          width: SAMPLE_MONITOR.width * scale,
          height: SAMPLE_MONITOR.height * scale,
          opacity: pressed ? 0.7 : 1,
        }]}
        hitSlop={16}
        disabled={disabled}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="ショップを開く"
        accessibilityState={{ disabled }}
      >
        <Image
          source={require("@/assets/bg/sample_monitor.png")}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
          pointerEvents="none"
          accessible={false}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill },
});

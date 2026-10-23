import { Colors, Fonts } from "@/src/constants/theme";
import { Image } from "expo-image";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  type ViewStyle,
} from "react-native";

export default function PrimaryButton({
  title,
  onPress,
  style,
  disabled = false,
  loading = false,
  accessibilityLabel,
  maxFontSizeMultiplier,
}: {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  maxFontSizeMultiplier?: number;
}) {
  const unavailable = disabled || loading;
  return (
    <TouchableOpacity
      style={[styles.button, style, unavailable && styles.disabled]}
      onPress={onPress}
      disabled={unavailable}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: unavailable, busy: loading }}
    >
      <Image
        source={require("@/assets/images/hex_button.svg")}
        style={StyleSheet.absoluteFill}
        contentFit="fill"
        pointerEvents="none"
        accessible={false}
      />
      <Text
        style={[styles.text, loading && styles.loadingText]}
        maxFontSizeMultiplier={maxFontSizeMultiplier}
      >
        {title}
      </Text>
      {loading ? <ActivityIndicator color={Colors.surface} style={StyleSheet.absoluteFill} /> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    alignSelf: "center",
    justifyContent: "center",
    width: 222,
    maxWidth: "100%",
    minHeight: 65,
    paddingHorizontal: 28,
    paddingVertical: 16,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: Colors.surface,
    fontSize: 18,
    fontFamily: Fonts.bold,
    letterSpacing: 2,
    lineHeight: 26,
    textAlign: "center",
  },
  loadingText: { opacity: 0 },
});

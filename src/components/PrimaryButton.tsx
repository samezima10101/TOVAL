import { Colors } from "@/src/constants/theme";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    ViewStyle,
} from "react-native";

export default function PrimaryButton({
  title,
  onPress,
  style,
  disabled = false,
  loading = false,
  accessibilityLabel,
}: {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
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
      {loading ? (
        <ActivityIndicator color={Colors.surface} />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: Colors.accent,
    borderRadius: 30,
    elevation: 3,
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: Colors.surface,
    fontSize: 18,
    fontWeight: "bold",
  },
});

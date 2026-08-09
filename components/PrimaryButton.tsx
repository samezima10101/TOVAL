import { Colors } from "@/constants/theme";
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from "react-native";

export default function PrimaryButton({
  title,
  onPress,
  style,
}: {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
}) {
  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      activeOpacity={0.8} // 押した時の「へこみ具合」
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.accent, // テーマのアクセントカラー（緑）
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    // ふんわりとした影をつける
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  text: {
    color: Colors.surface,
    fontSize: 18,
    fontWeight: "bold",
  },
});

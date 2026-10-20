import { Colors, Fonts } from "@/src/constants/theme";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

export default function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.backButton}
      accessibilityRole="button"
      accessibilityLabel="戻る"
    >
      <Text style={styles.backText}>戻る</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backButton: {
    paddingRight: 10,
    paddingVertical: 8,
  },
  backText: {
    color: Colors.textSub,
    fontSize: 15,
    fontFamily: Fonts.bold,
  },
});

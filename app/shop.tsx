import { Colors } from "@/src/constants/theme";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ShopScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>立ち入り禁止</Text>
      <TouchableOpacity
        onPress={() => router.dismissTo("/")}
        style={styles.backButton}
        accessibilityRole="button"
        accessibilityLabel="ホームへ戻る"
      >
        <Text style={styles.backText}>＜ ホーム</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "red",
    marginBottom: 20,
  },
  backButton: {
    paddingRight: 10,
    paddingVertical: 8,
  },
  backText: {
    color: Colors.textSub,
    fontSize: 15,
    fontWeight: "700",
  },
});

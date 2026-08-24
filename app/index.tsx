import PrimaryButton from "@/components/PrimaryButton";
import { Colors } from "@/constants/theme";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const theme = Colors;
  const task = "英単語覚える";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={styles.main}>
        <Text style={[styles.subText, { color: theme.textSub }]}>TASK</Text>
        <Text style={[styles.taskName, { color: theme.primary }]}>{task}</Text>
      </View>
      <View style={styles.footer}>
        <PrimaryButton
          title="集中モードを開始"
          onPress={() => router.push("/timer")}
          style={{
            width: "60%",
          }}
        />
        <TouchableOpacity onPress={() => router.push("/memory")}>
          <Text style={[styles.footerLink, { color: theme.textSub }]}>
            📖 Memory
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/log")}>
          <Text style={[styles.footerLink, { color: theme.textSub }]}>
            📅 Log
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// 💅 既存のスタイル（※元のコードに合わせて適宜残してください）
const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  pointBadge: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: "flex-start",
  },
  pointText: {
    fontWeight: "bold",
    color: "#333333",
  },
  main: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  subText: {
    fontSize: 16,
    marginBottom: 8,
  },
  taskName: {
    fontSize: 28,
    fontWeight: "bold",
  },
  footer: {
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
  },
  footerLink: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 15,
  },
});

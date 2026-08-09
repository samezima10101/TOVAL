import { Colors } from "@/constants/theme";
import { router } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MemoryScreen() {
  const theme = Colors;
  const memoryList = [
    {
      id: 1,
      displayTitle: "Episode 1",
      displayDate: "2024-06-01",
      isUnlocked: true,
    },
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* ヘッダー部分 */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => router.replace("/")}
          style={styles.backButton}
        >
          <Text style={[styles.backText, { color: theme.textSub }]}>
            ＜ ホーム
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          メモリー
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* エピソード一覧 */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {memoryList.map((item) => (
          <View
            key={item.id}
            style={[
              styles.card,
              {
                backgroundColor: theme.surface,
                borderColor: item.isUnlocked ? theme.primary : theme.border,
                opacity: item.isUnlocked ? 1.0 : 0.6,
              },
            ]}
          >
            {/* 左側：テキスト情報 */}
            <View style={styles.cardContent}>
              <Text
                style={[
                  styles.episodeNum,
                  { color: item.isUnlocked ? theme.primary : theme.textSub },
                ]}
              >
                Episode {String(item.id).padStart(2, "0")}
              </Text>
              <Text
                style={[
                  styles.episodeTitle,
                  { color: item.isUnlocked ? theme.text : theme.textSub },
                ]}
              >
                {item.displayTitle}
              </Text>
              <Text style={[styles.unlockDate, { color: theme.textSub }]}>
                解放日: {item.displayDate}
              </Text>
            </View>

            {/* 右側：再生ボタン */}
            <TouchableOpacity
              style={[
                styles.playButton,
                {
                  backgroundColor: item.isUnlocked
                    ? theme.primary
                    : theme.border,
                },
              ]}
              disabled={!item.isUnlocked}
              onPress={() => {
                router.push("/story");
              }}
            >
              <Text
                style={[
                  styles.playButtonText,
                  { color: item.isUnlocked ? "#FFFFFF" : theme.textSub },
                ]}
              >
                {item.isUnlocked ? "▶ 再生" : "🔒"}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// 💅 スタイルシート（変更なしですがそのまま残します）
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  backButton: { paddingVertical: 10, paddingRight: 10 },
  backText: { fontSize: 16, fontWeight: "bold" },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  headerSpacer: { width: 60 },
  scrollContainer: { padding: 20, paddingBottom: 40 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderRadius: 12,
  },
  cardContent: { flex: 1, paddingRight: 15 },
  episodeNum: { fontSize: 14, fontWeight: "bold", marginBottom: 4 },
  episodeTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 8 },
  unlockDate: { fontSize: 12 },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playButtonText: { fontSize: 14, fontWeight: "bold" },
});

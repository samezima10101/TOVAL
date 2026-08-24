import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar hidden={true} />
      <SafeAreaView style={styles.globalContainer}>
        {/* 🔝 グローバルヘッダー：ポイントゲージ */}
        <View style={styles.globalHeader}>
          <Text style={styles.pointText}>120 NT</Text>
          <View style={styles.gaugeBackground}>
            <View style={[styles.gaugeFill]} />
          </View>
        </View>

        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ title: "ホーム" }} />
          <Stack.Screen name="memory" options={{ title: "メモリー" }} />
          <Stack.Screen name="log" options={{ title: "ログ" }} />
        </Stack>

        {/* ⬇️ グローバルフッター：広告バナー枠 */}
        <View style={styles.adBanner}>
          <Text style={styles.adText}>Habit App (広告スペース)</Text>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  globalContainer: {
    flex: 1,
    backgroundColor: "#1A1A1A", // 画面の隙間が見えないようにダークな色に
  },

  // 🌟 ヘッダー（ポイントゲージ）のスタイル
  globalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#444", // ヘッダーの背景色
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  pointText: {
    color: "#FFD700",
    fontWeight: "bold",
    fontSize: 16,
    marginRight: 15,
  },
  gaugeBackground: {
    flex: 1,
    height: 12,
    backgroundColor: "#444",
    borderRadius: 6,
    overflow: "hidden",
  },
  gaugeFill: {
    height: "100%",
    backgroundColor: "#FFD700",
    borderRadius: 6,
  },

  // 🌟 画面エリア（Stackが入る場所）
  screenContainer: {
    flex: 1,
    backgroundColor: "#000",
  },

  // 🌟 フッター（広告バナー）のスタイル
  adBanner: {
    height: 60, // 💡 一般的なスマホバナー広告（AdMobなど）は高さ50pxが多いです
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#555",
  },
  adText: {
    color: "#888",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
  },
});

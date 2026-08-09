import PrimaryButton from "@/components/PrimaryButton";
import { Colors } from "@/constants/theme";
import { router } from "expo-router";
import {
    ImageBackground,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TimerScreen() {
  const theme = Colors;

  //const { timeString, isOvertime, handleCancel, handleFinish, isReady, isSaving } = useTimerData();

  return (
    <ImageBackground
      source={require("@/assets/bg/bg-timer.jpg")}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>
          {/* ヘッダー部分 */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.replace("/")}
              style={styles.cancelButton}
            >
              <Text style={[styles.cancelText, { color: theme.textSub }]}>
                ✕ キャンセル
              </Text>
            </TouchableOpacity>
          </View>

          {/* メインのタイマー表示 */}
          <View style={styles.timerWrapper}>
            <View style={styles.timeDisplayContainer}>
              {/* 超過時のプラス記号 */}
              <Text style={[styles.overtimeSign, { color: "transparent" }]}>
                +
              </Text>

              <Text style={[styles.timerText, { color: theme.text }]}>
                05:00
              </Text>
            </View>

            <Text style={[styles.statusText, { color: theme.textSub }]}>
              "集中モード実行中..."
            </Text>
          </View>

          {/* 終了ボタン */}
          <View style={styles.footer}>
            <PrimaryButton
              title="ストーリーを読む"
              onPress={() => router.replace("/story")}
              style={{ width: "100%" }}
            />
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: "flex-start",
    marginBottom: 40,
  },
  cancelButton: {
    padding: 10,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  timerWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  taskName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 40,
  },
  timeDisplayContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  overtimeSign: {
    fontSize: 48,
    fontWeight: "bold",
    marginRight: 10,
    marginTop: -10,
  },
  timerText: {
    fontSize: 72,
    fontWeight: "bold",
    fontVariant: ["tabular-nums"],
  },
  statusText: {
    fontSize: 16,
    marginTop: 20,
    fontWeight: "bold",
  },
  footer: {
    paddingBottom: 20,
  },
});

import { Colors } from "@/constants/theme";
import { router } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const gemImage = require("@/assets/faces/G01-1-dot.png");
const altaImage = require("@/assets/faces/A01-1.png");
const speaker = "ジェム";
const text = "おつかれ～ 今日も頑張ったね";

export default function StoryScreen() {
  const theme = Colors;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* 1. ヘッダー（閉じるボタン） */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace("/")}
          style={styles.closeButton}
        >
          <Text style={[styles.closeText, { color: theme.textSub }]}>戻る</Text>
        </TouchableOpacity>
      </View>
      {/* 2. キャラクター画像表示エリア */}
      <View style={styles.charactersContainer}>
        {/* 左のキャラクター（上司） */}
        <Image
          source={gemImage}
          style={[styles.characterImage]}
          resizeMode="contain"
        />
        {/* 右のキャラクター（部下） */}
        <Image
          source={altaImage}
          style={[styles.characterImage]}
          resizeMode="contain"
        />
      </View>

      {/* 3. メッセージウィンドウ（タップで次へ） */}
      <View style={{ alignItems: "center" }}>
        <TouchableOpacity
          activeOpacity={1}
          style={[
            styles.messageBox,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
          onPress={() => router.replace("/")}
        >
          <Text style={[styles.speakerName, { color: theme.primary }]}>
            {speaker}
          </Text>
          <Text style={[styles.messageText, { color: theme.text }]}>
            {text}
          </Text>
          <Text style={[styles.tapPrompt, { color: theme.textSub }]}>
            Tap to next ▼
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// 💅 スタイルシート（以前と同じですがそのまま残します）
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    alignItems: "flex-start",
  },
  closeButton: {
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 20,
  },
  closeText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  charactersContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
  },
  characterImage: {
    width: "45%",
    height: "120%",
    marginHorizontal: -10,
    marginBottom: -20,
  },
  messageBox: {
    height: 120,
    width: 500,
    margin: 20,
    padding: 20,
    paddingLeft: 40,
    borderWidth: 2,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    marginBottom: 20,
    marginTop: -40,
    opacity: 0.9,
  },
  speakerName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
    marginTop: -10,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 28,
  },
  tapPrompt: {
    position: "absolute",
    bottom: 15,
    right: 20,
    fontSize: 14,
    fontWeight: "bold",
    opacity: 0.7,
  },
});

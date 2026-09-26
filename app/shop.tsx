import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import BackButton from "@/src/components/common/BackButton";
import { Colors } from "@/src/constants/theme";
import { SIDE_STORY_COST_NT } from "@/src/domain/common/types";
import { SIDE_STORY } from "@/src/domain/sideStory";
import { useAppState } from "@/src/state/AppStateProvider";

export default function ShopScreen() {
  const { state, unlockSideStory } = useAppState();
  const [isPurchasing, setIsPurchasing] = useState(false);
  if (!state) return null;

  const isUnlocked = state.isSideStoryUnlocked;
  const canPurchase = !isUnlocked && !isPurchasing && state.totalNt >= SIDE_STORY_COST_NT;
  const confirmPurchase = () => {
    Alert.alert(
      "サイドストーリーを解放",
      `「${SIDE_STORY.title}」を${SIDE_STORY_COST_NT} NTで解放しますか？`,
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "解放する",
          onPress: () => {
            setIsPurchasing(true);
            void unlockSideStory()
              .catch((error: unknown) => {
                Alert.alert("解放できませんでした", error instanceof Error ? error.message : "もう一度お試しください。");
              })
              .finally(() => setIsPurchasing(false));
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>ショップ</Text>
        <View style={styles.headerSpacer} />
      </View>
      <Text style={styles.sectionTitle}>サイドストーリー</Text>
      <View style={styles.card}>
        <View style={styles.artwork}>
          <Ionicons name="rainy-outline" size={44} color="#D8E9FF" />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.itemTitle}>{SIDE_STORY.title}</Text>
          <Text style={styles.description}>雨宿りをするジェムとアルタの、短い会話。</Text>
          <TouchableOpacity
            onPress={isUnlocked ? () => router.push("/side-story") : confirmPurchase}
            disabled={isPurchasing || (!isUnlocked && !canPurchase)}
            accessibilityRole="button"
            accessibilityLabel={isUnlocked ? `${SIDE_STORY.title}を読む` : `${SIDE_STORY.title}を${SIDE_STORY_COST_NT} NTで解放`}
            accessibilityState={{ disabled: isPurchasing || (!isUnlocked && !canPurchase) }}
            style={[styles.button, !isUnlocked && !canPurchase && styles.disabledButton]}
          >
            <Text style={[styles.buttonText, !isUnlocked && !canPurchase && styles.disabledButtonText]}>
              {isUnlocked ? "読む" : `${SIDE_STORY_COST_NT} NTで解放`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 32 },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  headerTitle: { color: Colors.text, fontSize: 19, fontWeight: "800" },
  headerSpacer: { width: 62 },
  sectionTitle: { color: Colors.text, fontSize: 18, fontWeight: "800", marginHorizontal: 20, marginTop: 20, marginBottom: 14 },
  card: { backgroundColor: Colors.surface, borderColor: Colors.border, borderRadius: 16, borderWidth: 1, marginHorizontal: 20, overflow: "hidden" },
  artwork: { alignItems: "center", backgroundColor: "#263F65", height: 140, justifyContent: "center" },
  cardBody: { padding: 20 },
  itemTitle: { color: Colors.text, fontSize: 19, fontWeight: "800" },
  description: { color: Colors.textSub, fontSize: 14, marginTop: 6 },
  button: { alignItems: "center", backgroundColor: Colors.primary, borderRadius: 10, marginTop: 18, paddingVertical: 13 },
  disabledButton: { backgroundColor: Colors.border },
  buttonText: { color: Colors.surface, fontSize: 14, fontWeight: "800" },
  disabledButtonText: { color: Colors.text },
});

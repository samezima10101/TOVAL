import { router } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import StoryListCard from "@/src/components/common/StoryListCard";
import StoryListHeader from "@/src/components/common/StoryListHeader";
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
                Alert.alert(
                  "解放できませんでした",
                  error instanceof Error ? error.message : "もう一度お試しください。",
                );
              })
              .finally(() => setIsPurchasing(false));
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <StoryListHeader title="ショップ" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.intro}>
          サイドストーリーは解放後、いつでも読み返せます。
        </Text>
        <StoryListCard
          label="Side Story"
          title={SIDE_STORY.title}
          detail={isUnlocked ? "解放済み" : `${SIDE_STORY_COST_NT} NTで解放`}
          isUnlocked={isUnlocked}
          action={isUnlocked ? "▶ 再生" : "解放"}
          actionLabel={isUnlocked ? `${SIDE_STORY.title}を再生` : `${SIDE_STORY.title}を${SIDE_STORY_COST_NT} NTで解放`}
          disabled={isPurchasing || (!isUnlocked && !canPurchase)}
          onPress={isUnlocked ? () => router.push("/side-story") : confirmPurchase}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.background, flex: 1 },
  scrollContainer: { padding: 20, paddingBottom: 34 },
  intro: {
    color: Colors.textSub,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
});

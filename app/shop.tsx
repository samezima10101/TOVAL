import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { usePreventRemove } from "expo-router/react-navigation";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import StoryListCard from "@/src/components/common/StoryListCard";
import StoryListHeader from "@/src/components/common/StoryListHeader";
import StoryMessageBox from "@/src/components/story/StoryMessageBox";
import { Colors } from "@/src/constants/theme";
import { SIDE_STORY_COST_NT, StoryEpisode } from "@/src/domain/common/types";
import { listAvailableConversations, ShopConversation } from "@/src/domain/sideStory";
import useStoryReader from "@/src/hooks/useStoryReader";
import { useAppState } from "@/src/state/AppStateProvider";

const greeting: StoryEpisode = {
  id: -1, title: "エト", commonBefore: [
    { id: "eto-hello", speaker: "sub", text: "……どうも……。", left: "normal", right: "normal" },
  ], commonAfter: [],
};
const greetingWithArrivals: StoryEpisode = {
  ...greeting,
  commonAfter: [{ id: "eto-new", speaker: "sub", text: "新しい会話……手に入れました……。\n……よかったら、見ていってください……。", left: "normal", right: "normal" }],
};
const farewell: StoryEpisode = {
  id: -2, title: "エト", commonBefore: [
    { id: "eto-bye", speaker: "sub", text: "……またね……。", left: "normal", right: "normal" },
  ], commonAfter: [],
};

export default function ShopScreen() {
  const { state, unlockSideStory, announceSideStories } = useAppState();
  const [phase, setPhase] = useState<"greeting" | "list" | "farewell" | "closed">("greeting");
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [newConversationIds] = useState(() => state
    ? listAvailableConversations(state).filter((item) => !state.announcedSideStoryIds.includes(item.id)).map((item) => item.id)
    : []);

  usePreventRemove(phase !== "closed", () => setPhase("farewell"));
  useEffect(() => {
    if (phase === "closed") router.dismissTo("/");
  }, [phase]);

  if (!state) return null;

  const confirmPurchase = (conversation: ShopConversation) => {
    Alert.alert("会話を解放", `「${conversation.title}」を${SIDE_STORY_COST_NT} NTで解放しますか？`, [
      { text: "キャンセル", style: "cancel" },
      { text: "解放する", onPress: () => {
        setIsPurchasing(true);
        void unlockSideStory(conversation.id)
          .catch((error: unknown) => Alert.alert("解放できませんでした", error instanceof Error ? error.message : "もう一度お試しください。"))
          .finally(() => setIsPurchasing(false));
      } },
    ]);
  };

  const opening = newConversationIds.length ? greetingWithArrivals : greeting;

  return (
    <View style={styles.container}>
      <StoryListHeader title="ショップ" onBack={() => setPhase("farewell")} />
      {phase === "list" ? (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.intro}>解放した会話は、いつでも読み返せます。</Text>
          {listAvailableConversations(state).map((conversation) => {
            const isUnlocked = state.purchasedSideStoryIds.includes(conversation.id);
            return <StoryListCard
              key={conversation.id}
              label="Record"
              title={conversation.title}
              detail={isUnlocked ? "解放済み" : `${SIDE_STORY_COST_NT} NTで解放`}
              isUnlocked={isUnlocked}
              action={isUnlocked ? "▶ 再生" : "解放"}
              actionLabel={isUnlocked ? `${conversation.title}を再生` : `${conversation.title}を${SIDE_STORY_COST_NT} NTで解放`}
              disabled={isPurchasing || (!isUnlocked && state.totalNt < SIDE_STORY_COST_NT)}
              onPress={isUnlocked
                ? () => router.push({ pathname: "/side-story", params: { conversation: String(conversation.id) } })
                : () => confirmPurchase(conversation)}
            />;
          })}
        </ScrollView>
      ) : phase !== "closed" ? (
        <ShopGreeting
          key={phase}
          episode={phase === "greeting" ? opening : farewell}
          onRead={async () => { if (phase === "greeting") await announceSideStories(newConversationIds); }}
          onClose={() => setPhase(phase === "greeting" ? "list" : "closed")}
        />
      ) : null}
    </View>
  );
}

function ShopGreeting({ episode, onRead, onClose }: {
  episode: StoryEpisode;
  onRead: () => Promise<void>;
  onClose: () => void;
}) {
  const reader = useStoryReader(episode, "shop", onRead, undefined, undefined, onClose);
  return <View style={styles.container}>
    <View style={styles.character} accessibilityLabel="エト（仮の立ち絵）">
      <Ionicons name="person-outline" size={130} color={Colors.textSub} />
      <Text style={styles.intro}>エト</Text>
    </View>
    {reader.error ? <Text style={styles.error}>{reader.error}</Text> : null}
    {reader.line ? <StoryMessageBox
      speaker={reader.line.speaker}
      speakerName="エト"
      text={reader.visibleText}
      fullText={reader.line.text}
      isTyping={reader.isTyping}
      isLastLine={reader.isLastLine}
      isProcessing={reader.isProcessing}
      onNext={() => void reader.handleNext()}
    /> : null}
  </View>;
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.background, flex: 1 },
  scrollContainer: { padding: 20, paddingBottom: 34 },
  intro: { color: Colors.textSub, fontSize: 14, lineHeight: 22, marginBottom: 16 },
  character: { flex: 1, alignItems: "center", justifyContent: "center" },
  error: { color: Colors.warning, textAlign: "center", marginHorizontal: 18 },
});

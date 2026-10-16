import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useFocusEffect } from "expo-router";
import { useIsFocused, usePreventRemove } from "expo-router/react-navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import StoryListCard from "@/src/components/common/StoryListCard";
import StoryListHeader from "@/src/components/common/StoryListHeader";
import StoryMessageBox from "@/src/components/story/StoryMessageBox";
import { Colors } from "@/src/constants/theme";
import { StoryEpisode } from "@/src/domain/common/types";
import { getSideStorySetting } from "@/src/config/conversationSettings";
import {
  SHOP_GREETING,
  SHOP_GREETING_WITH_ARRIVALS,
  SHOP_FAREWELL,
  SHOP_KEEPER_NAME,
} from "@/src/content/shop";
import { listAvailableConversations, ShopConversation } from "@/src/domain/sideStory";
import useStoryReader from "@/src/hooks/useStoryReader";
import { useAppState } from "@/src/state/AppStateProvider";

export default function ShopScreen() {
  const { state, unlockSideStory, announceSideStories } = useAppState();
  const [phase, setPhase] = useState<"greeting" | "list" | "farewell" | "closed">("greeting");
  const [isPurchasing, setIsPurchasing] = useState(false);
  const busyRef = useRef(false);
  const phaseRef = useRef(phase);
  const replayingRef = useRef(false);
  const exitDispatchedRef = useRef(false);
  const isFocused = useIsFocused();
  const changePhase = (next: typeof phase) => { phaseRef.current = next; setPhase(next); };
  const setBusy = (next: boolean) => { busyRef.current = next; setIsPurchasing(next); };
  useFocusEffect(useCallback(() => { replayingRef.current = false; }, []));
  const [newConversationIds] = useState(() => state
    ? listAvailableConversations(state).filter((item) => !state.announcedSideStoryIds.includes(item.id)).map((item) => item.id)
    : []);

  const handleBack = () => {
    if (busyRef.current || replayingRef.current) return;
    if (phaseRef.current === "greeting" || phaseRef.current === "list") changePhase("farewell");
    // Repeated back/swipe cannot skip or restart the farewell.
  };
  usePreventRemove(isFocused && phase !== "closed", handleBack);
  useEffect(() => {
    if (phase === "closed" && !exitDispatchedRef.current) {
      exitDispatchedRef.current = true;
      router.dismissTo("/");
    }
  }, [phase]);

  if (!state) return null;

  const confirmPurchase = (conversation: ShopConversation) => {
    if (busyRef.current || replayingRef.current || phaseRef.current !== "list") return;
    const { priceNt } = getSideStorySetting(conversation.id);
    setBusy(true);
    Alert.alert("会話を解放", `「${conversation.title}」を${priceNt} NTで解放しますか？`, [
      { text: "キャンセル", style: "cancel", onPress: () => setBusy(false) },
      { text: "解放する", onPress: () => {
        void unlockSideStory(conversation.id)
          .catch((error: unknown) => Alert.alert("解放できませんでした", error instanceof Error ? error.message : "もう一度お試しください。"))
          .finally(() => setBusy(false));
      } },
    ], { cancelable: false });
  };
  const replay = (conversationId: number) => {
    if (busyRef.current || replayingRef.current || phaseRef.current !== "list") return;
    replayingRef.current = true;
    router.push({ pathname: "/side-story", params: { conversation: String(conversationId) } });
  };

  const opening = newConversationIds.length ? SHOP_GREETING_WITH_ARRIVALS : SHOP_GREETING;

  return (
    <View style={styles.container}>
      <StoryListHeader title="ショップ" onBack={handleBack} />
      {phase === "list" ? (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.intro}>解放した会話は、いつでも読み返せます。</Text>
          {listAvailableConversations(state).map((conversation) => {
            const isUnlocked = state.purchasedSideStoryIds.includes(conversation.id);
            const { priceNt } = getSideStorySetting(conversation.id);
            return <StoryListCard
              key={conversation.id}
              label="Record"
              title={conversation.title}
              detail={isUnlocked ? "解放済み" : `${priceNt} NTで解放`}
              isUnlocked={isUnlocked}
              action={isUnlocked ? "▶ 再生" : "解放"}
              actionLabel={isUnlocked ? `${conversation.title}を再生` : `${conversation.title}を${priceNt} NTで解放`}
              disabled={isPurchasing || (!isUnlocked && state.totalNt < priceNt)}
              onPress={isUnlocked
                ? () => replay(conversation.id)
                : () => confirmPurchase(conversation)}
            />;
          })}
        </ScrollView>
      ) : phase !== "closed" ? (
        <ShopGreeting
          key={phase}
          episode={phase === "greeting" ? opening : SHOP_FAREWELL}
          onFinish={async () => {
            setBusy(true);
            try { if (phaseRef.current === "greeting") await announceSideStories(newConversationIds); }
            finally { setBusy(false); }
          }}
          onClose={() => {
            if (phaseRef.current === phase) changePhase(phase === "greeting" ? "list" : "closed");
          }}
        />
      ) : null}
    </View>
  );
}

function ShopGreeting({ episode, onFinish, onClose }: {
  episode: StoryEpisode;
  onFinish: () => Promise<void>;
  onClose: () => void;
}) {
  const reader = useStoryReader(episode, { source: "shop", onFinish, onClose });
  return <View style={styles.container}>
    <View style={styles.character} accessibilityLabel={`${SHOP_KEEPER_NAME}（仮の立ち絵）`}>
      <Ionicons name="person-outline" size={130} color={Colors.textSub} />
      <Text style={styles.intro}>{SHOP_KEEPER_NAME}</Text>
    </View>
    {reader.error ? <Text style={styles.error}>{reader.error}</Text> : null}
    {reader.line ? <StoryMessageBox
      speaker={reader.line.speaker}
      speakerName={SHOP_KEEPER_NAME}
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

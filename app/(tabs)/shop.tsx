import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useFocusEffect } from "expo-router";
import { useIsFocused, usePreventRemove } from "expo-router/react-navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import StoryListCard from "@/src/components/common/StoryListCard";
import StoryMessageBox from "@/src/components/story/StoryMessageBox";
import { getSideStorySetting } from "@/src/config/conversationSettings";
import { Colors, Fonts } from "@/src/constants/theme";
import {
  SHOP_FAREWELL,
  SHOP_GREETING,
  SHOP_GREETING_WITH_ARRIVALS,
  SHOP_KEEPER_NAME,
} from "@/src/content/shop";
import { StoryEpisode } from "@/src/domain/common/types";
import {
  listAvailableConversations,
  ShopConversation,
} from "@/src/domain/sideStory";
import useShopTabExit from "@/src/hooks/useShopTabExit";
import useStoryReader from "@/src/hooks/useStoryReader";
import { useAppState } from "@/src/state/AppStateProvider";

export default function ShopScreen() {
  const { state, unlockSideStory, announceSideStories } = useAppState();
  const stateRef = useRef(state);
  useLayoutEffect(() => {
    stateRef.current = state;
  }, [state]);
  const [phase, setPhase] = useState<
    "greeting" | "list" | "farewell" | "closed"
  >("greeting");
  const [isPurchasing, setIsPurchasing] = useState(false);
  const busyRef = useRef(false);
  const phaseRef = useRef(phase);
  const replayingRef = useRef(false);
  const exitDispatchedRef = useRef(false);
  const pendingExitRef = useRef<(() => void) | null>(null);
  const shopTabExitRef = useShopTabExit();
  const isFocused = useIsFocused();
  const changePhase = useCallback((next: typeof phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);
  const setBusy = (next: boolean) => {
    busyRef.current = next;
    setIsPurchasing(next);
  };
  const [newConversationIds, setNewConversationIds] = useState(() =>
    state
      ? listAvailableConversations(state)
          .filter((item) => !state.announcedSideStoryIds.includes(item.id))
          .map((item) => item.id)
      : [],
  );

  useFocusEffect(
    useCallback(() => {
      replayingRef.current = false;
      // A new tab visit starts a greeting; returning from playback keeps the list.
      if (phaseRef.current !== "closed") return;
      pendingExitRef.current = null;
      exitDispatchedRef.current = false;
      const current = stateRef.current;
      setNewConversationIds(
        current
          ? listAvailableConversations(current)
              .filter(
                (item) => !current.announcedSideStoryIds.includes(item.id),
              )
              .map((item) => item.id)
          : [],
      );
      changePhase("greeting");
    }, [changePhase]),
  );

  const requestExit = useCallback(
    (leave: () => void) => {
      if (busyRef.current || replayingRef.current || pendingExitRef.current)
        return;
      pendingExitRef.current = leave;
      changePhase("farewell");
    },
    [changePhase],
  );
  useEffect(() => {
    shopTabExitRef.current = requestExit;
    return () => {
      shopTabExitRef.current = null;
    };
  }, [requestExit, shopTabExitRef]);

  const handleBack = () => requestExit(() => router.navigate("/"));
  usePreventRemove(isFocused && phase !== "closed", handleBack);
  useEffect(() => {
    if (phase === "closed" && !exitDispatchedRef.current) {
      exitDispatchedRef.current = true;
      pendingExitRef.current?.();
    }
  }, [phase]);

  if (!state) return null;

  const confirmPurchase = (conversation: ShopConversation) => {
    if (busyRef.current || replayingRef.current || phaseRef.current !== "list")
      return;
    const { priceNt } = getSideStorySetting(conversation.id);
    setBusy(true);
    Alert.alert(
      "会話を解放",
      `「${conversation.title}」を${priceNt} NTで解放しますか？`,
      [
        { text: "キャンセル", style: "cancel", onPress: () => setBusy(false) },
        {
          text: "解放する",
          onPress: () => {
            void unlockSideStory(conversation.id)
              .catch((error: unknown) =>
                Alert.alert(
                  "解放できませんでした",
                  error instanceof Error
                    ? error.message
                    : "もう一度お試しください。",
                ),
              )
              .finally(() => setBusy(false));
          },
        },
      ],
      { cancelable: false },
    );
  };
  const replay = (conversationId: number) => {
    if (busyRef.current || replayingRef.current || phaseRef.current !== "list")
      return;
    replayingRef.current = true;
    router.push({
      pathname: "/side-story",
      params: { conversation: String(conversationId) },
    });
  };

  const opening = newConversationIds.length
    ? SHOP_GREETING_WITH_ARRIVALS
    : SHOP_GREETING;

  return (
    <View style={styles.container}>
      {phase === "list" ? (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.intro}>
            解放した会話は、いつでも読み返せます。
          </Text>
          {listAvailableConversations(state).map((conversation) => {
            const isUnlocked = state.purchasedSideStoryIds.includes(
              conversation.id,
            );
            const { priceNt } = getSideStorySetting(conversation.id);
            return (
              <StoryListCard
                key={conversation.id}
                label="Record"
                title={conversation.title}
                detail={isUnlocked ? "解放済み" : `${priceNt} NTで解放`}
                isUnlocked={isUnlocked}
                action={isUnlocked ? "▶ 再生" : "解放"}
                actionLabel={
                  isUnlocked
                    ? `${conversation.title}を再生`
                    : `${conversation.title}を${priceNt} NTで解放`
                }
                disabled={
                  isPurchasing || (!isUnlocked && state.totalNt < priceNt)
                }
                onPress={
                  isUnlocked
                    ? () => replay(conversation.id)
                    : () => confirmPurchase(conversation)
                }
              />
            );
          })}
        </ScrollView>
      ) : phase !== "closed" ? (
        <ShopGreeting
          key={phase}
          episode={phase === "greeting" ? opening : SHOP_FAREWELL}
          onFinish={async () => {
            setBusy(true);
            try {
              if (phaseRef.current === "greeting")
                await announceSideStories(newConversationIds);
            } finally {
              setBusy(false);
            }
          }}
          onClose={() => {
            if (phaseRef.current === phase)
              changePhase(phase === "greeting" ? "list" : "closed");
          }}
        />
      ) : null}
    </View>
  );
}

function ShopGreeting({
  episode,
  onFinish,
  onClose,
}: {
  episode: StoryEpisode;
  onFinish: () => Promise<void>;
  onClose: () => void;
}) {
  const reader = useStoryReader(episode, { source: "shop", onFinish, onClose });
  return (
    <View style={styles.container}>
      <View
        style={styles.character}
        accessibilityLabel={`${SHOP_KEEPER_NAME}（仮の立ち絵）`}
      >
        <Ionicons name="person-outline" size={130} color={Colors.textSub} />
        <Text style={styles.intro}>{SHOP_KEEPER_NAME}</Text>
      </View>
      {reader.error ? <Text style={styles.error}>{reader.error}</Text> : null}
      {reader.line ? (
        <StoryMessageBox
          speaker={reader.line.speaker}
          speakerName={SHOP_KEEPER_NAME}
          text={reader.visibleText}
          fullText={reader.line.text}
          isTyping={reader.isTyping}
          isLastLine={reader.isLastLine}
          isProcessing={reader.isProcessing}
          onNext={() => void reader.handleNext()}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { padding: 20, paddingBottom: 34 },
  intro: {
    fontFamily: Fonts.regular,
    color: Colors.textSub,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  character: { flex: 1, alignItems: "center", justifyContent: "center" },
  error: {
    fontFamily: Fonts.regular,
    color: Colors.warning,
    textAlign: "center",
    marginHorizontal: 18,
  },
});

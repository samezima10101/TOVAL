import { Image } from "expo-image";
import { router } from "expo-router";
import { useIsFocused, usePreventRemove } from "expo-router/react-navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  Alert,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BackButton from "@/src/components/common/BackButton";
import ScreenBackground from "@/src/components/common/ScreenBackground";
import StoryArchive, {
  type StoryArchiveChapter,
} from "@/src/components/common/StoryArchive";
import StoryMessageBox, { StoryMessage } from "@/src/components/story/StoryMessageBox";
import { getSideStorySetting } from "@/src/config/conversationSettings";
import { SHOP_CHAPTERS } from "@/src/config/storyArchive";
import { Colors, Fonts } from "@/src/constants/theme";
import {
  SHOP_FAREWELL,
  SHOP_GREETING,
  SHOP_GREETING_WITH_ARRIVALS,
  SHOP_KEEPER_NAME,
  SIDE_STORY_OPENING,
} from "@/src/content/shop";
import { StoryEpisode } from "@/src/domain/common/types";
import {
  listAvailableConversations,
  ShopConversation,
} from "@/src/domain/sideStory";
import useStoryReader from "@/src/hooks/useStoryReader";
import { useAppState } from "@/src/state/AppStateProvider";

export default function ShopScreen() {
  const { top } = useSafeAreaInsets();
  const { state, unlockSideStory, completeShopGreeting } = useAppState();
  const [phase, setPhase] = useState<
    "greeting" | "list" | "farewell" | "closed"
  >("greeting");
  const [isPurchasing, setIsPurchasing] = useState(false);
  const busyRef = useRef(false);
  const phaseRef = useRef(phase);
  const replayingRef = useRef(false);
  const exitDispatchedRef = useRef(false);
  const pendingExitRef = useRef<(() => void) | null>(null);
  const isFocused = useIsFocused();
  const changePhase = useCallback((next: typeof phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);
  const setBusy = (next: boolean) => {
    busyRef.current = next;
    setIsPurchasing(next);
  };
  const [newConversationIds] = useState(() =>
    state
      ? listAvailableConversations(state)
          .filter((item) => !state.announcedSideStoryIds.includes(item.id))
          .map((item) => item.id)
      : [],
  );
  const [showSideStoryOpening] = useState(() =>
    Boolean(
      state?.unlockedStories.some((story) => story.episodeId === 14) &&
        !state.sideStoryOpeningSeen,
    ),
  );

  useLayoutEffect(() => {
    if (isFocused) replayingRef.current = false;
  }, [isFocused]);

  const requestExit = useCallback(
    (leave: () => void) => {
      if (busyRef.current || replayingRef.current || pendingExitRef.current)
        return;
      pendingExitRef.current = leave;
      changePhase("farewell");
    },
    [changePhase],
  );
  const handleBack = () =>
    requestExit(() => {
      if (router.canGoBack()) router.back();
      else router.replace("/menu");
    });
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

  const opening = showSideStoryOpening
    ? SIDE_STORY_OPENING
    : newConversationIds.length
      ? SHOP_GREETING_WITH_ARRIVALS
      : SHOP_GREETING;
  const availableConversations = listAvailableConversations(state);
  const chapters: StoryArchiveChapter[] = SHOP_CHAPTERS.map((chapter) => ({
    id: chapter.id,
    title: chapter.title,
    emptyLabel: chapter.storyIds.length ? "未入荷" : "準備中",
    items: chapter.storyIds.flatMap((id, index) => {
      const conversation = availableConversations.find(
        (entry) => entry.id === id,
      );
      if (!conversation) return [];
      const isUnlocked = state.purchasedSideStoryIds.includes(id);
      const { priceNt } = getSideStorySetting(id);
      const insufficient = !isUnlocked && state.totalNt < priceNt;
      return [
        {
          id,
          number: index + 1,
          title: conversation.title,
          description: conversation.commonBefore[0]?.text ?? "",
          status: isUnlocked
            ? "解放済み・いつでも再生できます"
            : insufficient
              ? `NTが不足しています（必要: ${priceNt.toLocaleString("ja-JP")} NT）`
              : `${priceNt.toLocaleString("ja-JP")} NTで解放できます`,
          metadata: [
            `RECORD: ${String(index + 1).padStart(2, "0")}`,
            isUnlocked ? "STATUS: UNLOCKED" : `PRICE: ${priceNt} NT`,
          ],
          isUnlocked,
          action: isUnlocked
            ? "再生する"
            : `${priceNt.toLocaleString("ja-JP")} NTで解放`,
          actionLabel: isUnlocked
            ? `${conversation.title}を再生`
            : `${conversation.title}を${priceNt} NTで解放`,
          disabled: isPurchasing || insufficient,
          onPress: isUnlocked
            ? () => replay(id)
            : () => confirmPurchase(conversation),
        },
      ];
    }),
  }));

  return (
    <View style={styles.container}>
      <ScreenBackground source={require("@/assets/bg/shop-bg.png")} />
      {phase === "list" ? (
        <StoryArchive
          chapters={chapters}
          variant="shop"
          topInset={top + 76}
          selectionDisabled={isPurchasing}
          loading={isPurchasing}
          footer={
            <View style={styles.archiveBack}>
              <BackButton onPress={handleBack} />
            </View>
          }
        />
      ) : phase !== "closed" ? (
        <ShopGreeting
          key={phase}
          episode={phase === "greeting" ? opening : SHOP_FAREWELL}
          userName={state.userName}
          onBack={handleBack}
          onFinish={async () => {
            setBusy(true);
            try {
              if (phaseRef.current === "greeting") {
                await completeShopGreeting(newConversationIds, showSideStoryOpening);
              }
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
  userName,
  onBack,
  onFinish,
  onClose,
}: {
  episode: StoryEpisode;
  userName: string;
  onBack: () => void;
  onFinish: () => Promise<void>;
  onClose: () => void;
}) {
  const { top } = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const reader = useStoryReader(episode, {
    source: "shop", userName, onFinish, onClose,
  });
  const showCharacter = reader.line &&
    (reader.line.left !== "none" || reader.line.right !== "none");
  return (
    <View style={[styles.container, { paddingTop: top + 76 }]}>
      {showCharacter ? (
        <Image
          source={require("@/assets/images/they.png")}
          style={[styles.character, { top: 0, height: screenHeight }]}
          contentFit="cover"
          contentPosition="center"
          pointerEvents="none"
          accessible
          accessibilityLabel={`${SHOP_KEEPER_NAME}の立ち絵`}
        />
      ) : null}
      <BackButton onPress={onBack} />
      <View style={styles.container}>
        {reader.error ? <Text style={styles.error}>{reader.error}</Text> : null}
        {reader.line ? (
          <StoryMessageBox contentKey={reader.line.id} speakerName={SHOP_KEEPER_NAME}>
            <StoryMessage {...reader} />
          </StoryMessageBox>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  archiveBack: { alignSelf: "flex-start", marginLeft: 24, marginBottom: 24 },
  character: { position: "absolute", left: 0, right: 0 },
  error: {
    fontFamily: Fonts.regular,
    color: Colors.warning,
    textAlign: "center",
    marginHorizontal: 18,
  },
});

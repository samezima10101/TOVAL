import { useLocalSearchParams } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BackButton from "@/src/components/common/BackButton";
import ScreenBackground from "@/src/components/common/ScreenBackground";
import { StoryMessage } from "@/src/components/story/StoryMessageBox";
import StoryScene from "@/src/components/story/StoryScene";
import { Colors, Fonts } from "@/src/constants/theme";
import { SHOP_CONVERSATIONS, SIDE_STORY } from "@/src/domain/sideStory";
import useConversationExit from "@/src/hooks/useConversationExit";
import useStoryReader from "@/src/hooks/useStoryReader";
import { useAppState } from "@/src/state/AppStateProvider";

export default function SideStoryScreen() {
  const { top } = useSafeAreaInsets();
  const { conversation } = useLocalSearchParams<{ conversation?: string }>();
  return (
    <View style={{ flex: 1, paddingTop: top + 76 }}>
      <ScreenBackground source={require("@/assets/bg/shop-bg.png")} />
      <SideStoryPlayback key={String(conversation)} />
    </View>
  );
}

function SideStoryPlayback() {
  const { state } = useAppState();
  const { conversation } = useLocalSearchParams<{ conversation?: string }>();
  const episode =
    conversation === undefined
      ? SIDE_STORY
      : SHOP_CONVERSATIONS.find((item) => item.id === Number(conversation));
  const isUnlocked = Boolean(
    episode && state?.purchasedSideStoryIds.includes(episode.id),
  );
  const readingRef = React.useRef(false);
  const exit = useConversationExit("/shop", () => readingRef.current);
  const reader = useStoryReader(isUnlocked ? episode : undefined, {
    source: "shop",
    onClose: exit.requestExit,
    processingRef: readingRef,
    exitRequestedRef: exit.leavingRef,
  });
  const { line, isProcessing, error, handleClose } = reader;

  if (!isUnlocked) {
    return (
      <View style={styles.container}>
        <Text style={styles.invalid}>このストーリーはまだ読めません</Text>
        <BackButton onPress={handleClose} />
      </View>
    );
  }
  if (!line || !episode) return null;

  return (
    <StoryScene
      title={episode.title}
      onClose={handleClose}
      disabled={isProcessing}
      error={error}
      contentKey={line.id}
    >
      <StoryMessage {...reader} />
    </StoryScene>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  invalid: {
    color: Colors.text,
    fontSize: 18,
    fontFamily: Fonts.bold,
    textAlign: "center",
    marginTop: 100,
  },
});

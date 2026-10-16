import { useLocalSearchParams } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BackButton from "@/src/components/common/BackButton";
import StoryCharacters from "@/src/components/story/StoryCharacters";
import StoryMessageBox from "@/src/components/story/StoryMessageBox";
import { Colors } from "@/src/constants/theme";
import { SHOP_CONVERSATIONS, SIDE_STORY } from "@/src/domain/sideStory";
import useConversationExit from "@/src/hooks/useConversationExit";
import useStoryReader from "@/src/hooks/useStoryReader";
import { useAppState } from "@/src/state/AppStateProvider";

export default function SideStoryScreen() {
  const { conversation } = useLocalSearchParams<{ conversation?: string }>();
  return <SideStoryPlayback key={String(conversation)} />;
}

function SideStoryPlayback() {
  const { state } = useAppState();
  const { conversation } = useLocalSearchParams<{ conversation?: string }>();
  const episode = conversation === undefined ? SIDE_STORY : SHOP_CONVERSATIONS.find((item) => item.id === Number(conversation));
  const isUnlocked = Boolean(episode && state?.purchasedSideStoryIds.includes(episode.id));
  const readingRef = React.useRef(false);
  const exit = useConversationExit("/shop", () => readingRef.current);
  const reader = useStoryReader(isUnlocked ? episode : undefined, {
    source: "shop", onClose: exit.requestExit,
    processingRef: readingRef, exitRequestedRef: exit.leavingRef,
  });
  const { line, visibleText, isTyping, isLastLine, isProcessing, error, handleNext, handleClose } =
    reader;

  if (!isUnlocked) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <Text style={styles.invalid}>このストーリーはまだ読めません</Text>
        <BackButton label="戻る" onPress={handleClose} />
      </SafeAreaView>
    );
  }
  if (!line || !episode) return null;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.title}>{episode.title}</Text>
        <TouchableOpacity onPress={handleClose} accessibilityRole="button" accessibilityLabel="ストーリーを閉じる">
          <Text style={styles.close}>閉じる</Text>
        </TouchableOpacity>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <StoryCharacters
        leftExpression={line.left}
        rightExpression={line.right}
        activeSpeaker={line.speaker}
      />
      <StoryMessageBox
        speaker={line.speaker}
        text={visibleText}
        fullText={line.text}
        isTyping={isTyping}
        isLastLine={isLastLine}
        isProcessing={isProcessing}
        onNext={() => void handleNext()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  title: { color: Colors.text, fontSize: 18, fontWeight: "800" },
  close: { color: Colors.textSub, fontSize: 14, fontWeight: "700", padding: 8 },
  invalid: { color: Colors.text, fontSize: 18, fontWeight: "800", textAlign: "center", marginTop: 100 },
  error: { color: Colors.warning, textAlign: "center", marginTop: 12 },
});

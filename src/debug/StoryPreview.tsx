// 削除時: このファイルと、menu.tsxのDEBUG_STORY_PREVIEWの2ブロックを削除する。
// 保存API・通常の閲覧条件には接続せず、プレビューの状態だけを保持する。
import { useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import PrimaryButton from "@/src/components/common/PrimaryButton";
import ScreenBackground from "@/src/components/common/ScreenBackground";
import { SettingsCard, SettingsTitle } from "@/src/components/menu/SettingsLayout";
import StoryCharacters from "@/src/components/story/StoryCharacters";
import StoryChoices from "@/src/components/story/StoryChoices";
import { StoryMessage } from "@/src/components/story/StoryMessageBox";
import StoryScene from "@/src/components/story/StoryScene";
import { Fonts } from "@/src/constants/theme";
import type { StoryEpisode } from "@/src/domain/common/types";
import { SHOP_CONVERSATIONS } from "@/src/domain/sideStory";
import { STORY_EPISODES } from "@/src/domain/storyData";
import useStoryReader from "@/src/hooks/useStoryReader";
import { useAppState } from "@/src/state/AppStateProvider";

type Preview = { kind: "main" | "side"; episode: StoryEpisode };

export default function StoryPreview() {
  const [isOpen, setIsOpen] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const { state } = useAppState();

  if (!__DEV__) return null;

  const close = () => {
    setIsOpen(false);
    setPreview(null);
  };
  const back = () => preview ? setPreview(null) : close();

  return (
    <SettingsCard>
      <SettingsTitle>デバッグ：ストーリー確認</SettingsTitle>
      <Text style={styles.description}>
        未解放の話や両分岐を確認できます。NT・解放・購入状態は変わりません。
      </Text>
      <PrimaryButton title="ストーリーを選ぶ" onPress={() => setIsOpen(true)} />
      <Modal
        visible={isOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={back}
      >
        <SafeAreaView
          style={styles.screen}
          accessibilityViewIsModal
          onAccessibilityEscape={back}
        >
          <ScreenBackground source={require("@/assets/bg/starry-bg.png")} />
          {preview ? (
            <PreviewPlayback
              key={`${preview.kind}:${preview.episode.id}`}
              preview={preview}
              userName={state?.userName}
              onClose={() => setPreview(null)}
            />
          ) : (
            <>
              <View style={styles.header}>
                <Text style={styles.title} accessibilityRole="header">ストーリー確認</Text>
                <TouchableOpacity
                  onPress={close}
                  style={styles.close}
                  accessibilityRole="button"
                  accessibilityLabel="ストーリー確認を閉じる"
                >
                  <Text style={styles.closeText}>× CLOSE</Text>
                </TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={styles.list}>
                <Text style={styles.description}>話を選ぶと冒頭から再生します。分岐は会話中に選べます。</Text>
                <SettingsTitle>メインストーリー</SettingsTitle>
                {STORY_EPISODES.map((episode) => (
                  <StoryOption
                    key={episode.id}
                    title={`第${episode.id}話　${episode.title}`}
                    onPress={() => setPreview({ kind: "main", episode })}
                  />
                ))}
                <SettingsTitle>サイドストーリー</SettingsTitle>
                {SHOP_CONVERSATIONS.map((episode) => (
                  <StoryOption
                    key={episode.id}
                    title={`${episode.id}　${episode.title}`}
                    onPress={() => setPreview({ kind: "side", episode })}
                  />
                ))}
              </ScrollView>
            </>
          )}
        </SafeAreaView>
      </Modal>
    </SettingsCard>
  );
}

function StoryOption({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.option} accessibilityRole="button">
      <Text style={styles.optionText}>{title}</Text>
    </TouchableOpacity>
  );
}

function PreviewPlayback({
  preview: { kind, episode },
  userName,
  onClose,
}: {
  preview: Preview;
  userName: string | undefined;
  onClose: () => void;
}) {
  const reader = useStoryReader(episode, {
    source: "memory",
    userName,
    onClose,
    // selectInitialRoute / onFinishを渡さないため、分岐選択・読了で保存しない。
  });
  const characterLine = reader.line ?? episode.commonBefore[episode.commonBefore.length - 1];

  return (
    <View style={styles.playback}>
      <Text style={styles.previewLabel}>
        {kind === "main" ? `第${episode.id}話` : `サイド ${episode.id}`}　プレビュー
      </Text>
      <StoryScene
        title={episode.title}
        episodeNumber={kind === "main" ? episode.id : undefined}
        slide={characterLine?.slide}
        slideBackground={characterLine?.slideBackground}
        onClose={reader.handleClose}
        disabled={reader.isProcessing}
        error={reader.error}
        contentKey={reader.isWaitingForChoice ? "choices" : reader.line?.id}
        characters={kind === "main" ? (
          <StoryCharacters effect={reader.line?.effect} contentKey={reader.line?.id} leftExpression={characterLine?.left} rightExpression={characterLine?.right} />
        ) : undefined}
      >
        <StoryMessage {...reader} />
        {reader.isWaitingForChoice && episode.routes ? (
          <StoryChoices
            priceNt={0}
            routes={episode.routes}
            onSelect={(routeId) => void reader.handleSelectRoute(routeId)}
            disabled={reader.isProcessing}
          />
        ) : null}
      </StoryScene>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#103C54" },
  playback: { flex: 1, minHeight: 0 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 12,
  },
  title: { flex: 1, color: "#FFFFFF", fontFamily: Fonts.bold, fontSize: 20 },
  close: { minHeight: 44, justifyContent: "center", paddingHorizontal: 8 },
  closeText: { color: "#FFFFFF", fontFamily: Fonts.bold, fontSize: 14 },
  description: { color: "#E0E3EE", fontFamily: Fonts.regular, fontSize: 14, lineHeight: 22 },
  list: { padding: 20, gap: 12 },
  option: {
    minHeight: 48,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FFFFFF66",
    backgroundColor: "#FFFFFF22",
    padding: 12,
  },
  optionText: { color: "#FFFFFF", fontFamily: Fonts.medium, fontSize: 16 },
  previewLabel: {
    color: "#FFFFFF",
    fontFamily: Fonts.bold,
    fontSize: 14,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
});

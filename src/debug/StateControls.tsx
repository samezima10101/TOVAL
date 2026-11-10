// DEBUG_CENTER: 削除・無効化手順はdocs/editing-guide.mdを参照。
// 変換処理はこのファイルに閉じ、保存はProviderの通常キュー経由で行う。
import { useRef, useState } from "react";
import {
  Keyboard,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import PrimaryButton from "@/src/components/common/PrimaryButton";
import ScreenBackground from "@/src/components/common/ScreenBackground";
import { SettingsCard, SettingsTitle } from "@/src/components/menu/SettingsLayout";
import { Fonts } from "@/src/constants/theme";
import { DEBUG_ENABLED } from "@/src/config/environment";
import { useDebugSession } from "./DebugSession";
import { useDebugStateUpdate } from "@/src/debug/StateAccess";
import type { AppState } from "@/src/domain/common/types";
import { STORY_CATALOG } from "@/src/domain/storyData";
import { useAppState } from "@/src/state/AppStateProvider";

export default function StateControls() {
  const { sandbox } = useDebugSession();
  const { state } = useAppState();
  const updateState = useDebugStateUpdate();
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [pendingEpisodeId, setPendingEpisodeId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [feedback, setFeedback] = useState<{ text: string; error: boolean } | null>(null);

  if (!DEBUG_ENABLED || !sandbox || !state || !updateState) return null;

  const close = () => {
    if (busyRef.current) return;
    Keyboard.dismiss();
    setIsOpen(false);
    setPendingEpisodeId(null);
    setFeedback(null);
  };

  const save = async (transform: (current: AppState) => AppState, message: string) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setFeedback(null);
    Keyboard.dismiss();
    try {
      await updateState(transform);
      setPendingEpisodeId(null);
      setFeedback({ text: message, error: false });
    } catch (cause) {
      setFeedback({
        text: cause instanceof Error ? cause.message : "保存できませんでした。もう一度お試しください。",
        error: true,
      });
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const adjustNt = (direction: 1 | -1) => {
    const value = amount.trim();
    const quantity = Number(value);
    if (!/^\d+$/.test(value) || !Number.isSafeInteger(quantity) || quantity <= 0) {
      setFeedback({ text: "NTは1以上の安全な整数で入力してください。", error: true });
      return;
    }
    void save((current) => {
      const totalNt = current.totalNt + direction * quantity;
      if (totalNt < 0) throw new Error("残高を超えるNTは減算できません。");
      if (!Number.isSafeInteger(totalNt)) throw new Error("NTの保存上限を超えています。");
      return { ...current, totalNt };
    }, `${quantity} NTを${direction === 1 ? "追加" : "減算"}しました。`);
  };

  const resetEpisode = (episodeId: number) => {
    void save((current) => {
      if (!STORY_CATALOG.episodes.some((episode) => episode.id === episodeId)) {
        throw new Error("エピソードが見つかりません。");
      }
      const storyRouteProgress = { ...current.storyRouteProgress };
      delete storyRouteProgress[episodeId];
      return {
        ...current,
        unlockedStories: current.unlockedStories.filter((story) => story.episodeId !== episodeId),
        storyRouteProgress,
      };
    }, `第${episodeId}話と、その選択肢の解放をリセットしました。`);
  };

  return (
    <SettingsCard>
      <SettingsTitle>デバッグ：解放・NT操作</SettingsTitle>
      <Text style={styles.description}>各話の解放リセットとNTの増減を行います。変更は保存されます。</Text>
      <PrimaryButton title="解放・NTを操作する" onPress={() => setIsOpen(true)} />
      <Modal
        visible={isOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={close}
      >
        <SafeAreaView style={styles.screen} accessibilityViewIsModal onAccessibilityEscape={close}>
          <ScreenBackground source={require("@/assets/bg/starry-bg.png")} />
          <View style={styles.header}>
            <Text style={styles.title} accessibilityRole="header">解放・NT操作</Text>
            <Action title="× CLOSE" label="解放・NT操作を閉じる" onPress={close} disabled={busy} />
          </View>
          {feedback ? (
            <Text
              style={[styles.feedback, feedback.error && styles.error]}
              accessibilityRole={feedback.error ? "alert" : "text"}
              accessibilityLiveRegion="polite"
            >
              {feedback.text}
            </Text>
          ) : null}
          <ScrollView
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
          >
            <SettingsCard>
              <SettingsTitle>NTの増減</SettingsTitle>
              <Text style={styles.description}>現在の残高：{state.totalNt} NT</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                inputMode="numeric"
                maxLength={16}
                placeholder="増減するNT（正の整数）"
                placeholderTextColor="#C0C9D0"
                accessibilityLabel="増減するNT"
                editable={!busy}
              />
              <View style={styles.actions}>
                <Action title="追加" onPress={() => adjustNt(1)} disabled={busy} />
                <Action title="減算" onPress={() => adjustNt(-1)} disabled={busy} />
                <Action title="キーボードを閉じる" onPress={Keyboard.dismiss} disabled={busy} />
              </View>
            </SettingsCard>
            <SettingsTitle>メインエピソードの解放リセット</SettingsTitle>
            <Text style={styles.description}>
              対象話を未解放に戻し、初回選択・購入済みの選択肢もリセットします。NTの返還はありません。
              他の話の権利・サイド購入・完了履歴は保持します。再解放は通常の1日1話の条件に従います。
            </Text>
            {STORY_CATALOG.episodes.map((episode) => {
              const unlocked = state.unlockedStories.some((story) => story.episodeId === episode.id);
              const progress = state.storyRouteProgress[episode.id];
              const routeCount = (progress?.firstSelectedRouteId ? 1 : 0) + (progress?.extraUnlockedRouteIds.length ?? 0);
              const hasProgress = unlocked || progress !== undefined;
              return (
                <SettingsCard key={episode.id}>
                  <SettingsTitle>第{episode.id}話　{episode.title}</SettingsTitle>
                  <Text style={styles.description}>{unlocked ? "解放済み" : "未解放"}・選択肢 {routeCount}件解放</Text>
                  {pendingEpisodeId === episode.id ? (
                    <>
                      <Text style={styles.description}>第{episode.id}話と選択肢の解放をリセットしますか？</Text>
                      <View style={styles.actions}>
                        <Action title="リセットする" onPress={() => resetEpisode(episode.id)} disabled={busy} />
                        <Action title="やめる" onPress={() => setPendingEpisodeId(null)} disabled={busy} />
                      </View>
                    </>
                  ) : (
                    <Action
                      title="解放をリセット"
                      label={`第${episode.id}話の解放をリセット`}
                      onPress={() => setPendingEpisodeId(episode.id)}
                      disabled={busy || !hasProgress}
                    />
                  )}
                </SettingsCard>
              );
            })}
            {busy ? <Text style={styles.description} accessibilityLiveRegion="polite">保存しています…</Text> : null}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SettingsCard>
  );
}

function Action({ title, label, onPress, disabled }: {
  title: string;
  label?: string;
  onPress: () => void;
  disabled: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.action, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label ?? title}
      accessibilityState={{ disabled }}
    >
      <Text style={styles.actionText}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#103C54" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, gap: 12 },
  title: { flex: 1, color: "#FFFFFF", fontFamily: Fonts.bold, fontSize: 20 },
  list: { padding: 20, gap: 16 },
  description: { color: "#E0E3EE", fontFamily: Fonts.regular, fontSize: 14, lineHeight: 22 },
  input: {
    color: "#FFFFFF", fontFamily: Fonts.medium, fontSize: 18, minHeight: 48,
    borderWidth: 1, borderColor: "#FFFFFF88", paddingHorizontal: 12, paddingVertical: 8,
  },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  action: {
    minHeight: 44, justifyContent: "center", padding: 12,
    borderWidth: 1, borderColor: "#FFFFFF66", backgroundColor: "#FFFFFF22",
  },
  actionText: { color: "#FFFFFF", fontFamily: Fonts.medium, fontSize: 14 },
  disabled: { opacity: 0.4 },
  feedback: { color: "#FFFFFF", fontFamily: Fonts.medium, paddingHorizontal: 20, paddingVertical: 8 },
  error: { color: "#FFD0C8" },
});

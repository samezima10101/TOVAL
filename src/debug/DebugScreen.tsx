import { router } from "expo-router";
import { useRef, useState } from "react";
import { Keyboard, Modal, Platform, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ScreenBackground from "@/src/components/common/ScreenBackground";
import { SettingsCard, SettingsTitle } from "@/src/components/menu/SettingsLayout";
import { BUILD_ENVIRONMENT, DEBUG_ENABLED } from "@/src/config/environment";
import { Fonts } from "@/src/constants/theme";
import type { AppState } from "@/src/domain/common/types";
import { useAppState } from "@/src/state/AppStateProvider";
import { APP_STATE_STORAGE_KEY } from "@/src/storage/appStateRepository";
import { getStorageDebug } from "@/src/storage/developmentStorage";
import { diaryFixture, requireIdle, resetProgress, storyFixture } from "./debugActions";
import { DEBUG_STORAGE_KEY, useDebugSession } from "./DebugSession";
import { useDebugStateUpdate } from "./StateAccess";
import StateControls from "./StateControls";
import StoryPreview from "./StoryPreview";

type PendingAction = { description: string; transform: (state: AppState) => AppState };

export default function DebugScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const { state, status, startTimer, timerSaveError } = useAppState();
  const { sandbox, setSandbox } = useDebugSession();
  const updateState = useDebugStateUpdate();
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [feedback, setFeedback] = useState<{ text: string; error: boolean } | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const storage = getStorageDebug(sandbox ? DEBUG_STORAGE_KEY : APP_STATE_STORAGE_KEY);

  if (!DEBUG_ENABLED || !state || !updateState) return null;

  const run = async (operation: () => Promise<void>, message: string) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setFeedback(null);
    Keyboard.dismiss();
    try {
      await operation();
      setPending(null);
      setFeedback({ text: message, error: false });
    } catch (cause) {
      setFeedback({ text: cause instanceof Error ? cause.message : "操作できませんでした。", error: true });
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const changeSession = () => void run(async () => {
    // Drain the ordinary save queue before replacing the entire state scope.
    await updateState((current) => { requireIdle(current); return current; });
    storage?.failNextWrites(0);
    setSandbox(!sandbox);
  }, "保存先を切り替えました。");

  const startShortTimer = () => void run(async () => {
    if (!sandbox) throw new Error("テストデータに切り替えてください。");
    await updateState((current) => {
      requireIdle(current);
      return current.taskName ? current : { ...current, taskName: "デバッグ用タスク" };
    });
    await startTimer(5);
    router.push("/timer");
  }, "5秒タイマーを開始しました。");

  const diagnostics = {
    environment: BUILD_ENVIRONMENT,
    data: sandbox ? "sandbox" : "normal",
    platform: Platform.OS,
    osVersion: Platform.Version,
    hydration: status,
    schema: state.schemaVersion,
    nt: state.totalNt,
    completions: state.totalCompletions,
    lastCompletionDate: state.lastCompletionDate,
    episodes: state.unlockedStories.map(({ episodeId }) => episodeId),
    sideStories: state.purchasedSideStoryIds,
    diaryCount: state.diaryLogs.length,
    timer: state.activeTimer ? {
      plannedSeconds: state.activeTimer.plannedSeconds,
      accumulatedMs: state.activeTimer.accumulatedMs,
      running: state.activeTimer.runningSince !== null,
    } : null,
    timerSaveError,
  };

  return (
    <View style={styles.screen}>
      <ScreenBackground source={require("@/assets/bg/starry-bg.png")} />
      <View style={[styles.header, { paddingTop: top + 76 }]}>
        <Text style={styles.title} accessibilityRole="header">デバッグセンター</Text>
        <Action title="閉じる" disabled={busy} onPress={() => router.dismissTo("/menu")} />
      </View>
      {feedback ? <Text style={[styles.feedback, feedback.error && styles.error]} accessibilityRole={feedback.error ? "alert" : "text"} accessibilityLiveRegion="polite">{feedback.text}</Text> : null}
      {busy ? <Text style={styles.feedback} accessibilityLiveRegion="polite">処理しています…</Text> : null}
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottom + 24 }]} keyboardShouldPersistTaps="handled">
        <SettingsCard>
          <SettingsTitle>{BUILD_ENVIRONMENT.toUpperCase()} · {sandbox ? "テストデータ" : "通常データ"}</SettingsTitle>
          <Text style={styles.text}>
            {sandbox
              ? "専用の保存領域で通常の画面を検証できます。通常データのNT・日記・購入状態には影響しません。"
              : "会話プレビューはこのまま使えます。NTや進行を操作するときはテストデータに切り替えてください。"}
          </Text>
          <Text style={styles.text}>切り替え後は画面を開き直します。再起動すると通常データに戻り、テストデータは次回も残ります。</Text>
          <Action title={sandbox ? "通常データに戻る" : "テストデータに切り替える"} onPress={changeSession} disabled={busy || state.activeTimer !== null} />
          {state.activeTimer ? <Text style={styles.text}>切り替え・データ作成はタイマー終了／キャンセル後に行えます。</Text> : null}
        </SettingsCard>
        <StoryPreview />
        {sandbox ? <>
          <SettingsCard>
            <SettingsTitle>タイマー・日次解放</SettingsTitle>
            <Text style={styles.text}>5秒後に通常の終了・日記保存を確認できます。画面を離れた時間は加算せず、獲得NTは実集中秒数です。</Text>
            <Action title="5秒タイマーを開始" onPress={startShortTimer} disabled={busy || state.activeTimer !== null} />
            {state.activeTimer ? <Action title="進行中のタイマーを開く" onPress={() => router.push("/timer")} disabled={busy} /> : null}
            <Text style={styles.text}>次の操作は最終完了日を未設定に戻し、次回完了時にもう1話解放できる状態にします。端末の日付は変更しません。</Text>
            <Action title="日次解放をもう一度試す" onPress={() => setPending({
              description: "最終完了日を未設定に戻します。完了回数・日記・解放済みの話は保持します。",
              transform: (current) => { requireIdle(current); return { ...current, lastCompletionDate: null }; },
            })} disabled={busy || state.activeTimer !== null} />
          </SettingsCard>
          <StateControls />
          <SettingsCard>
            <SettingsTitle>テストデータの作成・リセット</SettingsTitle>
            <Text style={styles.text}>テスト領域の進行・NT・購入・日記を置き換えます。名前・タスク・音量・通知時刻・デフォルト時間は保持します。チュートリアルの初回判定は共通で、リセットしません。</Text>
            <Action title="全話解放・分岐未取得・3000 NT" disabled={busy || state.activeTimer !== null} onPress={() => setPending({ description: "全14話を解放し、分岐・サイド購入・日記を空にして3000 NTにします。", transform: (current) => storyFixture(current, false) })} />
            <Action title="全話・全分岐解放・3000 NT" disabled={busy || state.activeTimer !== null} onPress={() => setPending({ description: "全14話と全分岐を取得済みにし、サイド購入・日記を空にして3000 NTにします。", transform: (current) => storyFixture(current, true) })} />
            <Action title="3日分の日記を作成" disabled={busy || state.activeTimer !== null} onPress={() => setPending({ description: "進行をリセットし、今日・昨日・一昨日の空／改行／長文日記3件を作成します。", transform: diaryFixture })} />
            <Action title="進行を最初に戻す" disabled={busy || state.activeTimer !== null} onPress={() => setPending({ description: "テストデータのNT・完了回数・日次判定・全会話権利・購入・日記をリセットします。", transform: resetProgress })} />
          </SettingsCard>
          <SettingsCard>
            <SettingsTitle>保存失敗の再現</SettingsTitle>
            <Text style={styles.text}>次の保存1回を失敗させます。操作対象はテストデータだけです。タイマー停止などの自動保存でも消費されるため、タイマーのない状態で購入・NT変更などを試してください。</Text>
            <Action title="次の保存1回を失敗させる" disabled={busy || !storage || state.activeTimer !== null} onPress={() => {
              storage?.failNextWrites(1);
              setFeedback({ text: "次の保存を1回失敗させます。失敗後は同じ操作を再試行できます。", error: false });
            }} />
            <Action title="失敗予約を解除" disabled={busy || !storage} onPress={() => {
              storage?.failNextWrites(0);
              setFeedback({ text: "失敗予約を解除しました。", error: false });
            }} />
            <Text style={styles.text}>画面を閉じても未消費の失敗予約は残ります。通常データへの切り替え・再起動で解除します。</Text>
          </SettingsCard>
        </> : null}
        {pending ? (
          <Modal transparent animationType="fade" visible onRequestClose={() => { if (!busyRef.current) setPending(null); }}>
            <View style={[styles.confirmation, { paddingTop: top + 24, paddingBottom: bottom + 24 }]} accessibilityViewIsModal>
              <ScrollView contentContainerStyle={styles.confirmationContent}>
                <SettingsCard>
                  <SettingsTitle>テストデータを変更しますか？</SettingsTitle>
                  <Text style={styles.text}>{pending.description}</Text>
                  {feedback?.error ? <Text style={[styles.text, styles.error]} accessibilityRole="alert">{feedback.text}</Text> : null}
                  <Action title={busy ? "保存しています…" : "変更する"} disabled={busy} onPress={() => void run(() => updateState(pending.transform), "テストデータを保存しました。")} />
                  <Action title="やめる" disabled={busy} onPress={() => setPending(null)} />
                </SettingsCard>
              </ScrollView>
            </View>
          </Modal>
        ) : null}
        <SettingsCard>
          <SettingsTitle>現在の状態</SettingsTitle>
          <Text selectable style={styles.text}>{JSON.stringify(diagnostics, null, 2)}</Text>
          <Text style={styles.text}>共有する情報に名前・タスク名・日記本文は含めません。</Text>
          <Action title="状態を共有" disabled={busy} onPress={() => void run(async () => {
            await Share.share({ message: JSON.stringify(diagnostics, null, 2) });
          }, "共有画面を閉じました。")} />
        </SettingsCard>
      </ScrollView>
    </View>
  );
}

function Action({ title, onPress, disabled }: { title: string; onPress: () => void; disabled: boolean }) {
  return <TouchableOpacity style={[styles.action, disabled && styles.disabled]} onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityState={{ disabled }}>
    <Text style={styles.actionText}>{title}</Text>
  </TouchableOpacity>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 8, flexDirection: "row", gap: 8, alignItems: "center" },
  title: { flex: 1, color: "#FFFFFF", fontFamily: Fonts.bold, fontSize: 22 },
  content: { paddingHorizontal: 20, gap: 20 },
  confirmation: { flex: 1, backgroundColor: "#061D2AF2", paddingHorizontal: 20, justifyContent: "center" },
  confirmationContent: { flexGrow: 1, justifyContent: "center" },
  feedback: { color: "#E0E3EE", fontFamily: Fonts.regular, fontSize: 14, lineHeight: 22, paddingHorizontal: 20, paddingBottom: 8 },
  text: { color: "#E0E3EE", fontFamily: Fonts.regular, fontSize: 14, lineHeight: 22 },
  error: { color: "#FFD0C8" },
  action: { minHeight: 48, justifyContent: "center", padding: 12, borderWidth: 1, borderColor: "#FFFFFF66", backgroundColor: "#FFFFFF22" },
  actionText: { color: "#FFFFFF", fontFamily: Fonts.medium, fontSize: 14, lineHeight: 22 },
  disabled: { opacity: 0.4 },
});

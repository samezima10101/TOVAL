import React from "react";
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import PrimaryButton from "@/src/components/common/PrimaryButton";
import StoryCharacters from "@/src/components/story/StoryCharacters";
import StoryMessageBox from "@/src/components/story/StoryMessageBox";
import { Colors } from "@/src/constants/theme";
import { StoryEpisode } from "@/src/domain/common/types";
import useStoryReader from "@/src/hooks/useStoryReader";
import { useAppState } from "@/src/state/AppStateProvider";

// Temporary tutorial dialogue; kept separate from the normal episode catalog.
const intro: StoryEpisode = {
  id: 0, title: "My-Juneへようこそ", commonBefore: [
    { id: "tutorial-welcome", speaker: "boss", text: "My-Juneへようこそ！\nここでは私たちと一緒に、毎日のタスクに取り組んでいこう。", left: "talk", right: "normal" },
    { id: "tutorial-profile", speaker: "sub", text: "まずは、あなたのお名前と\n取り組みたいタスクを教えてください。", left: "normal", right: "talk" },
    { id: "tutorial-ready", speaker: "boss", text: "ありがとう！\nそれじゃあ、ホーム画面で使い方を試してみよう。", left: "talk", right: "normal" },
  ], commonAfter: [],
};

export default function TutorialStory() {
  const { state, setTutorialProfile, advanceTutorial } = useAppState();
  const [name, setName] = React.useState(state?.userName ?? "");
  const [task, setTask] = React.useState(state?.taskName ?? "");
  const [profileSaved, setProfileSaved] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const reader = useStoryReader(intro, "home", async () => advanceTutorial(), undefined, undefined, () => undefined);
  const isProfile = reader.line?.id === "tutorial-profile" && !reader.isTyping && !profileSaved;
  const saveProfile = async () => {
    if (saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      await setTutorialProfile(name, task);
      setProfileSaved(true);
      await reader.handleNext();
    } catch (cause) { setSaveError(cause instanceof Error ? cause.message : "保存できませんでした。"); }
    finally { setSaving(false); }
  };
  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <Text style={styles.title}>チュートリアル · {intro.title}</Text>
      <StoryCharacters leftExpression={reader.line?.left} rightExpression={reader.line?.right} activeSpeaker={reader.line?.speaker} />
      <KeyboardAvoidingView behavior="padding">
        {isProfile ? (
          <ScrollView keyboardShouldPersistTaps="handled" style={styles.form}>
            <Text style={styles.label}>あなたの名前</Text>
            <TextInput accessibilityLabel="ユーザー名" value={name} onChangeText={setName} maxLength={40} editable={!saving} style={styles.input} placeholder="名前を入力" />
            <Text style={styles.label}>取り組むタスク</Text>
            <TextInput accessibilityLabel="チュートリアルのタスク" value={task} onChangeText={setTask} maxLength={100} editable={!saving} style={styles.input} placeholder="例：読書" />
            {saveError ? <Text style={styles.error} accessibilityRole="alert">{saveError}</Text> : null}
            <PrimaryButton title="名前とタスクを設定" onPress={() => void saveProfile()} disabled={saving || !name.trim() || !task.trim()} loading={saving} />
          </ScrollView>
        ) : reader.line ? (
          <StoryMessageBox speaker={reader.line.speaker} text={reader.visibleText} fullText={reader.line.text} isTyping={reader.isTyping} isLastLine={reader.isLastLine} isProcessing={reader.isProcessing} onNext={() => void reader.handleNext()} />
        ) : null}
        {reader.error ? <Text style={styles.error} accessibilityRole="alert">{reader.error}</Text> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  title: { color: Colors.primary, fontSize: 18, fontWeight: "800", padding: 18 },
  form: { paddingHorizontal: 20, marginBottom: 20, maxHeight: 330 },
  label: { color: Colors.text, fontWeight: "700", marginVertical: 8 },
  input: { borderColor: Colors.border, borderWidth: 1, borderRadius: 10, backgroundColor: Colors.surface, color: Colors.text, padding: 12, marginBottom: 12 },
  error: { color: Colors.warning, padding: 12 },
});

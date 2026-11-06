import { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";

import { KeyboardEditorInput } from "@/src/components/common/KeyboardEditor";
import PrimaryButton from "@/src/components/common/PrimaryButton";
import { Fonts } from "@/src/constants/theme";
import { MAX_TASK_NAME_LENGTH } from "@/src/domain/common/types";
import { MAX_USER_NAME_LENGTH } from "@/src/domain/reminder";
import { useAppState } from "@/src/state/AppStateProvider";
import { useTutorial } from "./TutorialContext";
import useTutorialModal from "./useTutorialModal";

export default function IntroInput({
  field,
}: {
  field: "userName" | "taskName";
}) {
  const { state, setUserName, setTaskName } = useAppState();
  const tutorial = useTutorial();
  const modal = useTutorialModal("input");
  const [draft, setDraft] = useState(() =>
    field === "userName"
      ? state?.userName === "ゲスト"
        ? ""
        : (state?.userName ?? "")
      : (state?.taskName ?? ""),
  );
  const limit =
    field === "userName" ? MAX_USER_NAME_LENGTH : MAX_TASK_NAME_LENGTH;
  return (
    <Modal
      transparent
      animationType="fade"
      visible={!tutorial.closing}
      {...modal}
      onRequestClose={() => tutorial.close("skipped")}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>
            {field === "userName" ? "名前を入力" : "タスクを入力"}
          </Text>
          <KeyboardEditorInput
            value={draft}
            onChangeText={setDraft}
            maxLength={limit}
            editable={!tutorial.busy}
            accessibilityLabel={
              field === "userName" ? "ユーザー名" : "タスク名"
            }
            style={styles.input}
          />
          <Text style={styles.text}>
            {draft.length} / {limit}
          </Text>
          {tutorial.error ? (
            <Text style={styles.text} accessibilityRole="alert">
              {tutorial.error}
            </Text>
          ) : null}
          <PrimaryButton
            title="保存して次へ"
            disabled={tutorial.busy || !draft.trim() || draft.length > limit}
            onPress={() =>
              tutorial.run(async () => {
                if (field === "userName") await setUserName(draft);
                else await setTaskName(draft);
                Keyboard.dismiss();
                tutorial.savedIntroInput();
              })
            }
          />
          <TouchableOpacity
            style={styles.skip}
            disabled={tutorial.busy}
            onPress={() => tutorial.close("skipped")}
            accessibilityRole="button"
          >
            <Text style={styles.text}>チュートリアルをスキップ</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.75)",
    padding: 24,
  },
  content: { flexGrow: 1, justifyContent: "center", gap: 12 },
  title: { color: "#FFFFFF", fontFamily: Fonts.bold, fontSize: 22 },
  text: { color: "#FFFFFF", fontFamily: Fonts.medium },
  input: {
    flex: 0,
    minHeight: 90,
    maxHeight: 140,
    backgroundColor: "#14324E",
    borderWidth: 1,
    borderColor: "#C9DAFF",
    borderRadius: 12,
    padding: 14,
  },
  skip: { minHeight: 44, justifyContent: "center", alignItems: "center" },
});

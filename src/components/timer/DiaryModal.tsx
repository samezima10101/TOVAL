import React from "react";
import {
  KeyboardAvoidingView,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import PrimaryButton from "@/src/components/common/PrimaryButton";
import CoachMark from "@/src/components/tutorial/CoachMark";
import { Colors } from "@/src/constants/theme";

type DiaryModalProps = {
  visible: boolean;
  tutorial?: boolean;
  saving: boolean;
  error: string | null;
  onSave: (diary: string) => Promise<void>;
  onClose: () => void;
};

export default function DiaryModal({
  visible,
  tutorial = false,
  saving,
  error,
  onSave,
  onClose,
}: DiaryModalProps) {
  const [diary, setDiary] = React.useState("");

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <KeyboardAvoidingView behavior="padding" style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>タスクを振り返ってみませんか？</Text>
          {tutorial ? <CoachMark title="日記を書く" text="今日取り組んだことや感想を残せます。空欄でも保存できます。「保存して終了」を押すとホームに戻ります。日記はログから読み返せます。" /> : null}
          <TextInput
            value={diary}
            onChangeText={setDiary}
            placeholder="今日のタスクで感じたことを書いてみよう"
            multiline
            maxLength={1000}
            editable={!saving}
            accessibilityLabel="日記"
            style={styles.input}
          />
          {error ? (
            <Text accessibilityRole="alert" style={styles.error}>{error}</Text>
          ) : null}
          <PrimaryButton
            title="保存して終了"
            onPress={() => void onSave(diary)}
            loading={saving}
            disabled={saving}
          />
          <TouchableOpacity
            onPress={onClose}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="日記を閉じる"
            style={styles.closeButton}
          >
            <Text style={styles.closeText}>戻る</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  content: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    gap: 16,
    padding: 20,
    width: "100%",
  },
  title: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  input: {
    borderColor: Colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: Colors.text,
    minHeight: 140,
    padding: 14,
    textAlignVertical: "top",
  },
  error: { color: Colors.warning, fontSize: 13, textAlign: "center" },
  closeButton: { alignItems: "center", padding: 8 },
  closeText: { color: Colors.textSub, fontWeight: "700" },
});

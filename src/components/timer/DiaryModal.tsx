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
import { Colors, Fonts } from "@/src/constants/theme";
import { MAX_DIARY_LENGTH } from "@/src/domain/common/types";

type DiaryModalProps = {
  visible: boolean;
  saving: boolean;
  error: string | null;
  onSave: (diary: string) => Promise<void>;
  onClose: () => void;
  onRetrySave?: () => void;
};

export default function DiaryModal({
  visible,
  saving,
  error,
  onSave,
  onClose,
  onRetrySave,
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
          <TextInput
            value={diary}
            onChangeText={setDiary}
            placeholder="今日のタスクで感じたことを書いてみよう"
            multiline
            maxLength={MAX_DIARY_LENGTH}
            editable={!saving}
            accessibilityLabel="日記"
            style={styles.input}
          />
          {error ? (
            <Text accessibilityRole="alert" style={styles.error}>{error}</Text>
          ) : null}
          {onRetrySave ? <PrimaryButton title="タイマー保存を再試行" onPress={onRetrySave} disabled={saving} /> : null}
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
    fontFamily: Fonts.bold,
    textAlign: "center",
  },
  input: {
    fontFamily: Fonts.regular,
    borderColor: Colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: Colors.text,
    minHeight: 140,
    padding: 14,
    textAlignVertical: "top",
  },
  error: { fontFamily: Fonts.regular, color: Colors.warning, fontSize: 13, textAlign: "center" },
  closeButton: { alignItems: "center", padding: 8 },
  closeText: { color: Colors.textSub, fontFamily: Fonts.bold },
});

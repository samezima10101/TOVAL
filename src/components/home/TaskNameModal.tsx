import React from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { Colors, Fonts } from "@/src/constants/theme";
import { MAX_TASK_NAME_LENGTH } from "@/src/domain/common/types";

export default function TaskNameModal({
  visible,
  required = false,
  initialValue,
  onClose,
  onSave,
}: {
  visible: boolean;
  required?: boolean;
  initialValue: string;
  onClose: () => void;
  onSave: (taskName: string) => Promise<void>;
}) {
  const [value, setValue] = React.useState(initialValue);
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (visible) {
      // Native Modal stays mounted when hidden; reset its draft on each opening.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValue(initialValue);
      setError(null);
    }
  }, [initialValue, visible]);

  const handleSave = async () => {
    if (!value.trim()) {
      setError("タスク名を入力してください。");
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      await onSave(value);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "保存できませんでした。",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!required) onClose();
      }}
      accessibilityViewIsModal
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.title}>
            {required ? "タスクを設定" : "タスクを編集"}
          </Text>
          <Text style={styles.description}>
            集中するタスクを1件だけ登録できます。
          </Text>
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder="例：英単語を覚える"
            placeholderTextColor={Colors.textSub}
            style={styles.input}
            autoFocus
            maxLength={MAX_TASK_NAME_LENGTH}
            returnKeyType="done"
            onSubmitEditing={() => void handleSave()}
            accessibilityLabel="タスク名"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.disabled]}
            onPress={() => void handleSave()}
            disabled={isSaving}
            accessibilityRole="button"
            accessibilityLabel="タスク名を保存"
            accessibilityState={{ disabled: isSaving, busy: isSaving }}
          >
            <Text style={styles.saveText}>{isSaving ? "保存中…" : "保存"}</Text>
          </TouchableOpacity>
          {!required ? (
            <TouchableOpacity
              onPress={onClose}
              style={styles.cancelButton}
              disabled={isSaving}
              accessibilityRole="button"
              accessibilityLabel="タスク編集をキャンセル"
            >
              <Text style={styles.cancelText}>キャンセル</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
  },
  title: {
    color: Colors.text,
    fontSize: 22,
    fontFamily: Fonts.bold,
    textAlign: "center",
  },
  description: {
    fontFamily: Fonts.regular,
    color: Colors.textSub,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
    textAlign: "center",
  },
  input: {
    fontFamily: Fonts.regular,
    borderColor: Colors.border,
    borderRadius: 10,
    borderWidth: 1,
    color: Colors.text,
    fontSize: 17,
    marginTop: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  error: {
    fontFamily: Fonts.regular,
    color: Colors.warning,
    fontSize: 13,
    marginTop: 8,
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: Colors.accent,
    borderRadius: 28,
    marginTop: 20,
    paddingVertical: 15,
  },
  disabled: {
    opacity: 0.6,
  },
  saveText: {
    color: Colors.surface,
    fontSize: 17,
    fontFamily: Fonts.bold,
  },
  cancelButton: {
    alignItems: "center",
    marginTop: 12,
    padding: 8,
  },
  cancelText: {
    color: Colors.textSub,
    fontSize: 15,
    fontFamily: Fonts.medium,
  },
});

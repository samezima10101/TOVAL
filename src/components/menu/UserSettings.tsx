import { useCallback, useRef, useState } from "react";
import { Keyboard, StyleSheet, Text, TextInput } from "react-native";

import {
  KeyboardEditorInput,
  KeyboardEditorToolbar,
} from "@/src/components/common/KeyboardEditor";
import { SettingsCard, SettingsTitle } from "@/src/components/menu/SettingsLayout";
import { Fonts } from "@/src/constants/theme";
import { MAX_TASK_NAME_LENGTH } from "@/src/domain/common/types";
import { MAX_USER_NAME_LENGTH } from "@/src/domain/reminder";
import { useAppState } from "@/src/state/AppStateProvider";

type TextSettingKey = "taskName" | "userName";

const TEXT_SETTINGS = [
  {
    key: "taskName",
    title: "集中するタスク",
    label: "タスク名",
    placeholder: "集中するタスクを入力",
    limit: MAX_TASK_NAME_LENGTH,
  },
  {
    key: "userName",
    title: "ユーザー名",
    label: "ユーザー名",
    placeholder: "ユーザー名を入力",
    limit: MAX_USER_NAME_LENGTH,
  },
] as const;

// Share one editor between the cards inside the scroll area and its toolbar.
export function useUserSettings() {
  const { state, setTaskName, setUserName } = useAppState();
  const inputRefs = useRef<Record<TextSettingKey, TextInput | null>>({
    taskName: null,
    userName: null,
  });
  const textSavingRef = useRef(false);
  const [editingField, setEditingField] = useState<TextSettingKey | null>(null);
  const [drafts, setDrafts] = useState<Partial<Record<TextSettingKey, string>>>({});
  const [errors, setErrors] = useState<
    Partial<Record<TextSettingKey, string | null>>
  >({});
  const [textSaving, setTextSaving] = useState(false);
  const getInput = useCallback(
    () => Object.values(inputRefs.current).find((input) => input?.isFocused()),
    [],
  );

  const clearTextDraft = (field: TextSettingKey) => {
    setDrafts((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
    setErrors((current) => ({ ...current, [field]: null }));
  };

  const cancelTextEdit = () => {
    if (textSavingRef.current || !editingField) return;
    clearTextDraft(editingField);
    setEditingField(null);
    Keyboard.dismiss();
  };

  const saveTextEdit = async () => {
    if (textSavingRef.current || !editingField || !state) return;
    const field = editingField;
    const value = drafts[field] ?? state[field];
    const label = field === "taskName" ? "タスク名" : "ユーザー名";
    const limit = field === "taskName" ? MAX_TASK_NAME_LENGTH : MAX_USER_NAME_LENGTH;
    // Legacy values can exceed today's cap. Preserve them until shortened;
    // the keyboard's Done action must follow the same guard as the OK button.
    if (value.length > limit) return;
    if (!value.trim()) {
      setErrors((current) => ({
        ...current,
        [field]: label + "を入力してください。",
      }));
      inputRefs.current[field]?.focus();
      return;
    }
    textSavingRef.current = true;
    setTextSaving(true);
    setErrors((current) => ({ ...current, [field]: null }));
    try {
      await (field === "taskName" ? setTaskName : setUserName)(value);
      clearTextDraft(field);
      setEditingField(null);
      Keyboard.dismiss();
    } catch (cause) {
      setErrors((current) => ({
        ...current,
        [field]:
          cause instanceof Error
            ? cause.message
            : label + "を保存できませんでした。",
      }));
      requestAnimationFrame(() => inputRefs.current[field]?.focus());
    } finally {
      textSavingRef.current = false;
      setTextSaving(false);
    }
  };

  const beginEdit = (field: TextSettingKey) => {
    if (!state) return;
    setDrafts((current) => ({
      ...current,
      [field]: current[field] ?? state[field],
    }));
    setEditingField(field);
  };

  const changeText = (field: TextSettingKey, value: string) => {
    setDrafts((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: null }));
  };

  const activeSetting = TEXT_SETTINGS.find(({ key }) => key === editingField);
  const activeDraft = editingField
    ? (drafts[editingField] ?? state?.[editingField] ?? "")
    : "";

  return {
    values: state && { taskName: state.taskName, userName: state.userName },
    inputRefs,
    getInput,
    editingField,
    drafts,
    errors,
    textSaving,
    beginEdit,
    changeText,
    cancelTextEdit,
    saveTextEdit,
    activeSetting,
    activeLength: activeDraft.length,
  };
}

type UserSettingsEditor = ReturnType<typeof useUserSettings>;

export default function UserSettings({
  editor,
  onRevealInput,
}: {
  editor: UserSettingsEditor;
  onRevealInput: () => void;
}) {
  const { values, inputRefs, editingField, drafts, errors, textSaving } = editor;
  if (!values) return null;

  return (
    <>
      {TEXT_SETTINGS.map((setting) => (
        <SettingsCard key={setting.key}>
          <SettingsTitle>{setting.title}</SettingsTitle>
          <KeyboardEditorInput
            ref={(input) => {
              inputRefs.current[setting.key] = input;
            }}
            autoFocus={false}
            multiline={false}
            value={drafts[setting.key] ?? values[setting.key]}
            onFocus={() => {
              editor.beginEdit(setting.key);
              onRevealInput();
            }}
            onLayout={onRevealInput}
            onChangeText={(value) => editor.changeText(setting.key, value)}
            style={[
              styles.value,
              styles.textInput,
              editingField === setting.key && styles.textInputActive,
            ]}
            maxLength={setting.limit}
            editable={!textSaving}
            placeholder={setting.placeholder}
            placeholderTextColor="#B7BCCB"
            autoCorrect={false}
            returnKeyType="done"
            submitBehavior="submit"
            onSubmitEditing={() => void editor.saveTextEdit()}
            accessibilityLabel={setting.label}
            accessibilityHint={
              "タップして" + setting.limit + "文字以内で編集します"
            }
          />
          {editingField !== setting.key &&
          drafts[setting.key] !== undefined &&
          drafts[setting.key] !== values[setting.key] ? (
            <Text style={styles.status}>未保存</Text>
          ) : null}
          {errors[setting.key] ? (
            <Text style={styles.error} accessibilityRole="alert">
              {errors[setting.key]}
            </Text>
          ) : null}
        </SettingsCard>
      ))}
    </>
  );
}

export function UserSettingsToolbar({
  editor,
  bottom,
}: {
  editor: UserSettingsEditor;
  bottom: number;
}) {
  const { activeSetting, activeLength } = editor;
  if (!activeSetting) return null;

  return (
    <KeyboardEditorToolbar
      bottom={bottom}
      onCancel={editor.cancelTextEdit}
      onSave={() => void editor.saveTextEdit()}
      busy={editor.textSaving}
      saveDisabled={activeLength > activeSetting.limit}
      cancelLabel={activeSetting.label + "の編集をキャンセル"}
      saveLabel={activeSetting.label + "の変更を保存"}
      status={activeLength + " / " + activeSetting.limit + "文字"}
    />
  );
}

const styles = StyleSheet.create({
  value: { color: "#FFFFFF", fontFamily: Fonts.medium, fontSize: 18 },
  textInput: {
    flex: 0,
    minHeight: 44,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0,
    backgroundColor: "rgba(0, 31, 111, 0.14)",
  },
  textInputActive: { backgroundColor: "rgba(33, 44, 77, 0.25)" },
  status: { color: "#E0E3EE", fontFamily: Fonts.regular, fontSize: 12 },
  error: { color: "#FFE0E7", fontFamily: Fonts.regular, fontSize: 13 },
});

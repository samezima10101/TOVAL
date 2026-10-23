import { forwardRef, useEffect, useState } from "react";
import {
  Keyboard, Platform, StyleSheet, Text, TextInput, TouchableOpacity,
  useWindowDimensions, View, type KeyboardEvent, type TextInputProps, type TextStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Fonts } from "@/src/constants/theme";

export const KEYBOARD_EDITOR_TOOLBAR_HEIGHT = 48;

/** For a full-screen modal: reserve the keyboard and toolbar below its content. */
export function useKeyboardEditor() {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  useEffect(() => {
    const update = (event: KeyboardEvent) => {
      if (Platform.OS === "ios") Keyboard.scheduleLayoutAnimation(event);
      setKeyboardHeight(Math.max(0, height - event.endCoordinates.screenY));
    };
    const hide = () => setKeyboardHeight(0);
    const subscriptions = [
      Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillChangeFrame" : "keyboardDidShow", update),
      Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide", hide),
    ];
    return () => subscriptions.forEach((subscription) => subscription.remove());
  }, [height]);
  const toolbarBottom = keyboardHeight > 0 ? keyboardHeight : insets.bottom;
  return {
    toolbarBottom,
    contentBottomInset: toolbarBottom + KEYBOARD_EDITOR_TOOLBAR_HEIGHT + 12,
  };
}

type EditorInputProps = TextInputProps & {
  autoGrow?: boolean;
  maxInputHeight?: number;
};

/** Give this input bounded space (a fixed height or flex: 1 in a bounded parent).
 * Native text scrolling keeps the selection visible without estimating wrapped
 * Japanese text, or moving the selection during IME composition.
 */
export const KeyboardEditorInput = forwardRef<TextInput, EditorInputProps>(
  function KeyboardEditorInput({ style, autoGrow = false, maxInputHeight = 160, onContentSizeChange, ...props }, ref) {
    const [contentHeight, setContentHeight] = useState(46);
    const inputHeight = Math.min(contentHeight, Math.max(46, maxInputHeight));
    const input = (
      <TextInput
        autoFocus
        multiline
        textAlignVertical="top"
        selectionColor="#E0DFFF"
        maxFontSizeMultiplier={1.3}
        {...props}
        ref={ref}
        onContentSizeChange={(event) => {
          onContentSizeChange?.(event);
        }}
        scrollEnabled={!autoGrow || contentHeight > inputHeight}
        caretHidden={false}
        style={[styles.input, style, autoGrow && { flexGrow: 0, flexShrink: 0, flexBasis: "auto", height: inputHeight }]}
      />
    );
    if (!autoGrow) return input;
    return (
      <View style={styles.growingInput}>
        <Text
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
          allowFontScaling={props.allowFontScaling}
          maxFontSizeMultiplier={props.maxFontSizeMultiplier ?? 1.3}
          onTextLayout={({ nativeEvent: { lines } }) => {
            // Measure independently of the TextInput's currently constrained
            // native content size. The sentinel includes a trailing empty line.
            const lineHeight = lines.reduce((total, line) => total + line.height, 0);
            const flat: TextStyle = StyleSheet.flatten([styles.input, style]);
            const top = flat.paddingTop ?? flat.paddingVertical ?? flat.padding ?? 0;
            const bottom = flat.paddingBottom ?? flat.paddingVertical ?? flat.padding ?? 0;
            const border = flat.borderWidth ?? 0;
            setContentHeight(Math.max(46, Math.ceil(lineHeight + Number(top) + Number(bottom) + border * 2)));
          }}
          style={[styles.input, style, styles.measureText]}
        >
          {`${props.value ?? props.defaultValue ?? ""}\u200b`}
        </Text>
        {input}
      </View>
    );
  },
);

type ToolbarProps = {
  bottom: number;
  onCancel: () => void;
  onSave: () => void;
  busy?: boolean;
  saveDisabled?: boolean;
  cancelLabel?: string;
  saveLabel?: string;
  status?: string;
};

export function KeyboardEditorToolbar({
  bottom, onCancel, onSave, busy = false, saveDisabled = false,
  cancelLabel = "編集をキャンセル", saveLabel = "変更を保存", status,
}: ToolbarProps) {
  return (
    <View style={[styles.toolbar, { bottom }]}>
      <TouchableOpacity onPress={onCancel} disabled={busy}
        accessibilityRole="button" accessibilityLabel={cancelLabel}
        accessibilityState={{ disabled: busy }} style={[styles.button, busy && styles.disabled]}>
        <Text style={styles.buttonText}>✕</Text>
      </TouchableOpacity>
      {status ? <Text style={styles.status} numberOfLines={1}>{status}</Text> : null}
      <TouchableOpacity onPress={onSave} disabled={busy || saveDisabled}
        accessibilityRole="button" accessibilityLabel={busy ? "保存中" : saveLabel}
        accessibilityState={{ disabled: busy || saveDisabled, busy }}
        style={[styles.button, (busy || saveDisabled) && styles.disabled]}>
        <Text style={styles.buttonText}>{busy ? "保存中…" : "OK"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  growingInput: { alignSelf: "stretch" },
  measureText: { position: "absolute", top: 0, left: 0, right: 0, height: undefined, minHeight: undefined, maxHeight: undefined, flexGrow: 0, flexShrink: 0, flexBasis: "auto", opacity: 0 },
  input: { flex: 1, minHeight: 0, fontFamily: Fonts.regular, borderWidth: 1, borderColor: "rgba(255,255,255,0.6)", backgroundColor: "rgba(0,0,0,0.2)", padding: 10, color: "#FFFFFF", fontSize: 16, lineHeight: 24 },
  toolbar: { position: "absolute", left: 0, right: 0, height: KEYBOARD_EDITOR_TOOLBAR_HEIGHT, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, backgroundColor: "#343947", borderTopColor: "#9CA3B3", borderTopWidth: 1 },
  button: { minWidth: 64, minHeight: 44, justifyContent: "center", alignItems: "center", paddingHorizontal: 12 },
  buttonText: { color: "#FFFFFF", fontFamily: Fonts.medium, fontSize: 18 },
  status: { color: "#E0E3EE", fontFamily: Fonts.regular, fontSize: 12, flexShrink: 1 },
  disabled: { opacity: 0.2 },
});

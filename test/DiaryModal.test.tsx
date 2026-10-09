import React from "react";
import { Text, TextInput } from "react-native";
import TestRenderer, { act } from "react-test-renderer";

import PrimaryButton from "@/src/components/common/PrimaryButton";
import DiaryModal from "@/src/components/timer/DiaryModal";

it("shows save failures inside the open diary and keeps the draft for retry", async () => {
  const onSave = jest.fn(async () => undefined);
  const props = { visible: true, saving: false, onSave, onClose: jest.fn() };
  let renderer!: TestRenderer.ReactTestRenderer;
  try {
    await act(async () => {
      renderer = TestRenderer.create(<DiaryModal {...props} error={null} />);
    });
    await act(async () => {
      renderer.root.findByType(TextInput).props.onChangeText("書きかけの日記");
    });
    await act(async () => {
      renderer.update(<DiaryModal {...props} error="アプリ状態を保存できませんでした。" />);
    });

    const errorText = renderer.root.findAllByType(Text)
      .find((text) => text.props.accessibilityRole === "alert");
    expect(errorText?.props.children).toBe("アプリ状態を保存できませんでした。");
    expect(renderer.root.findByType(TextInput).props.value).toBe("書きかけの日記");
    expect(renderer.root.findByType(PrimaryButton).props.disabled).toBe(false);
    await act(async () => {
      renderer.root.findByType(PrimaryButton).props.onPress();
    });
    expect(onSave).toHaveBeenCalledWith("書きかけの日記");
  } finally {
    await act(async () => { renderer?.unmount(); });
  }
});

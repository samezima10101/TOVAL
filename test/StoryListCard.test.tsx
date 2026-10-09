import React from "react";
import { TouchableOpacity } from "react-native";
import TestRenderer, { act } from "react-test-renderer";

import StoryListCard from "@/src/components/common/StoryListCard";

it("keeps a locked story unavailable and lets an unlocked story be opened", async () => {
  const onPress = jest.fn();
  let renderer!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(
      <StoryListCard
        label="Side Story"
        title="雨宿りの帰り道"
        detail="60 NTで解放"
        isUnlocked={false}
        action="解放"
        actionLabel="雨宿りの帰り道を解放"
        disabled
        onPress={onPress}
      />,
    );
  });
  expect(renderer.root.findByType(TouchableOpacity).props.disabled).toBe(true);
  await act(async () => {
    renderer.update(
      <StoryListCard
        label="Side Story"
        title="雨宿りの帰り道"
        detail="解放済み"
        isUnlocked
        action="▶ 再生"
        actionLabel="雨宿りの帰り道を再生"
        disabled={false}
        onPress={onPress}
      />,
    );
  });
  const button = renderer.root.findByType(TouchableOpacity);
  expect(button.props.accessibilityLabel).toBe("雨宿りの帰り道を再生");
  await act(async () => button.props.onPress());
  expect(onPress).toHaveBeenCalledTimes(1);
  await act(async () => renderer.unmount());
});

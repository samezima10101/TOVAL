import { useState } from "react";
import { Keyboard, StyleSheet, Text, TextInput, View } from "react-native";

import { SettingsCard, SettingsTitle } from "@/src/components/menu/SettingsLayout";
import { Fonts } from "@/src/constants/theme";
import type { AppState } from "@/src/domain/common/types";
import { DebugAction, debugStyles } from "./DebugControls";
import { adjustNt } from "./debugActions";

export default function NtControls({ state, disabled, onChange }: {
  state: AppState;
  disabled: boolean;
  onChange: (transform: (state: AppState) => AppState, message: string) => void;
}) {
  const [amount, setAmount] = useState("");
  const adjust = (direction: 1 | -1) => onChange((current) => adjustNt(current, amount, direction),
    `${amount.trim()} NTを${direction === 1 ? "追加" : "減算"}しました。`);

  return <SettingsCard>
    <SettingsTitle>NT操作</SettingsTitle>
    <Text style={debugStyles.text}>現在の残高：{state.totalNt} NT</Text>
    <TextInput style={styles.input} value={amount} onChangeText={setAmount} inputMode="numeric" maxLength={16}
      placeholder="増減するNT（正の整数）" placeholderTextColor="#C0C9D0" accessibilityLabel="増減するNT" editable={!disabled} />
    <View style={styles.actions}>
      <DebugAction title="追加" onPress={() => adjust(1)} disabled={disabled} />
      <DebugAction title="減算" onPress={() => adjust(-1)} disabled={disabled} />
    </View>
    <DebugAction title="キーボードを閉じる" onPress={Keyboard.dismiss} disabled={disabled} />
    <Text style={debugStyles.text}>NT残高だけを変更します。ストーリーの進捗は変わりません。</Text>
  </SettingsCard>;
}

const styles = StyleSheet.create({
  input: { minHeight: 56, borderWidth: 1, borderColor: "#FFFFFF66", borderRadius: 4, paddingHorizontal: 12, paddingVertical: 12, color: "#FFFFFF", fontFamily: Fonts.regular, fontSize: 16 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
});

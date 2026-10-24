import { StyleSheet, Text } from "react-native";

import NativeTimeSetting from "@/src/components/menu/NativeTimeSetting";
import { SettingsCard, SettingsRow } from "@/src/components/menu/SettingsLayout";
import { Fonts } from "@/src/constants/theme";
import { useAppState } from "@/src/state/AppStateProvider";

export default function DefaultTimerSettings() {
  const { state, setDefaultTimerMinutes } = useAppState();

  if (!state) return null;

  return (
    <SettingsCard>
      <SettingsRow title="デフォルト時間">
        <NativeTimeSetting
          kind="duration"
          minutes={state.defaultTimerMinutes}
          onSave={setDefaultTimerMinutes}
        />
      </SettingsRow>
      <Text style={styles.description}>
        ホームのタイマー設定を開いたときの初期値です。
      </Text>
    </SettingsCard>
  );
}

const styles = StyleSheet.create({
  description: {
    color: "#E0E3EE",
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 22,
  },
});

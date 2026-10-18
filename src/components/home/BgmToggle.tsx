import React from "react";
import { StyleSheet, Switch, Text, View } from "react-native";

import PrimaryButton from "@/src/components/common/PrimaryButton";
import { Colors } from "@/src/constants/theme";
import { useAppState } from "@/src/state/AppStateProvider";

export default function BgmToggle() {
  const { state, setBgmEnabled } = useAppState();
  const busy = React.useRef(false);
  const [saving, setSaving] = React.useState(false);
  const [failedValue, setFailedValue] = React.useState<boolean | null>(null);

  const save = async (enabled: boolean) => {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setFailedValue(null);
    try {
      await setBgmEnabled(enabled);
    } catch {
      setFailedValue(enabled);
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  if (!state) return null;
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>BGM {state.bgmEnabled ? "オン" : "オフ"}{saving ? "（保存中…）" : ""}</Text>
        <Switch value={state.bgmEnabled} disabled={saving}
          onValueChange={(enabled) => { void save(enabled); }}
          accessibilityLabel="BGMのオン・オフ" />
      </View>
      {failedValue !== null ? (
        <View accessibilityRole="alert">
          <Text style={styles.error}>BGM設定を保存できませんでした。保存済みの設定を維持しています。</Text>
          <PrimaryButton title="BGM設定の保存を再試行" onPress={() => { void save(failedValue); }} disabled={saving} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 18, gap: 8 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label: { color: Colors.text, fontSize: 15 },
  error: { color: Colors.textSub, fontSize: 13, marginBottom: 8 },
});

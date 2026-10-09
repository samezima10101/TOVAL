import React from "react";
import { StyleSheet, Text, View } from "react-native";

import PrimaryButton from "@/src/components/common/PrimaryButton";
import { Colors } from "@/src/constants/theme";

export default function CoachMark({ title, text, onNext }: {
  title: string;
  text: string;
  onNext?: () => Promise<void>;
}) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const next = async () => {
    if (busy || !onNext) return;
    setBusy(true);
    setError(null);
    try { await onNext(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "もう一度お試しください。"); }
    finally { setBusy(false); }
  };
  return (
    <View style={styles.card} accessibilityLiveRegion="polite">
      <Text style={styles.title}>チュートリアル · {title}</Text>
      <Text style={styles.text}>{text}</Text>
      {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : null}
      {onNext ? <PrimaryButton title="次へ" onPress={() => void next()} disabled={busy} loading={busy} /> : null}
    </View>
  );
}

export const tutorialStyles = StyleSheet.create({
  target: { borderColor: Colors.accent, borderWidth: 3, borderRadius: 18, padding: 4 },
});

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderColor: Colors.accent, borderWidth: 2, borderRadius: 14, padding: 16, gap: 12, marginVertical: 12 },
  title: { color: Colors.primary, fontSize: 16, fontWeight: "800" },
  text: { color: Colors.text, fontSize: 14, lineHeight: 22 },
  error: { color: Colors.warning },
});

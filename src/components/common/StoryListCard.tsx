import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Colors, Fonts } from "@/src/constants/theme";

type Props = {
  label: string;
  title: string;
  detail: string;
  isUnlocked: boolean;
  action: string;
  actionLabel: string;
  disabled: boolean;
  onPress: () => void;
};

export default function StoryListCard({
  label,
  title,
  detail,
  isUnlocked,
  action,
  actionLabel,
  disabled,
  onPress,
}: Props) {
  return (
    <View style={[styles.card, isUnlocked ? styles.unlockedCard : styles.lockedCard]}>
      <View style={styles.content}>
        <Text style={[styles.label, !isUnlocked && styles.lockedText]}>{label}</Text>
        <Text style={[styles.title, !isUnlocked && styles.lockedText]}>{title}</Text>
        <Text style={styles.detail}>{detail}</Text>
      </View>
      <TouchableOpacity
        style={[styles.actionButton, disabled && styles.disabledButton]}
        disabled={disabled}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
        accessibilityState={{ disabled }}
      >
        <Text style={styles.actionText}>{action}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
    padding: 15,
  },
  unlockedCard: { backgroundColor: Colors.surface, borderColor: Colors.primary },
  lockedCard: { backgroundColor: "#EEF1F5", borderColor: Colors.border },
  content: { flex: 1, paddingRight: 12 },
  label: { color: Colors.primary, fontSize: 13, fontFamily: Fonts.regular, marginBottom: 5 },
  title: { color: Colors.text, fontSize: 17, fontFamily: Fonts.medium, lineHeight: 24 },
  lockedText: { color: Colors.textSub },
  detail: { fontFamily: Fonts.regular, color: Colors.textSub, fontSize: 12, marginTop: 7 },
  actionButton: {
    alignItems: "center",
    backgroundColor: Colors.primary,
    borderRadius: 32,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  disabledButton: { backgroundColor: Colors.border },
  actionText: { color: Colors.surface, fontSize: 12, fontFamily: Fonts.bold },
});

import { StyleSheet, Text, TouchableOpacity } from "react-native";

import { Fonts } from "@/src/constants/theme";
import type { AppState } from "@/src/domain/common/types";

export type DebugChange = {
  description: string;
  transform: (state: AppState) => AppState;
};

export function DebugAction({ title, onPress, disabled = false }: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return <TouchableOpacity style={[debugStyles.action, disabled && debugStyles.disabled]}
    onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityState={{ disabled }}>
    <Text style={debugStyles.actionText}>{title}</Text>
  </TouchableOpacity>;
}

export const debugStyles = StyleSheet.create({
  text: { color: "#E0E3EE", fontFamily: Fonts.regular, fontSize: 14, lineHeight: 22 },
  action: { minHeight: 56, justifyContent: "center", padding: 12, borderWidth: 1, borderColor: "#FFFFFF66", backgroundColor: "#FFFFFF22" },
  actionText: { color: "#FFFFFF", fontFamily: Fonts.medium, fontSize: 16, lineHeight: 24 },
  disabled: { opacity: 0.4 },
});

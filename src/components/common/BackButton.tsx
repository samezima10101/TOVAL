import { Colors } from "@/src/constants/theme";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

type Props = {
  label?: string;
  onPress?: () => void;
};

export default function BackButton({ label = "＜ ホーム", onPress }: Props) {
  const handlePress = onPress || (() => router.dismissTo("/"));

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.backButton}
      accessibilityRole="button"
      accessibilityLabel={label.replace("＜ ", "") + "へ戻る"}
    >
      <Text style={styles.backText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backButton: {
    paddingRight: 10,
    paddingVertical: 8,
  },
  backText: {
    color: Colors.textSub,
    fontSize: 15,
    fontWeight: "700",
  },
});

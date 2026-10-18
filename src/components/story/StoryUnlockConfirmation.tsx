import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Colors, Fonts } from "@/src/constants/theme";

type StoryUnlockConfirmationProps = {
  priceNt: number;
  routeLabel: string;
  totalNt: number;
  isProcessing: boolean;
  error: string | null;
  onBack: () => void;
  onConfirm: () => void;
};

export default function StoryUnlockConfirmation({
  priceNt,
  routeLabel,
  totalNt,
  isProcessing,
  error,
  onBack,
  onConfirm,
}: StoryUnlockConfirmationProps) {
  const hasEnoughNt = totalNt >= priceNt;

  return (
    <View style={styles.messageBox} accessibilityRole="alert">
      <Text style={styles.title}>
        {hasEnoughNt ? "選択肢を解放しますか？" : "NTが不足しています"}
      </Text>
      <Text style={styles.routeLabel}>「{routeLabel}」</Text>
      <Text style={styles.balance}>
        必要: {priceNt} NT　所持: {totalNt} NT
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          disabled={isProcessing}
          accessibilityRole="button"
          accessibilityLabel={hasEnoughNt ? "戻る" : "選択肢に戻る"}
          accessibilityState={{ disabled: isProcessing }}
        >
          <Text style={styles.backText}>
            {hasEnoughNt ? "戻る" : "選択肢に戻る"}
          </Text>
        </TouchableOpacity>
        {hasEnoughNt ? (
          <TouchableOpacity
            style={[styles.unlockButton, isProcessing && styles.disabled]}
            onPress={onConfirm}
            disabled={isProcessing}
            accessibilityRole="button"
            accessibilityLabel={`${priceNt} NTで解放する`}
            accessibilityState={{ disabled: isProcessing, busy: isProcessing }}
          >
            <Text style={styles.unlockText}>
              {isProcessing ? "解放中…" : "解放する"}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  messageBox: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 16,
    borderWidth: 2,
    elevation: 4,
    margin: 18,
    minHeight: 190,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  title: {
    color: Colors.primary,
    fontSize: 17,
    fontFamily: Fonts.bold,
  },
  routeLabel: {
    color: Colors.text,
    fontSize: 15,
    fontFamily: Fonts.bold,
    marginTop: 12,
  },
  balance: {
    fontFamily: Fonts.regular,
    color: Colors.textSub,
    fontSize: 13,
    marginTop: 8,
  },
  error: {
    color: Colors.warning,
    fontSize: 13,
    fontFamily: Fonts.bold,
    marginTop: 8,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  backButton: {
    alignItems: "center",
    borderColor: Colors.border,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
  },
  backText: { color: Colors.textSub, fontSize: 14, fontFamily: Fonts.bold },
  unlockButton: {
    alignItems: "center",
    backgroundColor: Colors.primary,
    borderRadius: 10,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
  },
  disabled: { opacity: 0.6 },
  unlockText: { color: Colors.surface, fontSize: 14, fontFamily: Fonts.bold },
});

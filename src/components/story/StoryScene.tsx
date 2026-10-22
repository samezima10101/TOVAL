import { type ReactNode } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import StoryMessageBox from "@/src/components/story/StoryMessageBox";
import { Colors, Fonts } from "@/src/constants/theme";

export default function StoryScene({
  title,
  onClose,
  disabled = false,
  error,
  characters,
  contentKey,
  children,
}: {
  title: string;
  onClose: () => void;
  disabled?: boolean;
  error: string | null;
  characters?: ReactNode;
  contentKey: string | undefined;
  children: ReactNode;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeButton}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel="ストーリーを閉じる"
          accessibilityState={{ disabled }}
        >
          <Text style={styles.closeText}>閉じる</Text>
        </TouchableOpacity>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {characters ? (
        <View style={styles.characters} pointerEvents="none">
          {characters}
        </View>
      ) : null}
      <StoryMessageBox contentKey={contentKey}>{children}</StoryMessageBox>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  title: {
    color: Colors.text,
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.bold,
    marginRight: 10,
  },
  closeButton: {
    borderColor: Colors.border,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  closeText: { color: Colors.textSub, fontSize: 13, fontFamily: Fonts.bold },
  error: {
    fontFamily: Fonts.regular,
    color: Colors.warning,
    textAlign: "center",
    marginHorizontal: 18,
    marginTop: 12,
  },
  // Character placement stays independent of the dialogue frame's size/offset.
  characters: { flex: 1, marginBottom: 238 },
});

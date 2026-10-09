import { StyleSheet, Text, View } from "react-native";

import BackButton from "@/src/components/common/BackButton";
import { Colors } from "@/src/constants/theme";

export default function StoryListHeader({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <View style={styles.header}>
      <BackButton onPress={onBack} />
      <Text style={styles.title}>{title}</Text>
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  title: { color: Colors.text, fontSize: 19, fontWeight: "800" },
  spacer: { width: 62 },
});

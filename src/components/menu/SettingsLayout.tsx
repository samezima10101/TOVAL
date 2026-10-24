import type { ReactNode } from "react";
import { StyleSheet, Text, View, type TextProps } from "react-native";

import FileTextboxBackground from "@/src/components/common/FileTextboxBackground";
import { Fonts } from "@/src/constants/theme";

export function SettingsCard({ children }: { children: ReactNode }) {
  return (
    <View style={styles.panel}>
      <FileTextboxBackground shape="rectangle" />
      {children}
    </View>
  );
}

export function SettingsTitle({ style, ...props }: TextProps) {
  return (
    <Text
      accessibilityRole="header"
      {...props}
      style={[styles.sectionTitle, style]}
    />
  );
}

export function SettingsRow({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.settingRow}>
      <SettingsTitle
        style={styles.rowTitle}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        maxFontSizeMultiplier={1.2}
      >
        {title}
      </SettingsTitle>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { color: "#FFFFFF", fontFamily: Fonts.bold, fontSize: 18 },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  rowTitle: { flex: 1 },
  panel: {
    position: "relative",
    gap: 12,
    paddingHorizontal: 25,
    paddingTop: 20,
    paddingBottom: 20,
  },
});

import { Image } from "expo-image";
import type { PropsWithChildren } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { Colors } from "@/src/constants/theme";

const BACKGROUNDS = {
  primary: require("@/assets/bg/primary-bg.png"),
  shop: require("@/assets/bg/shop-bg.png"),
} as const;

export default function ScreenBackground({
  background = "primary",
  children,
  style,
}: PropsWithChildren<{
  background?: keyof typeof BACKGROUNDS;
  style?: StyleProp<ViewStyle>;
}>) {
  return (
    <View style={[styles.container, style]}>
      <Image
        source={BACKGROUNDS[background]}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        contentPosition="center"
        pointerEvents="none"
        accessible={false}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});

import React from "react";
import { Image as ExpoImage } from "expo-image";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import PrimaryButton from "@/src/components/common/PrimaryButton";
import { Colors, Fonts } from "@/src/constants/theme";
import { closeMenu } from "@/src/navigation/menu";
import { useAppState } from "@/src/state/AppStateProvider";

const BACKGROUNDS = {
  primary: require("@/assets/bg/primary-bg.png"),
  shop: require("@/assets/bg/shop-bg.png"),
} as const;

export default function AppFrame({
  children,
  background,
  bgmError,
  onRetryBgm,
  isMenuOpen,
}: React.PropsWithChildren<{
  background: keyof typeof BACKGROUNDS;
  bgmError: string | null;
  onRetryBgm: () => void;
  isMenuOpen: boolean;
}>) {
  const { state, timerSaveError, retryTimerSave } = useAppState();
  const onMenuPress = () => {
    if (isMenuOpen) {
      closeMenu();
    } else {
      router.navigate("/menu");
    }
  };
  const retryTimer = () => {
    void retryTimerSave().catch(() =>
      Alert.alert(
        "保存できませんでした",
        "計測は停止したままです。もう一度再試行してください。",
      ),
    );
  };

  if (!state) return null;

  const ntLabel = `${state.totalNt.toLocaleString("ja-JP")} NT`;

  return (
    <View style={styles.container}>
      <ExpoImage
        source={BACKGROUNDS[background]}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        contentPosition="center"
        pointerEvents="none"
        accessible={false}
      />
      <StatusBar style="light" />
      <SafeAreaView edges={["top"]}>
        <View style={styles.header}>
          <View
            style={styles.badge}
            accessible
            accessibilityLabel={`現在の残高 ${ntLabel}`}
          >
            <ExpoImage
              source={require("@/assets/images/nt_badge.svg")}
              style={styles.ntBadge}
              contentFit="fill"
              accessible={false}
              pointerEvents="none"
            />
            <Text
              style={styles.points}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.65}
            >
              {ntLabel}
            </Text>
          </View>
          <Pressable
            onPress={onMenuPress}
            style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={isMenuOpen ? "メニューを閉じる" : "メニューを開く"}
            accessibilityState={{ expanded: isMenuOpen }}
          >
            {isMenuOpen ? (
              <View style={styles.closeIcon} accessible={false}>
                <View style={[styles.line, styles.closeLine, styles.closeFirst]} />
                <View style={[styles.line, styles.closeLine, styles.closeSecond]} />
              </View>
            ) : (
              <View style={styles.menuIcon} accessible={false}>
                <View style={styles.line} />
                <View style={styles.line} />
                <View style={styles.line} />
              </View>
            )}
          </Pressable>
        </View>
      </SafeAreaView>

      {timerSaveError ? (
        <View style={styles.saveError} accessibilityRole="alert">
          <Text style={styles.statusDetail}>{timerSaveError}</Text>
          <PrimaryButton title="タイマー保存を再試行" onPress={retryTimer} />
        </View>
      ) : null}

      {bgmError ? (
        <View style={styles.saveError} accessibilityRole="alert">
          <Text style={styles.statusDetail}>{bgmError}</Text>
          <PrimaryButton title="BGMを再試行" onPress={onRetryBgm} />
        </View>
      ) : null}

      {children}

      <SafeAreaView edges={["bottom"]} style={styles.safeAreaBottom}>
        <View style={styles.footer}>
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="TOVALロゴ"
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 24,
  },
  badge: {
    minWidth: 138,
    maxWidth: "75%",
    minHeight: 48,
    flexShrink: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginLeft: -20,
    marginTop: -8,
  },
  ntBadge: {
    position: "absolute",
    transform: [{ rotate: "4deg" }],
    width: "180%",
    height: "180%",
    opacity: 0.8,
  },
  points: {
    color: Colors.surface,
    fontFamily: Fonts.regular,
    fontSize: 20,
    marginRight: -40,
  },
  menuButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.6 },
  menuIcon: { gap: 6 },
  line: { width: 23, height: 1.5, backgroundColor: "#FFFFFF" },
  closeIcon: { width: 23, height: 23, justifyContent: "center" },
  closeLine: { position: "absolute" },
  closeFirst: { transform: [{ rotate: "45deg" }] },
  closeSecond: { transform: [{ rotate: "-45deg" }] },
  saveError: { backgroundColor: Colors.surface, padding: 12, gap: 8 },
  safeAreaBottom: {
    backgroundColor: Colors.surface,
  },

  footer: {
    alignItems: "center",
    borderTopColor: Colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    height: 60,
  },
  logo: {
    height: 25,
    opacity: 0.5,
  },
  statusDetail: {
    fontFamily: Fonts.regular,
    color: Colors.textSub,
    fontSize: 13,
    marginTop: 10,
    textAlign: "center",
  },
});

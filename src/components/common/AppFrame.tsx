import { Image as ExpoImage } from "expo-image";
import { usePathname } from "expo-router";
import React from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import HeaderAudioMenu from "@/src/components/common/HeaderAudioMenu";
import PrimaryButton from "@/src/components/common/PrimaryButton";
import { Colors, Fonts } from "@/src/constants/theme";
import { useAppState } from "@/src/state/AppStateProvider";
import TutorialOverlay from "@/src/tutorial/TutorialOverlay";
import { useTutorialTarget } from "@/src/tutorial/TutorialContext";

export default function AppFrame({
  children,
  bgmError,
  onRetryBgm,
}: React.PropsWithChildren<{
  bgmError: string | null;
  onRetryBgm: () => void;
}>) {
  const { state, timerSaveError, retryTimerSave } = useAppState();
  const pathname = usePathname();
  const [audioMenuExpanded, setAudioMenuExpanded] = React.useState(false);
  const nt = useTutorialTarget("nt");
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
      {audioMenuExpanded ? (
        <Pressable
          style={styles.audioMenuBackdrop}
          onPress={() => setAudioMenuExpanded(false)}
          accessibilityRole="button"
          accessibilityLabel="音声設定を閉じる"
        />
      ) : null}
      <SafeAreaView
        edges={["top"]}
        style={styles.headerOverlay}
        pointerEvents="box-none"
      >
        <View style={styles.header} pointerEvents="box-none">
          <View
            {...nt.anchor}
            style={styles.badge}
            pointerEvents="none"
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
        </View>
        <HeaderAudioMenu
          key={pathname}
          expanded={audioMenuExpanded}
          onExpandedChange={setAudioMenuExpanded}
        />
      </SafeAreaView>

      {children}

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
      <TutorialOverlay surface="screen" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  // Below the header panel, above the screen, tab bar, and footer.
  audioMenuBackdrop: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, zIndex: 2 },
  headerOverlay: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 3 },
  header: {
    height: 76,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  badge: {
    minWidth: 138,
    maxWidth: "65%",
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
    transform: [{ rotate: "5deg" }],
    width: "170%",
    height: "170%",
    opacity: 0.8,
  },
  points: {
    color: Colors.surface,
    fontFamily: Fonts.regular,
    fontSize: 20,
    marginRight: -40,
  },
  saveError: {
    backgroundColor: Colors.surface,
    padding: 12,
    gap: 8,
    zIndex: 1,
  },
  safeAreaBottom: {
    backgroundColor: Colors.surface,
    zIndex: 1,
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

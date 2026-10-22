import { Image as ExpoImage } from "expo-image";
import React from "react";
import { Alert, Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import PrimaryButton from "@/src/components/common/PrimaryButton";
import { Colors, Fonts } from "@/src/constants/theme";
import { getTodaysStoryEpisode, STORY_CATALOG } from "@/src/domain/storyData";
import useLocalToday from "@/src/hooks/useLocalToday";
import { useAppState } from "@/src/state/AppStateProvider";

export default function AppFrame({
  children,
  bgmError,
  onRetryBgm,
}: React.PropsWithChildren<{
  bgmError: string | null;
  onRetryBgm: () => void;
}>) {
  const { state, timerSaveError, retryTimerSave } = useAppState();
  const today = useLocalToday();
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
  const dayEpisode = getTodaysStoryEpisode(state.unlockedStories, today);
  const totalEpisodes = STORY_CATALOG.episodes.length;
  const dayLabel = `Day${dayEpisode?.id ?? 0}/${totalEpisodes}`;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.headerOverlay} pointerEvents="box-none">
        <View style={styles.header} pointerEvents="box-none">
          <View
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
          <Text
            style={styles.dayProgress}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.65}
            pointerEvents="none"
            accessibilityLabel={`本日のエピソード、全${totalEpisodes}話中第${dayEpisode?.id ?? 0}話`}
          >
            {dayLabel}
          </Text>
        </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerOverlay: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 1 },
  header: {
    height: 76,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 24,
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
  dayProgress: {
    color: Colors.surface,
    fontFamily: Fonts.pixel,
    fontSize: 22,
    lineHeight: 30,
    textAlign: "right",
    flexShrink: 1,
    minWidth: 92,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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

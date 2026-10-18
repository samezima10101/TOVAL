import React from "react";
import { Alert, Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import PrimaryButton from "@/src/components/common/PrimaryButton";
import { Colors, Fonts } from "@/src/constants/theme";
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
  const retryTimer = () => {
    void retryTimerSave().catch(() =>
      Alert.alert(
        "保存できませんでした",
        "計測は停止したままです。もう一度再試行してください。",
      ),
    );
  };

  if (!state) return null;

  return (
    <View style={styles.rootContainer}>
      <SafeAreaView edges={["top"]} style={styles.safeAreaTop}>
        <View style={styles.globalHeader} accessibilityRole="header">
          <Text style={styles.pointText}>{state.totalNt} NT</Text>
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

      <View style={styles.screenContainer}>{children}</View>

      <SafeAreaView edges={["bottom"]} style={styles.safeAreaBottom}>
        <View style={styles.footer}>
          <Image
            source={require("@/assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="My-Juneロゴ"
          />
          <Text style={styles.logoText}>My-June</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  saveError: { backgroundColor: Colors.surface, padding: 12, gap: 8 },
  rootContainer: {
    backgroundColor: Colors.background,
    flex: 1,
  },
  safeAreaTop: {
    backgroundColor: Colors.surface,
  },
  safeAreaBottom: {
    backgroundColor: Colors.surface,
  },
  globalHeader: {
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderBottomColor: Colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  pointText: {
    color: Colors.text,
    fontSize: 20,
    fontFamily: Fonts.medium,
    marginRight: 14,
  },
  screenContainer: {
    backgroundColor: Colors.background,
    flex: 1,
  },

  footer: {
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "center",
    minHeight: 60,
    paddingVertical: 6,
  },
  logo: {
    height: 30,
    marginRight: 8,
    width: 30,
  },
  logoText: {
    color: Colors.textSub,
    fontSize: 13,
    fontFamily: Fonts.bold,
  },
  statusDetail: {
    fontFamily: Fonts.regular,
    color: Colors.textSub,
    fontSize: 13,
    marginTop: 10,
    textAlign: "center",
  },
});

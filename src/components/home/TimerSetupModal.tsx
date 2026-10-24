import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import FileTextboxBackground from "@/src/components/common/FileTextboxBackground";
import PrimaryButton from "@/src/components/common/PrimaryButton";
import { Fonts } from "@/src/constants/theme";
import { DEFAULT_TIMER_MINUTES } from "@/src/domain/timer";
import useTimerSetup from "@/src/hooks/useTimerSetup";

type Props = {
  visible: boolean;
  initialMinutes?: number;
  hasActiveTimer: boolean;
  onClose: () => void;
  onStart: (plannedSeconds: number) => Promise<void>;
  onResume: () => void;
};

export default function TimerSetupModal({
  visible,
  initialMinutes = DEFAULT_TIMER_MINUTES,
  hasActiveTimer,
  onClose,
  onStart,
  onResume,
}: Props) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const compact = height - insets.top - insets.bottom < 620;
  const fontMultiplier = compact ? 1 : 1.2;
  const { isStarting, error, displayHours, displayMins, adjust, handleStart } =
    useTimerSetup(initialMinutes, visible, onStart);
  const handleClose = () => {
    if (!isStarting) onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      accessibilityViewIsModal
    >
      <View
        style={[
          styles.overlay,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 },
        ]}
      >
        <View style={styles.content}>
          <View style={[styles.card, compact && styles.cardCompact]}>
            <FileTextboxBackground style={styles.frameGlow} />
            <View>
              <Text
                style={styles.title}
                accessibilityRole="header"
                maxFontSizeMultiplier={fontMultiplier}
              >
                集中時間を設定
              </Text>
              {hasActiveTimer ? (
                <>
                  <Text
                    style={styles.description}
                    maxFontSizeMultiplier={fontMultiplier}
                  >
                    進行中のタイマーがあります。新しく作らず、そのセッションを再開します。
                  </Text>
                  <PrimaryButton
                    title="タイマーを再開"
                    style={
                      compact
                        ? styles.primaryActionCompact
                        : styles.primaryAction
                    }
                    maxFontSizeMultiplier={fontMultiplier}
                    onPress={onResume}
                    accessibilityLabel="進行中のタイマーを再開"
                  />
                </>
              ) : (
                <>
                  {!compact ? (
                    <Text
                      style={styles.description}
                      maxFontSizeMultiplier={fontMultiplier}
                    >
                      1時間・5分単位で調整できます。
                    </Text>
                  ) : null}

                  <View
                    style={[
                      styles.pickerContainer,
                      compact && styles.pickerCompact,
                    ]}
                  >
                    {/* 時間の設定カラム */}
                    <View style={styles.pickerColumn}>
                      <TouchableOpacity
                        onPress={() => adjust(60)}
                        style={[
                          styles.arrowButton,
                          isStarting && styles.disabledAction,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel="1時間増やす"
                        disabled={isStarting}
                        accessibilityState={{ disabled: isStarting }}
                      >
                        <Text
                          style={styles.arrowText}
                          maxFontSizeMultiplier={fontMultiplier}
                        >
                          ＋
                        </Text>
                      </TouchableOpacity>
                      <Text
                        style={[
                          styles.numberText,
                          compact && styles.numberCompact,
                        ]}
                        accessibilityLabel={`${displayHours}時間`}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.6}
                        maxFontSizeMultiplier={fontMultiplier}
                      >
                        {displayHours}
                      </Text>
                      <TouchableOpacity
                        onPress={() => adjust(-60)}
                        style={[
                          styles.arrowButton,
                          isStarting && styles.disabledAction,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel="1時間減らす"
                        disabled={isStarting}
                        accessibilityState={{ disabled: isStarting }}
                      >
                        <Text
                          style={styles.arrowText}
                          maxFontSizeMultiplier={fontMultiplier}
                        >
                          －
                        </Text>
                      </TouchableOpacity>
                      <Text
                        style={styles.unitText}
                        maxFontSizeMultiplier={fontMultiplier}
                      >
                        hour
                      </Text>
                    </View>

                    <Text
                      style={styles.colon}
                      accessible={false}
                      maxFontSizeMultiplier={fontMultiplier}
                    >
                      :
                    </Text>

                    {/* 分の設定カラム */}
                    <View style={styles.pickerColumn}>
                      <TouchableOpacity
                        onPress={() => adjust(5)}
                        style={[
                          styles.arrowButton,
                          isStarting && styles.disabledAction,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel="5分増やす"
                        disabled={isStarting}
                        accessibilityState={{ disabled: isStarting }}
                      >
                        <Text
                          style={styles.arrowText}
                          maxFontSizeMultiplier={fontMultiplier}
                        >
                          ＋
                        </Text>
                      </TouchableOpacity>
                      <Text
                        style={[
                          styles.numberText,
                          compact && styles.numberCompact,
                        ]}
                        accessibilityLabel={`${displayMins}分`}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.6}
                        maxFontSizeMultiplier={fontMultiplier}
                      >
                        {String(displayMins).padStart(2, "0")}
                      </Text>
                      <TouchableOpacity
                        onPress={() => adjust(-5)}
                        style={[
                          styles.arrowButton,
                          isStarting && styles.disabledAction,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel="5分減らす"
                        disabled={isStarting}
                        accessibilityState={{ disabled: isStarting }}
                      >
                        <Text
                          style={styles.arrowText}
                          maxFontSizeMultiplier={fontMultiplier}
                        >
                          －
                        </Text>
                      </TouchableOpacity>
                      <Text
                        style={styles.unitText}
                        maxFontSizeMultiplier={fontMultiplier}
                      >
                        min
                      </Text>
                    </View>
                  </View>

                  {error ? (
                    <Text
                      style={styles.error}
                      accessibilityRole="alert"
                      maxFontSizeMultiplier={fontMultiplier}
                    >
                      {error}
                    </Text>
                  ) : null}

                  <PrimaryButton
                    title="タイマーを開始"
                    style={
                      compact
                        ? styles.primaryActionCompact
                        : styles.primaryAction
                    }
                    maxFontSizeMultiplier={fontMultiplier}
                    onPress={handleStart}
                    disabled={isStarting}
                    loading={isStarting}
                    accessibilityLabel="設定した時間でタイマーを開始"
                  />
                </>
              )}
            </View>
          </View>
          <TouchableOpacity
            onPress={handleClose}
            style={[styles.closeAction, isStarting && styles.disabledAction]}
            disabled={isStarting}
            accessibilityRole="button"
            accessibilityLabel="タイマー設定を閉じる"
            accessibilityState={{ disabled: isStarting }}
          >
            <Text
              style={styles.closeText}
              maxFontSizeMultiplier={fontMultiplier}
            >
              × CLOSE
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    backgroundColor: "rgba(0, 0, 0, 0.76)",
  },
  content: {
    width: "100%",
    maxWidth: 380,
    maxHeight: "100%",
    alignItems: "center",
    gap: 8,
  },
  card: {
    width: "100%",
    paddingTop: 32,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  cardCompact: { paddingTop: 28, paddingBottom: 12, paddingHorizontal: 20 },
  frameGlow: {
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    lineHeight: 28,
    fontFamily: Fonts.bold,
    textAlign: "center",
  },
  description: {
    fontFamily: Fonts.regular,
    color: "#E0E3EE",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
    textAlign: "center",
  },
  pickerCompact: { marginTop: 8, marginBottom: 0 },

  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    marginBottom: 10,
  },
  pickerColumn: {
    alignItems: "center",
    width: 80,
  },
  arrowButton: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 44,
    minHeight: 44,
  },
  arrowText: {
    fontSize: 24,
    color: "#FFFFFF",
    fontFamily: Fonts.bold,
  },
  numberText: {
    width: "100%",
    textAlign: "center",
    color: "#FFFFFF",
    fontSize: 72,
    lineHeight: 80,
    fontFamily: Fonts.timer,
    marginVertical: 6,
    fontVariant: ["tabular-nums"],
  },
  numberCompact: { fontSize: 48, lineHeight: 52, marginVertical: 0 },
  unitText: {
    fontFamily: Fonts.regular,
    color: "#E0E3EE",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  colon: {
    fontSize: 36,
    color: "#FFFFFF",
    fontFamily: Fonts.timer,
    marginHorizontal: 10,
    marginBottom: 25, // 「hour/min」のテキスト分だけ少し上にズラして中央を合わせるための余白
  },

  primaryAction: {
    marginTop: 16,
  },
  primaryActionCompact: { marginTop: 8 },
  disabledAction: {
    opacity: 0.6,
  },
  closeAction: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 20,
  },
  closeText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: Fonts.regular,
  },
  error: {
    fontFamily: Fonts.regular,
    color: "#FFE0E7",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
    textAlign: "center",
  },
});

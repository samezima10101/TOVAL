import Ionicons from "@expo/vector-icons/Ionicons";
import MaskedView from "@react-native-masked-view/masked-view";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import {
  useState,
  type ComponentType,
  type PropsWithChildren,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from "react-native";

import FileTextboxBackground from "@/src/components/common/FileTextboxBackground";
import OptionalBreakText from "@/src/components/common/OptionalBreakText";
import NaturalText from "@/src/components/common/NaturalText";
import StoryNumber from "@/src/components/common/StoryNumber";
import type { StoryArchiveChapter } from "@/src/components/common/storyArchiveTypes";
import { Fonts, SoloStoryColors } from "@/src/constants/theme";
import { plainText } from "@/src/domain/common/optionalLineBreaks";

export type {
  StoryArchiveChapter,
  StoryArchiveItem
} from "./storyArchiveTypes";

const colors = {
  text: "#FAFBFF",
  muted: "#D5DEF0",
  rail: "rgba(233,235,242,0.78)",
  railText: "#171C27",
  railMuted: "#747985",
  panel: "rgba(207,217,245,0.48)",
  soloText: "#173B46",
};
const palettes = {
  memory: {
    ...colors,
    chapterPanel: "rgba(5, 10, 29, 0.62)",
    chapterNumber: "#A5A9B7",
    selectedChapterNumber: colors.text,
    rule: "rgba(230,237,255,0.6)",
    recordNumber: colors.text,
  },
  shop: {
    text: "#303039",
    muted: "#555661",
    rail: "rgba(235,235,239,0.86)",
    railText: "#46464A",
    railMuted: "#86868E",
    panel: "rgba(218,220,232,0.72)",
    soloText: "#303039",
    chapterPanel: "rgba(213,214,224,0.78)",
    chapterNumber: "#75767D",
    selectedChapterNumber: "#45464E",
    rule: "rgba(93,94,109,0.6)",
    recordNumber: "#FFFFFF",
  },
};
const CHAPTER_ROW_HEIGHT = 52;
const CHAPTER_PANEL_HEIGHT = CHAPTER_ROW_HEIGHT * 2;

// 0.3.2's constructor intersection loses React props with the current RN types.
const AlphaMaskedView = MaskedView as unknown as ComponentType<
  PropsWithChildren<
    ViewProps & {
      maskElement: ReactElement;
    }
  >
>;

export default function StoryArchive({
  chapters,
  variant = "memory",
  selectionDisabled = false,
  loading = false,
  footer,
  completeLabel,
  topInset = 0,
  bottomInset = 0,
}: {
  chapters: readonly StoryArchiveChapter[];
  variant?: keyof typeof palettes;
  selectionDisabled?: boolean;
  loading?: boolean;
  footer?: ReactNode;
  completeLabel?: string;
  topInset?: number;
  bottomInset?: number;
}) {
  const palette = palettes[variant];
  const selectionLocked = selectionDisabled || loading;
  const [chapterId, setChapterId] = useState(
    () => chapters.find((entry) => entry.items.length)?.id ?? chapters[0]?.id,
  );
  const [itemId, setItemId] = useState<number>();
  const [chapterPanelWidth, setChapterPanelWidth] = useState(0);
  const chapter =
    chapters.find((entry) => entry.id === chapterId) ?? chapters[0];
  const item =
    chapter?.items.find((entry) => entry.id === itemId) ?? chapter?.items[0];
  const detailText = item?.solo ? palette.soloText : palette.text;
  const mutedText = item?.solo ? palette.soloText : palette.muted;
  const actionDisabled = Boolean(item?.disabled || selectionLocked);
  const numberHeight =
    chapterPanelWidth > 0 ? Math.min(36, chapterPanelWidth / 4 - 12) : 36;
  const episodeListTop = topInset + CHAPTER_ROW_HEIGHT;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <VerticalFade style={styles.rail} fadeHeight={96}>
          <View style={styles.railContent}>
            <View
              style={[styles.railBackground, { backgroundColor: palette.rail }]}
              pointerEvents="none"
              accessible={false}
            />
            <View
              style={[
                styles.railHeading,
                { top: topInset, height: CHAPTER_ROW_HEIGHT },
              ]}
            >
              <Text
                style={[styles.chapterTitle, { color: palette.railText }]}
                accessibilityRole="header"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                maxFontSizeMultiplier={1.2}
              >
                Chapter
              </Text>
            </View>
            <LinearGradient
              style={[
                styles.timelineRail,
                { top: episodeListTop - 16, bottom: bottomInset + 10 },
              ]}
              colors={[
                "rgba(39,43,51,0)",
                "rgba(39,43,51,0.6)",
                "rgba(39,43,51,0.6)",
                "rgba(39,43,51,0)",
              ]}
              locations={[0, 0.08, 0.92, 1]}
              pointerEvents="none"
              accessible={false}
            />
            <View
              style={[
                styles.listViewport,
                { top: episodeListTop, bottom: bottomInset + 42 },
              ]}
            >
              <VerticalFade style={styles.scroll} fadeHeight={32}>
                <ScrollView
                  key={chapter?.id}
                  style={styles.scroll}
                  contentContainerStyle={styles.listContent}
                  contentInsetAdjustmentBehavior="never"
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={!selectionLocked}
                  bounces={false}
                >
                  {chapter?.items.map((entry) => {
                    const selected = entry.id === item?.id;
                    const textColor =
                      selected && entry.solo
                        ? palette.soloText
                        : entry.isUnlocked
                          ? palette.railText
                          : palette.railMuted;
                    return (
                      <Pressable
                        key={entry.id}
                        onPress={() => setItemId(entry.id)}
                        disabled={selectionLocked}
                        style={({ pressed }) => [
                          styles.episode,
                          selected && {
                            backgroundColor: entry.solo
                              ? SoloStoryColors.detailPanel
                              : "rgba(255,255,255,0.48)",
                          },
                          pressed && styles.pressed,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`第${entry.number}話 ${plainText(entry.title)}、${entry.status}、詳細を表示`}
                        accessibilityState={{
                          selected,
                          disabled: selectionLocked,
                        }}
                      >
                        <View
                          style={styles.dotAnchor}
                          pointerEvents="none"
                          accessible={false}
                        >
                          <View
                            style={[
                              styles.dot,
                              { backgroundColor: textColor },
                              selected && styles.selectedDot,
                            ]}
                          />
                        </View>
                        <Text
                          style={[styles.episodeNumber, { color: textColor }]}
                          maxFontSizeMultiplier={1.2}
                        >
                          {variant === "memory"
                            ? String(entry.number).padStart(2, "0")
                            : `第${entry.number}話`}
                        </Text>
                        <OptionalBreakText
                          style={[styles.episodeTitle, { color: textColor }]}
                          maxFontSizeMultiplier={1.2}
                        >
                          {entry.title}
                        </OptionalBreakText>
                      </Pressable>
                    );
                  })}
                  {!chapter?.items.length ? (
                    <Text
                      style={[styles.emptyRail, { color: palette.railMuted }]}
                    >
                      {chapter?.emptyLabel ?? "準備中"}
                    </Text>
                  ) : null}
                  {completeLabel && chapter?.items.length ? (
                    <Text
                      style={[styles.complete, { color: palette.railText }]}
                    >
                      {completeLabel}
                    </Text>
                  ) : null}
                </ScrollView>
              </VerticalFade>
            </View>
          </View>
        </VerticalFade>
        <View
          style={[
            styles.rightColumn,
            { paddingTop: topInset, paddingBottom: bottomInset + 14 },
          ]}
        >
          <View
            style={styles.chapterPanel}
            onLayout={({ nativeEvent: { layout } }) =>
              setChapterPanelWidth(layout.width)
            }
          >
            <View
              style={[
                styles.chapterShade,
                { backgroundColor: palette.chapterPanel },
              ]}
              pointerEvents="none"
            />
            {chapters.map((entry) => {
              const selected = entry.id === chapter?.id;
              const unavailable = variant === "shop" && !entry.items.length;
              const disabled = selectionLocked || unavailable;
              return (
                <Pressable
                  key={entry.id}
                  disabled={disabled}
                  onPress={() => {
                    setChapterId(entry.id);
                    setItemId(entry.items[0]?.id);
                  }}
                  style={({ pressed }) => [
                    styles.chapterCell,
                    unavailable && styles.unavailable,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${entry.title}を選ぶ${entry.items.length ? "" : `、${entry.emptyLabel}`}`}
                  accessibilityState={{ selected, disabled }}
                >
                  <StoryNumber
                    number={entry.id}
                    height={numberHeight}
                    color={
                      selected
                        ? palette.selectedChapterNumber
                        : palette.chapterNumber
                    }
                  />
                </Pressable>
              );
            })}
            <View
              style={[styles.gridRuleOne, { backgroundColor: palette.rule }]}
              pointerEvents="none"
            />
          </View>
          <View style={styles.folder}>
            <FileTextboxBackground
              style={styles.folderSurface}
              fillColor={
                item?.solo ? SoloStoryColors.detailPanel : palette.panel
              }
              gradientOpacity={item?.solo ? 0.38 : 0.16}
              strokeOpacity={0.7}
              folderHeader={{
                width: variant === "memory" ? 72 : 60,
                height: 24,
              }}
            />
            {item ? (
              <View
                style={styles.recordNumber}
                pointerEvents="none"
                accessible={false}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                <StoryNumber
                  number={item.number}
                  height={72}
                  color={item.solo ? detailText : palette.recordNumber}
                />
              </View>
            ) : null}
            <ScrollView
              key={`${chapter?.id}-${item?.id ?? "empty"}`}
              style={styles.scroll}
              contentContainerStyle={styles.detailContent}
              contentInsetAdjustmentBehavior="never"
              indicatorStyle={
                item?.solo || variant === "shop" ? "black" : "white"
              }
              bounces={false}
            >
              <OptionalBreakText
                style={[styles.title, { color: detailText }]}
                accessibilityRole="header"
                accessibilityLiveRegion="polite"
                maxFontSizeMultiplier={1.2}
              >
                {item?.title ?? chapter?.emptyLabel ?? "準備中"}
              </OptionalBreakText>
              {item ? (
                <Pressable
                  onPress={item.onPress}
                  disabled={actionDisabled}
                  style={({ pressed }) => [
                    styles.play,
                    actionDisabled && styles.unavailable,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={plainText(item.actionLabel)}
                  accessibilityState={{
                    disabled: actionDisabled,
                    busy: loading,
                  }}
                >
                  <Image
                    source={require("@/assets/images/hex_button.svg")}
                    style={StyleSheet.absoluteFill}
                    contentFit="fill"
                    pointerEvents="none"
                    accessible={false}
                  />
                  {loading ? (
                    <ActivityIndicator color={colors.text} />
                  ) : variant === "shop" && !item.isUnlocked ? (
                    <Text
                      style={styles.purchaseLabel}
                      maxFontSizeMultiplier={1.2}
                    >
                      {item.action}
                    </Text>
                  ) : (
                    <Ionicons
                      name={item.disabled ? "lock-closed-outline" : "play"}
                      size={24}
                      color={colors.text}
                      accessible={false}
                    />
                  )}
                </Pressable>
              ) : null}
              <NaturalText
                style={[styles.description, { color: detailText }]}
                maxFontSizeMultiplier={1.2}
              >
                {item?.description ??
                  (chapter?.emptyLabel === "未入荷"
                    ? "このチャプターには、まだ入荷している会話がありません。"
                    : "このチャプターのストーリーは準備中です。")}
              </NaturalText>
              {item ? (
                <View style={styles.metadata}>
                  <Text
                    style={[styles.metadataText, { color: mutedText }]}
                    maxFontSizeMultiplier={1.2}
                  >
                    {item.status}
                  </Text>
                  {item.metadata.map((line, index) => (
                    <Text
                      key={index}
                      style={[styles.metadataText, { color: mutedText }]}
                      maxFontSizeMultiplier={1.2}
                    >
                      {line}
                    </Text>
                  ))}
                </View>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </View>
      {footer ? (
        <View
          style={[styles.footer, { height: bottomInset }]}
          pointerEvents="box-none"
        >
          {footer}
        </View>
      ) : null}
    </View>
  );
}

// Mask text and panel together so the screen background shows through the ends.
function VerticalFade({
  children,
  style,
  fadeHeight,
}: PropsWithChildren<{
  style: StyleProp<ViewStyle>;
  fadeHeight: number;
}>) {
  const [height, setHeight] = useState(0);
  const edge = height > 0 ? Math.min(0.5, fadeHeight / height) : 0;
  const onLayout = ({ nativeEvent: { layout } }: LayoutChangeEvent) =>
    setHeight(layout.height);

  // MaskedView 0.3.2's web implementation does not apply alpha masking.
  if (Platform.OS === "web") {
    const webMask: ViewStyle & { maskImage: string } = {
      maskImage: `linear-gradient(to bottom, transparent, black ${edge * 100}%, black ${(1 - edge) * 100}%, transparent)`,
    };
    return (
      <View style={[styles.fadeFrame, style, webMask]} onLayout={onLayout}>
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.fadeFrame, style]} onLayout={onLayout}>
      <AlphaMaskedView
        style={StyleSheet.absoluteFill}
        maskElement={
          <LinearGradient
            style={styles.container}
            colors={["rgba(0,0,0,0)", "#000000", "#000000", "rgba(0,0,0,0)"]}
            locations={[0, edge, 1 - edge, 1]}
            pointerEvents="none"
            accessible={false}
          />
        }
      >
        <View style={styles.container}>{children}</View>
      </AlphaMaskedView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, minHeight: 0, flexDirection: "row" },
  rail: { width: "36%" },
  railContent: { flex: 1, minHeight: 0 },
  railHeading: {
    position: "absolute",
    left: 0,
    right: 0,
    justifyContent: "center",
    overflow: "hidden",
  },
  listViewport: { position: "absolute", left: 0, right: 0, overflow: "hidden" },
  fadeFrame: { overflow: "hidden" },
  railBackground: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.rail,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "rgba(255,255,255,0.8)",
  },
  chapterTitle: {
    color: colors.railText,
    fontFamily: Fonts.medium,
    fontSize: 20,
    lineHeight: 28,
    marginLeft: 42,
  },
  scroll: { flex: 1, minHeight: 0 },
  listContent: { paddingTop: 32, paddingBottom: 32 },
  episode: {
    minHeight: 66,
    paddingLeft: 38,
    paddingRight: 10,
    paddingVertical: 10,
  },
  timelineRail: { position: "absolute", left: 23, width: 1 },
  dotAnchor: {
    position: "absolute",
    left: 23,
    top: 0,
    bottom: 0,
    width: 1,
    justifyContent: "center",
  },
  dot: { width: 7, height: 7, borderRadius: 4, marginLeft: -3 },
  selectedDot: { width: 9, height: 9, borderRadius: 5, marginLeft: -4 },
  episodeNumber: { fontFamily: Fonts.regular, fontSize: 12, lineHeight: 17 },
  episodeTitle: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
  },
  rightColumn: { flex: 1, minWidth: 0, gap: 22 },
  chapterPanel: {
    height: CHAPTER_PANEL_HEIGHT,
    flexShrink: 0,
    flexDirection: "row",
    flexWrap: "wrap",
    transform: [{ translateY: 6 }],
  },
  chapterShade: {
    position: "absolute",
    top: -10,
    bottom: -8,
    left: 0,
    right: 0,
    backgroundColor: "rgba(5, 10, 29, 0.62)",
    transform: [{ skewY: "-6deg" }],
  },
  chapterCell: {
    width: "25%",
    height: CHAPTER_ROW_HEIGHT,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  gridRuleOne: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(230,237,255,0.6)",
  },
  folder: {
    flex: 1,
    minHeight: 160,
    marginLeft: 12,
    marginRight: 8,
    paddingTop: 44,
    paddingHorizontal: 18,
    paddingBottom: 28,
    marginTop: 20,
  },
  detailContent: { flexGrow: 1, gap: 14, paddingBottom: 4 },
  title: { fontFamily: Fonts.bold, fontSize: 18, lineHeight: 29 },
  play: {
    width: "100%",
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  purchaseLabel: {
    color: colors.text,
    fontFamily: Fonts.bold,
    fontSize: 13,
    lineHeight: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
  },
  description: { fontFamily: Fonts.regular, fontSize: 14, lineHeight: 21 },
  metadata: { marginTop: "auto", paddingTop: 12, gap: 4, paddingBottom: 4 },
  metadataText: { fontFamily: Fonts.regular, fontSize: 12, lineHeight: 19 },
  recordNumber: { position: "absolute", right: 8, bottom: 6, opacity: 0.2 },
  folderSurface: { opacity: 0.65 },
  pressed: { opacity: 0.65 },
  unavailable: { opacity: 0.4 },
  emptyRail: {
    color: colors.railMuted,
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  complete: {
    color: colors.railText,
    fontFamily: Fonts.regular,
    fontSize: 11,
    lineHeight: 17,
    padding: 16,
    textAlign: "center",
  },
});

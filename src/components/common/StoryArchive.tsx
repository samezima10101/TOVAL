import { type ReactNode, useEffect, useRef, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from "react-native";

import FileTextboxBackground from "@/src/components/common/FileTextboxBackground";
import PrimaryButton from "@/src/components/common/PrimaryButton";
import StoryNumber from "@/src/components/common/StoryNumber";
import { Fonts, SoloStoryColors } from "@/src/constants/theme";

import type { StoryArchiveChapter } from "./storyArchiveTypes";
export type { StoryArchiveChapter, StoryArchiveItem } from "./storyArchiveTypes";

const palettes = {
  shop: {
    rail: "rgba(232,233,238,0.9)",
    panel: "rgba(207,209,221,0.78)",
    accent: "rgba(240,241,245,0.65)",
    text: "#393B43",
    muted: "#626570",
    number: "#626570",
    selectedNumber: "#393B43",
    titleText: "#393B43",
    detailText: "#393B43",
    detailMuted: "#626570",
    detailFill: "rgba(214,216,227,0.66)",
  },
};

const ITEM_HEIGHT = 72;
const SELECTION_TOP = 96;

export default function StoryArchive({
  chapters,
  variant,
  selectionDisabled = false,
  loading = false,
  completeLabel,
  footer,
  topInset = 0,
  bottomInset = 0,
}: {
  chapters: readonly StoryArchiveChapter[];
  variant: keyof typeof palettes;
  selectionDisabled?: boolean;
  loading?: boolean;
  completeLabel?: string;
  footer?: ReactNode;
  topInset?: number;
  bottomInset?: number;
}) {
  const palette = palettes[variant];
  const selectionTop = SELECTION_TOP;
  const [chapterId, setChapterId] = useState(
    () => chapters.find((entry) => entry.items.length)?.id,
  );
  const [itemId, setItemId] = useState<number>();
  const listRef = useRef<ScrollViewInstance>(null);
  const [wheelHeight, setWheelHeight] = useState(ITEM_HEIGHT);
  const chapter = chapters.find((entry) => entry.id === chapterId)
    ?? chapters.find((entry) => entry.items.length);
  const item = chapter?.items.find((entry) => entry.id === itemId)
    ?? chapter?.items[0];
  const soloText = palette.text;
  const detailText = item?.solo ? soloText : palette.detailText;
  const detailMuted = item?.solo ? soloText : palette.detailMuted;
  const selectedIndex = Math.max(0, chapter?.items.findIndex((entry) => entry.id === item?.id) ?? 0);
  const selectOffset = (offset: number) => {
    if (selectionDisabled) return;
    const index = Math.max(0, Math.min((chapter?.items.length ?? 1) - 1, Math.round(offset / ITEM_HEIGHT)));
    setItemId(chapter?.items[index]?.id);
  };
  useEffect(() => {
    if (selectionDisabled) {
      listRef.current?.scrollTo({ y: selectedIndex * ITEM_HEIGHT, animated: false });
    }
  }, [selectionDisabled, selectedIndex]);

  return (
    <View style={[styles.container, { paddingTop: topInset, paddingBottom: bottomInset + 8 }]}>
      <View
        style={[
          styles.railBackground,
          styles.archiveRail,
          { backgroundColor: palette.rail },
        ]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={["rgba(255,255,255,0.22)", "rgba(192,195,209,0.08)", "rgba(255,255,255,0.14)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <View style={styles.stage}>
          <View
            style={styles.wheel}
            onLayout={({ nativeEvent }) => setWheelHeight(nativeEvent.layout.height)}
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel="エピソード選択"
            accessibilityHint="上下にスワイプして話を選択します"
            accessibilityValue={{ text: item ? `第${item.number}話 ${item.title}、${item.status}` : "会話はありません" }}
            accessibilityState={{ disabled: selectionDisabled || !item }}
            accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
            onAccessibilityAction={({ nativeEvent }) => {
              if (selectionDisabled || !item || !chapter) return;
              const step = nativeEvent.actionName === "increment" ? 1 : nativeEvent.actionName === "decrement" ? -1 : 0;
              const index = Math.max(0, Math.min(chapter.items.length - 1, selectedIndex + step));
              setItemId(chapter.items[index].id);
              listRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: false });
            }}
          >
            <ScrollView
              key={chapter?.id}
              ref={listRef}
              style={styles.container}
              contentContainerStyle={{ paddingTop: selectionTop, paddingBottom: Math.max(0, wheelHeight - selectionTop - ITEM_HEIGHT) }}
              contentInsetAdjustmentBehavior="never"
              showsVerticalScrollIndicator={false}
              scrollEnabled={!selectionDisabled}
              bounces={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              scrollEventThrottle={16}
              onScroll={({ nativeEvent }) => selectOffset(nativeEvent.contentOffset.y)}
              onMomentumScrollEnd={({ nativeEvent }) => selectOffset(nativeEvent.contentOffset.y)}
            >
              {chapter?.items.map((entry, index) => {
                const selected = entry.id === item?.id;
                return (
                  <Pressable
                    key={entry.id}
                    onPress={() => listRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: true })}
                    disabled={selectionDisabled}
                    style={({ pressed }) => [
                      styles.story,
                      selected && styles.hiddenStory,
                      pressed && styles.dimmed,
                    ]}
                    accessible={false}
                  >
                      <View style={styles.timeline} pointerEvents="none" accessible={false}>
                        <View style={[styles.timelineDot, { backgroundColor: entry.isUnlocked ? palette.text : palette.muted }]} />
                      </View>
                      <Text
                        style={[
                          styles.storyTitle,
                          { color: entry.isUnlocked ? palette.text : palette.muted },
                          !entry.isUnlocked && styles.dimmed,
                        ]}
                        numberOfLines={3}
                        adjustsFontSizeToFit
                        minimumFontScale={0.65}
                        maxFontSizeMultiplier={1.2}
                      >
                        {entry.title}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <View style={[styles.selectedTitle, styles.titleOutline, { top: selectionTop, backgroundColor: item?.solo ? SoloStoryColors.titleBand : palette.accent }]} pointerEvents="none">
                <LinearGradient
                  colors={["rgba(255,255,255,0.16)", "rgba(255,255,255,0.4)", "rgba(255,255,255,0.04)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={[styles.chapterTitle, { color: item?.solo ? "#FFFFFF" : palette.titleText }]}>
                  {chapter?.title}{item ? `　第${item.number}話` : ""}
                </Text>
                <Text style={[styles.selectedStory, { color: item?.solo ? "#FFFFFF" : palette.titleText }]} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.65} maxFontSizeMultiplier={1.2}>
                  {item?.title ?? "ストーリーを選択"}
                </Text>
              </View>
            </View>
      <View style={styles.topRow} pointerEvents="box-none">
        <View style={[styles.chapters, styles.chapterPanel, { backgroundColor: palette.panel }]}>
          {chapters.map((entry) => {
            const selected = entry.id === chapter?.id;
            const disabled = !entry.items.length || selectionDisabled;
            return (
              <Pressable
                key={entry.id}
                disabled={disabled}
                onPress={() => {
                  setChapterId(entry.id);
                  setItemId(entry.items[0]?.id);
                }}
                style={({ pressed }) => [
                  styles.chapter,
                  styles.chapterCell,
                  selected && { backgroundColor: palette.accent },
                  (disabled || pressed) && styles.dimmed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${entry.title}${entry.items.length ? "を選ぶ" : `、${entry.emptyLabel}`}`}
                accessibilityState={{ selected, disabled }}
              >
                <StoryNumber
                  number={entry.id}
                  height={32}
                  color={selected ? palette.selectedNumber : palette.number}
                />
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.body} pointerEvents="box-none">
        <View style={styles.listColumn} pointerEvents="box-none">
            {completeLabel ? (
              <Text style={[styles.note, { color: palette.text }]}>{completeLabel}</Text>
            ) : null}
            {footer}
          </View>

          <View style={styles.detailColumn} pointerEvents="box-none">
            <View style={styles.titleSpace} pointerEvents="none" />
            <View style={styles.detail}>
              <FileTextboxBackground
                style={styles.fileBackground}
                fillColor={item?.solo ? SoloStoryColors.detailPanel : palette.detailFill}
              />
              {item ? (
                <View style={styles.recordNumber} pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                  {item.number > 0 ? (
                    <StoryNumber number={item.number} height={76} color="#FFFFFF" />
                  ) : (
                    <Text style={styles.zeroNumber}>00</Text>
                  )}
                </View>
              ) : null}
              {item ? (
                <>
                  <ScrollView style={styles.container} contentContainerStyle={styles.detailContent} contentInsetAdjustmentBehavior="never">
                  <Text
                    style={[styles.status, { color: detailText }]}
                    accessibilityLiveRegion="polite"
                  >
                    {item.status}
                  </Text>
                  <Text style={[styles.note, { color: detailMuted }]}>{item.metadata.join("\n")}</Text>
                  <Text style={[styles.description, { color: detailText }]}>{item.description}</Text>
                </ScrollView>
                <PrimaryButton
                  title={item.action}
                  accessibilityLabel={item.actionLabel}
                  onPress={item.onPress}
                  disabled={item.disabled}
                  loading={loading}
                  style={styles.action}
                />
              </>
            ) : (
              <Text style={[styles.description, { color: detailText }]}>
                入荷している会話はありません。
              </Text>
            )}
          </View>
        </View>
      </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  railBackground: { position: "absolute", top: 0, bottom: 0, left: 0, width: "42%" },
  archiveRail: {
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "rgba(255,255,255,0.75)",
    overflow: "hidden",
  },
  timeline: { position: "absolute", top: 0, bottom: 0, left: 3, width: 1, backgroundColor: "rgba(75,78,88,0.4)", justifyContent: "center" },
  timelineDot: { width: 5, height: 5, borderRadius: 3, marginLeft: -2 },
  titleOutline: { borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.7)" },
  chapterPanel: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(255,255,255,0.65)" },
  chapterCell: { borderBottomWidth: StyleSheet.hairlineWidth, borderRightWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.45)" },
  // Raise only the folder tab so the existing text/button coordinates stay fixed.
  fileBackground: { top: -8 },
  recordNumber: { position: "absolute", right: 8, bottom: 8, opacity: 0.18 },
  zeroNumber: { color: "#FFFFFF", fontFamily: Fonts.timer, fontSize: 76, lineHeight: 76 },
  stage: { flex: 1 },
  topRow: { height: SELECTION_TOP, alignItems: "flex-end", paddingBottom: 8 },
  chapterTitle: { color: "#FFFFFF", fontFamily: Fonts.medium, fontSize: 12, lineHeight: 18 },
  chapters: { width: "60%", flexDirection: "row", flexWrap: "wrap", marginRight: 12 },
  chapter: { width: "25%", minHeight: 44, alignItems: "center", justifyContent: "center" },
  dimmed: { opacity: 0.45 },
  titleSpace: { height: ITEM_HEIGHT },
  body: { flex: 1, flexDirection: "row", minHeight: 0 },
  listColumn: { width: "30%", paddingBottom: 4, justifyContent: "flex-end" },
  wheel: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0 },
  detailColumn: { flex: 1, minHeight: 0 },
  story: { width: "30%", height: ITEM_HEIGHT, justifyContent: "center", paddingHorizontal: 8 },
  hiddenStory: { opacity: 0 },
  selectedTitle: { position: "absolute", top: SELECTION_TOP, left: 0, right: 0, height: ITEM_HEIGHT, paddingHorizontal: 24, justifyContent: "center" },
  storyTitle: { fontFamily: Fonts.medium, fontSize: 14, lineHeight: 20, textAlign: "center" },
  selectedStory: { color: "#FFFFFF", fontFamily: Fonts.bold, fontSize: 24, lineHeight: 26 },
  detail: {
    flex: 1,
    minHeight: 0,
    marginTop: 12,
    marginRight: 12,
    marginBottom: 8,
    padding: 16,
    gap: 12,
  },
  status: { fontFamily: Fonts.medium, fontSize: 13, lineHeight: 20 },
  note: { fontFamily: Fonts.regular, fontSize: 11, lineHeight: 17 },
  detailContent: { gap: 12 },
  description: { fontFamily: Fonts.regular, fontSize: 15, lineHeight: 24 },
  action: { width: "100%", minHeight: 52, paddingHorizontal: 12, paddingVertical: 10 },
});

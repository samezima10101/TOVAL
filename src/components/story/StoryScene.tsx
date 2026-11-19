import { Image } from "expo-image";
import { useState, type ReactNode } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import StoryMessageBox from "@/src/components/story/StoryMessageBox";
import StoryWindowBackground, { STORY_WINDOW_HEADER_HEIGHT } from "@/src/components/story/StoryWindowBackground";
import { Colors, Fonts } from "@/src/constants/theme";
import type { StoryLine } from "@/src/domain/common/types";

const slideAssets = {
  slide1: require("@/assets/slides/ep02-1.png"),
  slide2: require("@/assets/slides/ep02-2.png"),
  slide3: require("@/assets/slides/ep02-3.png"),
  slide4: require("@/assets/slides/ep02-4.png"),
};

const STORY_HORIZONTAL_MARGIN = 22;
const WINDOW_OFFSET = 8;
const WINDOW_OVERLAP = 12;
const CAMERA_FRAME_INSET = 14;
const CAMERA_INDICATOR_INSET = CAMERA_FRAME_INSET + 6;
const storyBackground = require("@/assets/bg/story-bg.png");
const CHARACTER_HEIGHT = 1000;
const BACKGROUND_WIDTH = 1400;
const BACKGROUND_HEIGHT = 950;
const BACKGROUND_ASPECT_RATIO = BACKGROUND_WIDTH / BACKGROUND_HEIGHT;

export default function StoryScene({
  title,
  speaker,
  onClose,
  disabled = false,
  error,
  characters,
  contentKey,
  children,
  nextButton,
  dateLabel,
  slide,
  slideBackground = false,
}: {
  title: string;
  speaker?: StoryLine["speaker"];
  onClose: () => void;
  disabled?: boolean;
  error: string | null;
  characters?: ReactNode;
  contentKey: string | undefined;
  children: ReactNode;
  nextButton?: ReactNode;
  dateLabel?: string;
  slide?: StoryLine["slide"];
  slideBackground?: boolean;
}) {
  const [sceneWidth, setSceneWidth] = useState(0);
  const availableWidth = Math.max(
    0,
    sceneWidth - STORY_HORIZONTAL_MARGIN * 2 - WINDOW_OFFSET,
  );
  const broadcastWidth = availableWidth;
  const backgroundHeight = broadcastWidth / BACKGROUND_ASPECT_RATIO;
  const closeButton = (
    <TouchableOpacity
      onPress={onClose}
      style={styles.closeButton}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel="ストーリーを閉じる"
      accessibilityState={{ disabled }}
    >
      <Text style={styles.closeText}>× CLOSE</Text>
    </TouchableOpacity>
  );
  const actions = (
    <View style={styles.actions}>
      {closeButton}
      {nextButton}
    </View>
  );

  if (!characters) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
        </View>
        {error ? (
          <Text style={styles.error} accessibilityRole="alert">
            {error}
          </Text>
        ) : null}
        <StoryMessageBox contentKey={contentKey} speaker={speaker} shape="rectangle" footer={actions}>{children}</StoryMessageBox>
      </View>
    );
  }

  return (
    <View
      style={styles.container}
      onLayout={({ nativeEvent: { layout } }) => setSceneWidth(layout.width)}
    >
      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
      <View
        style={[
          styles.broadcast,
          { width: broadcastWidth, height: backgroundHeight + STORY_WINDOW_HEADER_HEIGHT },
        ]}
        accessibilityLabel={title}
      >
        <Image
          source={storyBackground}
          style={{
            position: "absolute",
            top: STORY_WINDOW_HEADER_HEIGHT,
            left: 0,
            width: broadcastWidth,
            height: backgroundHeight,
          }}
          contentFit="contain"
          contentPosition="center"
          accessible={false}
        />
        <View
          style={[
            styles.characters,
            {
              height: (CHARACTER_HEIGHT * broadcastWidth) / BACKGROUND_WIDTH,
              top: STORY_WINDOW_HEADER_HEIGHT,
            },
          ]}
          pointerEvents="none"
        >
          {characters}
        </View>
        {slideBackground ? (
          <Image
            source={require("@/assets/slides/slide_background.png")}
            style={[styles.characters, { top: STORY_WINDOW_HEADER_HEIGHT, height: backgroundHeight }]}
            contentFit="cover"
            contentPosition="center"
            accessible={false}
          />
        ) : null}
        {slide ? (
          <Image
            key={slide}
            source={slideAssets[slide]}
            style={[styles.characters, { top: STORY_WINDOW_HEADER_HEIGHT, height: backgroundHeight }]}
            contentFit="contain"
            contentPosition="center"
            accessible={false}
          />
        ) : null}
        <StoryWindowBackground variant="broadcast" />
        <View style={styles.cameraCorners} pointerEvents="none" accessible={false}>
          <View style={[styles.cameraCorner, styles.cameraCornerTopLeft]} />
          <View style={[styles.cameraCorner, styles.cameraCornerTopRight]} />
          <View style={[styles.cameraCorner, styles.cameraCornerBottomLeft]} />
          <View style={[styles.cameraCorner, styles.cameraCornerBottomRight]} />
        </View>
        <View style={styles.broadcastIndicators} pointerEvents="none" accessible={false}>
          <View style={styles.recordingLabel}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>REC</Text>
          </View>
          <View style={styles.signalBars}>
            <View style={styles.signalBar} />
            <View style={[styles.signalBar, styles.signalBarMedium]} />
            <View style={[styles.signalBar, styles.signalBarTall]} />
          </View>
        </View>
        <View style={styles.windowDots} pointerEvents="none" accessible={false}>
          <View style={styles.windowDot} />
          <View style={styles.windowDot} />
          <View style={styles.windowDot} />
        </View>
        <TouchableOpacity
          onPress={onClose}
          style={styles.windowCloseButton}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel="配信ウィンドウを閉じる"
          accessibilityState={{ disabled }}
        >
          <Text style={styles.windowCloseText}>✕</Text>
        </TouchableOpacity>
        {dateLabel ? (
          <Text style={styles.dateLabel} accessibilityLabel={`解放日 ${dateLabel}`}>
            {dateLabel}
          </Text>
        ) : null}
      </View>
      <View style={[styles.dialogue, { width: broadcastWidth }]}>
        <StoryMessageBox contentKey={contentKey} speaker={speaker} shape="rectangle" footer={actions} inFlow>
          {children}
        </StoryMessageBox>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 0 },
  header: {
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  title: {
    color: Colors.surface,
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.bold,
    marginRight: 10,
  },
  closeButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 12,
    marginLeft: -12,
  },
  closeText: {
    color: "#FFFFFF",
    fontSize: 12,
    lineHeight: 24,
    includeFontPadding: false,
    fontFamily: Fonts.bold,
    textShadowColor: "#172A46",
    textShadowRadius: 3,
  },
  error: {
    fontFamily: Fonts.regular,
    color: "#FFE0E7",
    marginHorizontal: 18,
    marginBottom: 8,
  },
  broadcast: {
    marginLeft: STORY_HORIZONTAL_MARGIN,
    marginTop: 12,
    overflow: "hidden",
  },
  characters: { position: "absolute", top: 0, right: 0, left: 0 },
  cameraCorners: {
    position: "absolute",
    top: STORY_WINDOW_HEADER_HEIGHT + CAMERA_FRAME_INSET,
    left: CAMERA_FRAME_INSET,
    right: CAMERA_FRAME_INSET,
    bottom: CAMERA_FRAME_INSET,
  },
  cameraCorner: {
    position: "absolute",
    width: 64,
    height: 48,
    borderColor: "#FFFFFF",
  },
  cameraCornerTopLeft: { top: 0, left: 0, borderTopWidth: 1, borderLeftWidth: 1 },
  cameraCornerTopRight: { top: 0, right: 0, borderTopWidth: 1, borderRightWidth: 1 },
  cameraCornerBottomLeft: { bottom: 0, left: 0, borderBottomWidth: 1, borderLeftWidth: 1 },
  cameraCornerBottomRight: { bottom: 0, right: 0, borderBottomWidth: 1, borderRightWidth: 1 },
  broadcastIndicators: {
    position: "absolute",
    top: STORY_WINDOW_HEADER_HEIGHT + CAMERA_INDICATOR_INSET,
    left: CAMERA_INDICATOR_INSET + 6,
    right: CAMERA_INDICATOR_INSET + 6,
    height: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  recordingLabel: { flexDirection: "row", alignItems: "center", gap: 6 },
  recordingText: {
    color: "#FFFFFF",
    fontFamily: Fonts.pixel,
    fontSize: 12,
    lineHeight: 18,
    includeFontPadding: false,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#F7F9FF",
  },
  signalBars: {
    height: 18,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
  },
  signalBar: {
    width: 3,
    height: 10,
    backgroundColor: "#F8FAFF",
  },
  signalBarMedium: { height: 14 },
  signalBarTall: { height: 18 },
  windowDots: {
    position: "absolute",
    top: 0,
    left: 12,
    height: STORY_WINDOW_HEADER_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  windowDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#F0D8E3",
  },
  windowCloseButton: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 44,
    height: 44,
    alignItems: "center",
    paddingTop: (STORY_WINDOW_HEADER_HEIGHT - 20) / 2,
  },
  windowCloseText: {
    color: "#FFFFFF",
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    includeFontPadding: false,
  },
  dialogue: {
    flex: 1,
    minHeight: 0,
    marginLeft: STORY_HORIZONTAL_MARGIN + WINDOW_OFFSET,
    marginTop: -WINDOW_OVERLAP,
    zIndex: 1,
    paddingBottom: 28,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateLabel: {
    position: "absolute",
    right: CAMERA_INDICATOR_INSET + 6,
    bottom: CAMERA_INDICATOR_INSET,
    color: "#FFFFFF",
    fontFamily: Fonts.pixel,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 1,
  },
});

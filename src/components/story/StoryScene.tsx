import { Image } from "expo-image";
import { useState, type ReactNode } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import StoryMessageBox from "@/src/components/story/StoryMessageBox";
import { Colors, Fonts } from "@/src/constants/theme";
import type { StoryLine } from "@/src/domain/common/types";

const slideAssets = {
  slide1: require("@/assets/slides/ep02-1.png"),
  slide2: require("@/assets/slides/ep02-2.png"),
  slide3: require("@/assets/slides/ep02-3.png"),
  slide4: require("@/assets/slides/ep02-4.png"),
};

const BROADCAST_HORIZONTAL_MARGIN = 16;
const BROADCAST_BORDER_WIDTH = 4;
const storyBackground = require("@/assets/bg/story-bg.png");
// Match story-bg.png and the corner decoration's viewBox.
const BACKGROUND_ASPECT_RATIO = 1400 / 950;
const CHARACTER_HEIGHT = 1000;
const BACKGROUND_WIDTH = 1400;

export default function StoryScene({
  title,
  onClose,
  disabled = false,
  error,
  characters,
  contentKey,
  children,
  episodeNumber,
  dateLabel,
  slide,
}: {
  title: string;
  onClose: () => void;
  disabled?: boolean;
  error: string | null;
  characters?: ReactNode;
  contentKey: string | undefined;
  children: ReactNode;
  episodeNumber?: number;
  dateLabel?: string;
  slide?: StoryLine["slide"];
}) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const availableWidth = Math.max(
    0,
    size.width - BROADCAST_HORIZONTAL_MARGIN * 2,
  );
  const backgroundHeight = Math.max(0, Math.min(
    availableWidth / BACKGROUND_ASPECT_RATIO,
    size.height * 0.52 - BROADCAST_BORDER_WIDTH * 2,
  ));
  const broadcastWidth = backgroundHeight * BACKGROUND_ASPECT_RATIO;
  const broadcastHeight = backgroundHeight + BROADCAST_BORDER_WIDTH * 2;
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

  if (!characters) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {closeButton}
        </View>
        {error ? (
          <Text style={styles.error} accessibilityRole="alert">
            {error}
          </Text>
        ) : null}
        <StoryMessageBox contentKey={contentKey}>{children}</StoryMessageBox>
      </View>
    );
  }

  return (
    <View
      style={styles.container}
      onLayout={({ nativeEvent: { layout } }) =>
        setSize((current) =>
          current.width === layout.width && current.height === layout.height
            ? current
            : { width: layout.width, height: layout.height },
        )
      }
    >
      <View
        style={[
          styles.broadcast,
          { width: broadcastWidth, height: broadcastHeight },
        ]}
        accessibilityLabel={title}
      >
        <Image
          source={storyBackground}
          style={{
            position: "absolute",
            top: 0,
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
              height: CHARACTER_HEIGHT * broadcastWidth / BACKGROUND_WIDTH,
            },
          ]}
          pointerEvents="none"
        >
          {characters}
        </View>
        {slide ? (
          <Image
            key={slide}
            source={slideAssets[slide]}
            style={[styles.characters, { height: backgroundHeight }]}
            contentFit="contain"
            accessible={false}
          />
        ) : null}
        <View style={styles.broadcastHeader}>
          <Text style={styles.live} accessibilityLabel="ライブ映像">
            ○ LIVE
          </Text>
          {closeButton}
        </View>
        <Svg
          style={styles.corners}
          width="100%"
          height={backgroundHeight}
          viewBox="0 0 1400 950"
          preserveAspectRatio="xMidYMid meet"
          pointerEvents="none"
          accessible={false}
        >
          <Path
            d="M42 168 V70 L77 35 H245 M1155 35 H1323 L1358 70 V168 M42 782 V880 L77 915 H245 M1155 915 H1323 L1358 880 V782"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={10.5}
          />
        </Svg>
        <View style={styles.stamp} pointerEvents="none">
          <Text style={styles.stampText}>
            DAY{String(episodeNumber ?? 1).padStart(2, "0")}
          </Text>
          {dateLabel ? <Text style={styles.stampText}>{dateLabel}</Text> : null}
        </View>
      </View>
      <View style={styles.dialogue}>
        {error ? (
          <Text style={styles.error} accessibilityRole="alert">
            {error}
          </Text>
        ) : null}
        <StoryMessageBox contentKey={contentKey} inFlow>
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
  },
  closeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: Fonts.bold,
    textShadowColor: "#23344D",
    textShadowRadius: 3,
  },
  error: {
    fontFamily: Fonts.regular,
    color: "#FFE0E7",
    marginHorizontal: 18,
    marginBottom: 8,
  },
  broadcast: {
    alignSelf: "center",
    marginHorizontal: BROADCAST_HORIZONTAL_MARGIN,
    marginTop: 12,
    overflow: "hidden",
    backgroundColor: "#103C54",
    borderTopWidth: BROADCAST_BORDER_WIDTH,
    borderBottomWidth: BROADCAST_BORDER_WIDTH,
    borderColor: "#FFFFFF",
  },
  characters: { position: "absolute", top: 0, right: 0, left: 0 },
  broadcastHeader: {
    position: "absolute",
    top: 8,
    left: 28,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  live: {
    color: "#FF586D",
    fontFamily: Fonts.medium,
    fontSize: 16,
    letterSpacing: 2,
  },
  corners: { position: "absolute", top: 0, left: 0 },
  stamp: { position: "absolute", right: 20, bottom: 8, alignItems: "flex-end" },
  stampText: {
    color: "#FFFFFF",
    fontFamily: Fonts.pixel,
    fontSize: 11,
    letterSpacing: 1,
    textShadowColor: "#23344D",
    textShadowRadius: 2,
  },
  dialogue: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 28,
  },
});

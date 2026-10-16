import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import StoryCharacters from "@/src/components/story/StoryCharacters";
import { Colors } from "@/src/constants/theme";
import { StoryEpisode } from "@/src/domain/common/types";

type HomeStoryCardProps = {
  latestUnlockedEpisode?: StoryEpisode;
  onOpenShop: () => void;
};

export default function HomeStoryCard({
  latestUnlockedEpisode,
  onOpenShop,
}: HomeStoryCardProps) {

  return (
    <View style={styles.storyCard}>
      <View style={styles.storyCardHeader}>
        <View style={styles.storyCardCopy}>
          <Text style={styles.storyCardEyebrow}>STORY TALK</Text>
          <Text style={styles.storyCardTitle}>
            今日も一緒に集中
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.secret}
        onPress={onOpenShop}
        accessibilityRole="button"
        accessibilityLabel="ショップを開く"
      >
        <Ionicons name="storefront-outline" size={48} color={Colors.primary} />
      </TouchableOpacity>

      <StoryCharacters containerStyle={styles.homeCharacters} />

      <View style={styles.storyCardFooter}>
        <Text style={styles.storyCardDescription}>
          {latestUnlockedEpisode
            ? `Episode ${String(latestUnlockedEpisode.id).padStart(2, "0")}　${latestUnlockedEpisode.title}`
            : "キャラクターたちが、ここで待っています。"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  storyCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 22,
    overflow: "hidden",
  },
  storyCardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  storyCardCopy: {
    flex: 1,
    paddingRight: 14,
  },
  storyCardEyebrow: {
    color: Colors.textSub,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  storyCardTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 5,
  },
  secret: {
    position: "absolute",
    top: 70,
    left: 12,
    padding: 12,
    zIndex: 1,
  },
  homeCharacters: {
    flex: 0,
    height: 220,
    marginTop: 2,
    minHeight: 0,
  },
  storyCardFooter: {
    backgroundColor: "#F8FAFD",
    borderTopColor: Colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  storyCardDescription: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
});

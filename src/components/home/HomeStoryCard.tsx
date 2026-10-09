import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import StoryCharacters from "@/src/components/story/StoryCharacters";
import { Colors } from "@/src/constants/theme";
import { StoryEpisode } from "@/src/domain/common/types";

type HomeStoryCardProps = {
  latestUnlockedEpisode?: StoryEpisode;
  unreadEpisode?: StoryEpisode;
  onOpenTalk: () => void;
  onOpenShop: () => void;
};

export default function HomeStoryCard({
  latestUnlockedEpisode,
  unreadEpisode,
  onOpenTalk,
  onOpenShop,
}: HomeStoryCardProps) {
  const displayEpisode = unreadEpisode ?? latestUnlockedEpisode;
  const hasUnreadStory = Boolean(unreadEpisode);

  return (
    <View style={styles.storyCard}>
      <View style={styles.storyCardHeader}>
        <View style={styles.storyCardCopy}>
          <Text style={styles.storyCardEyebrow}>STORY TALK</Text>
          <Text style={styles.storyCardTitle}>
            {unreadEpisode ? "新しい会話を読む" : "今日も一緒に集中"}
          </Text>
        </View>
        {unreadEpisode ? (
          <TouchableOpacity
            onPress={onOpenTalk}
            style={styles.talkButton}
            accessibilityRole="button"
            accessibilityLabel={`${unreadEpisode.title}を読む`}
            accessibilityHint="新しく解放されたストーリーを開きます"
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={29}
              color={Colors.surface}
            />
          </TouchableOpacity>
        ) : null}
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
          {displayEpisode
            ? `Episode ${String(displayEpisode.id).padStart(2, "0")}　${displayEpisode.title}`
            : "キャラクターたちが、ここで待っています。"}
        </Text>
        {hasUnreadStory ? (
          <Text style={styles.storyCardHint}>
            吹き出しをタップして会話を読む
          </Text>
        ) : null}
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
  talkButton: {
    alignItems: "center",
    backgroundColor: Colors.primary,
    borderRadius: 30,
    elevation: 3,
    height: 58,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    width: 58,
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
  storyCardHint: {
    color: Colors.textSub,
    fontSize: 12,
    marginTop: 4,
  },
});

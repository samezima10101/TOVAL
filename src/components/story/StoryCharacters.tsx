import {
  Image,
  ImageSourcePropType,
  ImageStyle,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

import { Expression, Speaker, StoryCharacter } from "@/src/domain/common/types";
import {
  STORY_CHARACTER_BY_SPEAKER,
  STORY_CHARACTER_NAMES,
} from "@/src/domain/storyData";

const faceAssets: Record<
  StoryCharacter,
  Record<Expression, ImageSourcePropType>
> = {
  gem: {
    normal: require("@/assets/faces/G01-1.png"),
    talk: require("@/assets/faces/G01-2.png"),
    doubt: require("@/assets/faces/G01-2.png"),
  },
  alta: {
    normal: require("@/assets/faces/A01-1.png"),
    talk: require("@/assets/faces/A01-2.png"),
    doubt: require("@/assets/faces/A01-2.png"),
  },
};

type StoryCharactersProps = {
  leftExpression?: Expression;
  rightExpression?: Expression;
  activeSpeaker?: Speaker;
  containerStyle?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
};

export default function StoryCharacters({
  leftExpression = "normal",
  rightExpression = "normal",
  activeSpeaker,
  containerStyle,
  imageStyle,
}: StoryCharactersProps) {
  const bossCharacter = STORY_CHARACTER_BY_SPEAKER.boss;
  const subCharacter = STORY_CHARACTER_BY_SPEAKER.sub;
  const bossIsActive = !activeSpeaker || activeSpeaker === "boss";
  const subIsActive = !activeSpeaker || activeSpeaker === "sub";

  return (
    <View style={[styles.charactersContainer, containerStyle]}>
      <Image
        source={faceAssets[bossCharacter][leftExpression]}
        style={[
          styles.characterImage,
          imageStyle,
          bossIsActive ? styles.activeCharacter : styles.inactiveCharacter,
        ]}
        resizeMode="contain"
        accessibilityLabel={STORY_CHARACTER_NAMES[bossCharacter]}
      />
      <Image
        source={faceAssets[subCharacter][rightExpression]}
        style={[
          styles.characterImage,
          imageStyle,
          subIsActive ? styles.activeCharacter : styles.inactiveCharacter,
        ]}
        resizeMode="contain"
        accessibilityLabel={STORY_CHARACTER_NAMES[subCharacter]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  charactersContainer: {
    alignItems: "flex-end",
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    minHeight: 240,
    marginTop: -30,
  },
  characterImage: {
    height: "88%",
    width: "50%",
  },
  activeCharacter: {
    opacity: 1,
  },
  inactiveCharacter: {
    opacity: 0.42,
  },
});

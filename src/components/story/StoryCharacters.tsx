import { useEffect, useState } from "react";
import {
  Animated,
  Easing,
  ImageSourcePropType,
  StyleSheet,
  View,
} from "react-native";

import {
  AltaExpression,
  GemExpression,
  StoryLine,
} from "@/src/domain/common/types";
import {
  STORY_CHARACTER_BY_SPEAKER,
  STORY_CHARACTER_NAMES,
} from "@/src/domain/storyData";

const faceAssets: {
  gem: Record<Exclude<GemExpression, "none">, ImageSourcePropType>;
  alta: Record<Exclude<AltaExpression, "none">, ImageSourcePropType>;
} = {
  gem: {
    normal: require("@/assets/faces/G01-1.png"),
    talk: require("@/assets/faces/G01-2.png"),
    doubt: require("@/assets/faces/G01-2.png"),
    normal1: require("@/assets/faces/gem/G01-1.png"),
    normal2: require("@/assets/faces/gem/G01-2.png"),
    normal3: require("@/assets/faces/gem/G01-3.png"),
    normal4: require("@/assets/faces/gem/G01-4.png"),
    surprised1: require("@/assets/faces/gem/G02-1.png"),
    surprised2: require("@/assets/faces/gem/G02-2.png"),
    surprised3: require("@/assets/faces/gem/G02-3.png"),
    surprised4: require("@/assets/faces/gem/G02-4.png"),
    doubt3: require("@/assets/faces/gem/G03-3.png"),
    doubt4: require("@/assets/faces/gem/G03-4.png"),
    beam1: require("@/assets/faces/gem/G04-1.png"),
    beam2: require("@/assets/faces/gem/G04-2.png"),
    nervous1: require("@/assets/faces/gem/G05-1.png"),
    nervous2: require("@/assets/faces/gem/G05-2.png"),
    nervous3: require("@/assets/faces/gem/G05-3.png"),
    nervous4: require("@/assets/faces/gem/G05-4.png"),
    annoyed1: require("@/assets/faces/gem/G06-1.png"),
  },
  alta: {
    normal: require("@/assets/faces/A01-1.png"),
    talk: require("@/assets/faces/A01-2.png"),
    doubt: require("@/assets/faces/A01-2.png"),
    normal1: require("@/assets/faces/alta/A01-1.png"),
    normal2: require("@/assets/faces/alta/A01-2.png"),
    normal3: require("@/assets/faces/alta/A01-3.png"),
    normal4: require("@/assets/faces/alta/A01-4.png"),
    grumpy1: require("@/assets/faces/alta/A02-1.png"),
    grumpy2: require("@/assets/faces/alta/A02-2.png"),
    grumpy3: require("@/assets/faces/alta/A02-3.png"),
    grumpy4: require("@/assets/faces/alta/A02-4.png"),
    grin1: require("@/assets/faces/alta/A03-1.png"),
    grin2: require("@/assets/faces/alta/A03-2.png"),
    grin3: require("@/assets/faces/alta/A03-3.png"),
    grin4: require("@/assets/faces/alta/A03-4.png"),
    sparkle1: require("@/assets/faces/alta/A04-1.png"),
    sparkle2: require("@/assets/faces/alta/A04-2.png"),
    smirk3: require("@/assets/faces/alta/A05-3.png"),
    smirk4: require("@/assets/faces/alta/A05-4.png"),
    shocked3: require("@/assets/faces/alta/A06-3.png"),
    shocked4: require("@/assets/faces/alta/A06-4.png"),
  },
};

type StoryCharactersProps = {
  effect?: StoryLine["effect"];
  contentKey?: string;
  leftExpression?: GemExpression;
  rightExpression?: AltaExpression;
};

export default function StoryCharacters({
  effect,
  contentKey,
  leftExpression = "normal",
  rightExpression = "normal",
}: StoryCharactersProps) {
  const bossCharacter = STORY_CHARACTER_BY_SPEAKER.boss;
  const subCharacter = STORY_CHARACTER_BY_SPEAKER.sub;
  const [shake] = useState(() => new Animated.Value(0));
  const effectType = effect?.type;
  const target = effect?.target;
  useEffect(() => {
    shake.setValue(0);
    if (effectType !== "shout") return;
    const animation = Animated.sequence(
      [-3, 3, -3, 3, -3, 3, -3, 0].map((toValue) =>
        Animated.timing(shake, {
          toValue,
          duration: 25,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ),
    );
    animation.start();
    return () => {
      animation.stop();
      shake.setValue(0);
    };
  }, [shake, contentKey, effectType, target]);

  return (
    <View style={styles.charactersContainer}>
      {leftExpression === "none" ? (
        <View style={styles.characterImage} />
      ) : (
        <Animated.Image
          source={faceAssets[bossCharacter][leftExpression]}
          style={[
            styles.characterImage,
            target === bossCharacter && { transform: [{ translateY: shake }] },
          ]}
          resizeMode="contain"
          accessibilityLabel={STORY_CHARACTER_NAMES[bossCharacter]}
        />
      )}
      {rightExpression === "none" ? (
        <View style={styles.characterImage} />
      ) : (
        <Animated.Image
          source={faceAssets[subCharacter][rightExpression]}
          style={[
            styles.characterImage,
            target === subCharacter && { transform: [{ translateY: shake }] },
          ]}
          resizeMode="contain"
          accessibilityLabel={STORY_CHARACTER_NAMES[subCharacter]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  charactersContainer: {
    alignItems: "flex-end",
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
  },
  characterImage: {
    height: "100%",
    width: "50%",
  },
});

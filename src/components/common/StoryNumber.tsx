import { Image, type ImageSource } from "expo-image";

const numbers: Record<number, ImageSource> = {
  // Use the actual glyphs: some supplied filenames differ from their contents.
  1: require("@/assets/numbers/shop_chapter_07.svg"),
  2: require("@/assets/numbers/shop_chapter_02.svg"),
  3: require("@/assets/numbers/shop_chapter_03.svg"),
  4: require("@/assets/numbers/shop_chapter_05.svg"),
  5: require("@/assets/numbers/shop_chapter_06.svg"),
  6: require("@/assets/numbers/shop_chapter_09.svg"),
  7: require("@/assets/numbers/shop_chapter_01.svg"),
  8: require("@/assets/numbers/shop_chapter_04.svg"),
  9: require("@/assets/numbers/story_number_09.svg"),
  10: require("@/assets/numbers/story_number_10.svg"),
  11: require("@/assets/numbers/story_number_11.svg"),
  12: require("@/assets/numbers/story_number_12.svg"),
  13: require("@/assets/numbers/story_number_13.svg"),
  14: require("@/assets/numbers/story_number_14.svg"),
};

export default function StoryNumber({
  number,
  color,
  height = 60,
}: {
  number: number;
  color: string;
  height?: number;
}) {
  return (
    <Image
      source={numbers[number]}
      style={{ width: height, height }}
      contentFit="contain"
      tintColor={color}
      pointerEvents="none"
      accessible={false}
    />
  );
}

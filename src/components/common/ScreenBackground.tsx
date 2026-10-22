import { Image, type ImageProps } from "expo-image";
import { useWindowDimensions } from "react-native";

export default function ScreenBackground({
  source,
}: {
  source: NonNullable<ImageProps["source"]>;
}) {
  const { height } = useWindowDimensions();
  return (
    <Image
      source={source}
      style={{ position: "absolute", top: 0, left: 0, right: 0, height }}
      contentFit="cover"
      contentPosition="center"
      pointerEvents="none"
      accessible={false}
    />
  );
}

import { useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type TextProps,
  type TextStyle,
  type ViewStyle,
  type ViewProps,
} from "react-native";

import { japaneseParagraphs } from "@/src/domain/common/japaneseLineBreaks";

const TEXT_STYLE_KEYS = new Set([
  "color", "fontFamily", "fontSize", "fontStyle", "fontWeight", "fontVariant",
  "letterSpacing", "lineHeight", "textAlign", "textAlignVertical",
  "textDecorationColor", "textDecorationLine", "textDecorationStyle",
  "textShadowColor", "textShadowOffset", "textShadowRadius", "textTransform",
  "includeFontPadding", "writingDirection", "userSelect",
]);

export type NaturalTextProps = Omit<TextProps, "children" | "onTextLayout" | "tabIndex"> & {
  tabIndex?: ViewProps["tabIndex"];
  children: string;
  visibleCharacters?: number;
  manualTitleBreaks?: boolean;
};

export default function NaturalText({
  children,
  visibleCharacters,
  manualTitleBreaks = false,
  accessibilityLabel,
  accessible = true,
  style,
  numberOfLines,
  adjustsFontSizeToFit,
  minimumFontScale = 0.5,
  maxFontSizeMultiplier,
  allowFontScaling = true,
  selectable,
  ...props
}: NaturalTextProps) {
  const { fontScale } = useWindowDimensions();
  const [width, setWidth] = useState(0);
  const [fit, setFit] = useState({ key: "", scale: 1 });
  const paragraphs = useMemo(
    () => japaneseParagraphs(children, manualTitleBreaks),
    [children, manualTitleBreaks],
  );
  const flatStyle = StyleSheet.flatten(style) ?? {};
  const entries = Object.entries(flatStyle);
  const textStyle = Object.fromEntries(entries.filter(([key]) => TEXT_STYLE_KEYS.has(key))) as TextStyle;
  const layoutStyle = Object.fromEntries(entries.filter(([key]) => !TEXT_STYLE_KEYS.has(key))) as ViewStyle;
  const fitKey = JSON.stringify([children, width, fontScale, textStyle, numberOfLines]);
  const fitScale = fit.key === fitKey ? fit.scale : 1;
  const multiplier = !allowFontScaling ? 1
    : maxFontSizeMultiplier && maxFontSizeMultiplier > 0
      ? Math.min(fontScale, maxFontSizeMultiplier) : fontScale;
  const fontSize = (textStyle.fontSize ?? 14) * fitScale;
  const lineHeight = textStyle.lineHeight === undefined ? undefined : textStyle.lineHeight * fitScale;
  const phraseStyle: TextStyle = { ...textStyle, fontSize, lineHeight };
  const maxHeight = numberOfLines && numberOfLines > 0
    ? Math.ceil(numberOfLines * (lineHeight ?? fontSize * 1.4) * multiplier) : undefined;
  const textProps = { allowFontScaling, maxFontSizeMultiplier, accessible: false };
  const justifyContent = textStyle.textAlign === "center" ? "center"
    : textStyle.textAlign === "right" ? "flex-end" : "flex-start";

  return (
    <View
      {...props}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel ?? children}
      style={[layoutStyle, { minWidth: 0 }, maxHeight !== undefined && { maxHeight, overflow: "hidden" }]}
      onLayout={(event) => {
        const nextWidth = event.nativeEvent.layout.width;
        setWidth((current) => current === nextWidth ? current : nextWidth);
        props.onLayout?.(event);
      }}
    >
      <View
        key={adjustsFontSizeToFit ? fitKey : undefined}
        aria-hidden
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        onLayout={(event) => {
          if (
            adjustsFontSizeToFit && maxHeight !== undefined && width > 0 &&
            event.nativeEvent.layout.height > maxHeight + 1 && fitScale > minimumFontScale
          ) {
            setFit({ key: fitKey, scale: Math.max(minimumFontScale, fitScale - 0.05) });
          }
        }}
      >
        {paragraphs.map((paragraph, paragraphIndex) => {
          if (visibleCharacters !== undefined && paragraph.offset >= visibleCharacters) return null;
          return (
            <View key={paragraphIndex} style={[styles.paragraph, { justifyContent }]}>
              {paragraph.phrases.length === 0 ? (
                <Text {...textProps} style={phraseStyle}>{" "}</Text>
              ) : paragraph.phrases.map((phrase) => {
                const count = visibleCharacters === undefined ? phrase.characters.length
                  : Math.max(0, visibleCharacters - phrase.offset);
                if (count === 0) return null;
                const fullText = phrase.characters.join("");
                if (count >= phrase.characters.length) {
                  return <Text key={phrase.offset} {...textProps} selectable={selectable} style={[phraseStyle, styles.phrase]}>{fullText}</Text>;
                }
                // Reserve the complete phrase's width while revealing its prefix.
                return (
                  <View key={phrase.offset} style={styles.phrase}>
                    <Text {...textProps} style={[phraseStyle, styles.measure]}>{fullText}</Text>
                    <Text {...textProps} style={[phraseStyle, styles.reveal]}>{phrase.characters.slice(0, count).join("")}</Text>
                  </View>
                );
              })}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  paragraph: { flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start" },
  phrase: { flexShrink: 0, maxWidth: "100%" },
  measure: { opacity: 0 },
  reveal: { position: "absolute", left: 0, right: 0, top: 0 },
});

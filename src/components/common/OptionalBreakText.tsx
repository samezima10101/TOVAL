import NaturalText, { type NaturalTextProps } from "./NaturalText";
import { plainText } from "@/src/domain/common/optionalLineBreaks";

export default function OptionalBreakText({
  children,
  accessibilityLabel,
  ...props
}: Omit<NaturalTextProps, "manualTitleBreaks" | "visibleCharacters">) {
  return (
    <NaturalText {...props} manualTitleBreaks accessibilityLabel={plainText(accessibilityLabel ?? children)}>
      {children}
    </NaturalText>
  );
}

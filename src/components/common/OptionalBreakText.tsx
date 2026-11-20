import { Text, type TextProps } from "react-native";

import { formatOptionalLineBreaks, plainText } from "@/src/domain/common/optionalLineBreaks";

export default function OptionalBreakText({
  children,
  accessibilityLabel,
  ...props
}: Omit<TextProps, "children"> & { children: string }) {
  return (
    <Text {...props} accessibilityLabel={plainText(accessibilityLabel ?? children)}>
      {formatOptionalLineBreaks(children)}
    </Text>
  );
}

const WORD_JOINER = "\u2060";
const BREAK_OPPORTUNITY = "\u200B";

export function formatOptionalLineBreaks(text: string): string {
  if (!text.includes("|")) return text;

  return text.split("\n").map((paragraph) => {
    if (!paragraph.includes("|")) return paragraph;
    return paragraph.split("|")
      .map((part) => Array.from(part).join(WORD_JOINER))
      .join(BREAK_OPPORTUNITY);
  }).join("\n");
}

export function plainText(text: string): string {
  return text.replaceAll("|", "");
}

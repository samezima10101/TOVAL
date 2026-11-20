import { jaModel, Parser } from "budoux";

const parser = new Parser(jaModel);

export type JapanesePhrase = {
  offset: number;
  characters: readonly string[];
};

export type JapaneseParagraph = {
  offset: number;
  phrases: readonly JapanesePhrase[];
};

/** Offsets count original code points, including explicit newlines. */
export function japaneseParagraphs(
  text: string,
  manualTitleBreaks = false,
): readonly JapaneseParagraph[] {
  if (text.length === 0) return [];
  let offset = 0;
  return text.split("\n").map((paragraph, index) => {
    if (index > 0) offset += 1;
    const paragraphOffset = offset;
    const chunks = manualTitleBreaks && paragraph.includes("|")
      ? paragraph.split("|").filter(Boolean)
      : parser.parse(paragraph);
    const phrases = chunks.map((chunk) => {
      const characters = Array.from(chunk);
      const phrase = { offset, characters };
      offset += characters.length;
      return phrase;
    });
    return { offset: paragraphOffset, phrases };
  });
}

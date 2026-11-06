import { episode00, INTRO_LINES } from "@/src/content/stories/episode00";
import type { StoryEpisode, StoryLine } from "@/src/domain/common/types";

const segments = INTRO_LINES.reduce<
  { lines: StoryLine[]; field?: "userName" | "taskName" }[]
>(
  (parts, line) => {
    if (line.input) {
      parts[parts.length - 1].field = line.input;
      parts.push({ lines: [] });
    } else parts[parts.length - 1].lines.push(line);
    return parts;
  },
  [{ lines: [] }],
);

export function getIntroSegment(part: number): {
  episode: StoryEpisode;
  field?: "userName" | "taskName";
} {
  const segment = segments[part];
  return {
    episode: {
      ...episode00,
      commonBefore: segment.lines,
      commonAfter: [],
    },
    field: segment.field,
  };
}

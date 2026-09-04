import type {
  EpisodeId,
  StoryEpisode,
  StoryLine,
  StoryRoute,
} from "@/src/domain/common/types";
import type { StoryCatalog } from "@/src/domain/storyData";

function makeLine(
  id: string,
  speaker: StoryLine["speaker"],
  text = `${id} fixture text`,
): StoryLine {
  return {
    id,
    speaker,
    text,
    left: "normal",
    right: "talk",
  };
}

const branchingRoutes: readonly [StoryRoute, StoryRoute] = [
  {
    id: "fixture-route-primary",
    label: "Primary fixture choice",
    lines: [
      makeLine("primary-1", "sub"),
      makeLine("primary-2", "boss"),
      makeLine("primary-3", "sub"),
    ],
  },
  {
    id: "fixture-route-secondary",
    label: "Secondary fixture choice",
    lines: [
      makeLine("secondary-1", "sub"),
      makeLine("secondary-2", "boss"),
      makeLine("secondary-3", "sub"),
    ],
  },
];

export const branchingStory: StoryEpisode = {
  id: 101,
  title: "Branching fixture story",
  commonBefore: [
    makeLine("opening-1", "sub"),
    makeLine("opening-2", "boss"),
  ],
  routes: branchingRoutes,
  commonAfter: [makeLine("closing-1", "sub")],
};

export const linearStory: StoryEpisode = {
  id: 202,
  title: "Linear fixture story",
  commonBefore: [makeLine("linear-1", "sub")],
  commonAfter: [makeLine("linear-2", "boss")],
};

export const storyFixtures: readonly StoryEpisode[] = [
  branchingStory,
  linearStory,
];

export const storyCatalog: StoryCatalog = { episodes: storyFixtures };

export function getFixtureStoryEpisode(
  id: number,
): StoryEpisode | undefined {
  return storyFixtures.find((episode) => episode.id === id);
}

export const branchingEpisodeId: EpisodeId = branchingStory.id;
export const primaryRoute = branchingRoutes[0];
export const secondaryRoute = branchingRoutes[1];

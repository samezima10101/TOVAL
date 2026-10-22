import { episode01 } from '@/src/content/stories/episode01';
import { episode02 } from '@/src/content/stories/episode02';
import { episode03 } from '@/src/content/stories/episode03';
import { episode04 } from '@/src/content/stories/episode04';
import { episode05 } from '@/src/content/stories/episode05';
import { episode06 } from '@/src/content/stories/episode06';
import { episode07 } from '@/src/content/stories/episode07';
import { episode08 } from '@/src/content/stories/episode08';
import { episode09 } from '@/src/content/stories/episode09';
import { episode10 } from '@/src/content/stories/episode10';
import { episode11 } from '@/src/content/stories/episode11';
import { episode12 } from '@/src/content/stories/episode12';
import { episode13 } from '@/src/content/stories/episode13';
import { episode14 } from '@/src/content/stories/episode14';
import {
  EpisodeId,
  Speaker,
  StoryCharacter,
  StoryEpisode,
  StoryLine,
  StoryRoute,
  StoryRouteProgress,
  UnlockedStory,
} from "./common/types";

/** Character identity is kept with story content, not inferred by the UI. */
export const STORY_CHARACTER_BY_SPEAKER: Record<Speaker, StoryCharacter> = {
  boss: "gem",
  sub: "alta",
};

export const STORY_CHARACTER_NAMES: Record<StoryCharacter, string> = {
  gem: "ジェム",
  alta: "アルタ",
};

export const STORY_EPISODES: readonly StoryEpisode[] = [
  episode01, episode02, episode03, episode04, episode05, episode06, episode07,
  episode08, episode09, episode10, episode11, episode12, episode13, episode14,
];
export type StoryCatalog = { episodes: readonly StoryEpisode[] };
export const STORY_CATALOG: StoryCatalog = { episodes: STORY_EPISODES };

export function getStoryEpisode(id: number, catalog: StoryCatalog = STORY_CATALOG): StoryEpisode | undefined {
  return catalog.episodes.find((episode) => episode.id === id);
}

export function getStoryRoute(
  episode: StoryEpisode,
  routeId: string | undefined,
): StoryRoute | undefined {
  return routeId
    ? episode.routes?.find((route) => route.id === routeId)
    : undefined;
}

/** Returns the complete playable sequence after a route has been selected. */
export function getPlayableStoryLines(
  episode: StoryEpisode,
  routeId?: string,
): readonly StoryLine[] {
  const route = getStoryRoute(episode, routeId);
  return [
    ...episode.commonBefore,
    ...(route?.lines ?? []),
    ...episode.commonAfter,
  ];
}

export function isStoryRouteUnlocked(
  progress: StoryRouteProgress | undefined,
  routeId: string,
): boolean {
  return (
    progress?.firstSelectedRouteId === routeId ||
    progress?.extraUnlockedRouteIds.includes(routeId) === true
  );
}

/** Keep today's unlocked episode visible; otherwise show the next daily unlock. */
export function getTodaysStoryEpisode(
  unlockedStories: readonly UnlockedStory[],
  today: string,
  catalog: StoryCatalog = STORY_CATALOG,
): StoryEpisode | undefined {
  const unlockedToday = catalog.episodes.find((episode) =>
    unlockedStories.some(
      (story) => story.episodeId === episode.id && story.unlockedDate === today,
    ),
  );
  return unlockedToday ?? catalog.episodes.find((episode) =>
    !unlockedStories.some((story) => story.episodeId === episode.id),
  ) ?? catalog.episodes[catalog.episodes.length - 1];
}

export function isEpisodeId(value: number, catalog: StoryCatalog = STORY_CATALOG): value is EpisodeId {
  return Number.isInteger(value) && catalog.episodes.some((episode) => episode.id === value);
}

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

const line = (
  id: string,
  speaker: Speaker,
  text: string,
  left: StoryLine["left"],
  right: StoryLine["right"],
): StoryLine => ({ id, speaker, text, left, right });

const episodes: readonly StoryEpisode[] = [
  {
    id: 1,
    title: "初めてのタスク完了！",
    commonBefore: [
      line(
        "episode-01-01",
        "sub",
        "お疲れ様です。\n今日も無事に目標達成しましたね。",
        "normal",
        "talk",
      ),
      line(
        "episode-01-02",
        "boss",
        "うん、おつかれさま～。\n明日もがんばってね。",
        "talk",
        "normal",
      ),
    ],
    // Temporary branching sample; replace with final episode content later.
    routes: [
      {
        id: "episode-01-encourage",
        label: "ありがとうございます！",
        lines: [
          line(
            "episode-01-encourage-01",
            "boss",
            "うん、いい返事だね。",
            "talk",
            "normal",
          ),
          line(
            "episode-01-encourage-02",
            "sub",
            "うわびっくりした。\n急に大声上げなくても...",
            "normal",
            "talk",
          ),
          line("episode-01-encourage-03", "boss", "へへっ", "talk", "normal"),
        ],
      },
      {
        id: "episode-01-bow",
        label: "はい、わかりました。",
        lines: [
          line("episode-01-bow-01", "sub", "...はい。", "normal", "talk"),
          line(
            "episode-01-bow-02",
            "sub",
            "（なんか...気まずっ）",
            "normal",
            "talk",
          ),
        ],
      },
    ],
    commonAfter: [
      line("episode-01-03", "sub", "・・・では失礼します。", "normal", "talk"),
      line("episode-01-03", "boss", "ばいば～い", "talk", "normal"),
    ],
  },
  {
    id: 2,
    title: "上司からの労い",
    commonBefore: [
      line(
        "episode-02-01",
        "sub",
        "お疲れ様です。\n今日も無事に目標達成しましたね。",
        "normal",
        "talk",
      ),
      line(
        "episode-02-02",
        "boss",
        "うん、おつかれさま～。\n明日もがんばってね。",
        "talk",
        "normal",
      ),
      line("episode-02-03", "sub", "・・・あれ？", "normal", "talk"),
    ],
    commonAfter: [],
  },
  {
    id: 3,
    title: "部下の決意",
    commonBefore: [
      line(
        "episode-03-01",
        "sub",
        "・・・おかしい、\n同じ一日を繰り返してる。",
        "normal",
        "talk",
      ),
      line("episode-03-02", "boss", "うん？どした？", "talk", "normal"),
      line("episode-03-03", "sub", "・・・いえ？", "normal", "talk"),
    ],
    commonAfter: [],
  },
];

export const STORY_EPISODES: readonly StoryEpisode[] = episodes;

export function getStoryEpisode(id: number): StoryEpisode | undefined {
  return episodes.find((episode) => episode.id === id);
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

/** The most recently unlocked episode is shown in the home story card. */
export function getLatestUnlockedEpisode(
  unlockedStories: readonly UnlockedStory[],
): StoryEpisode | undefined {
  const latestStory = unlockedStories[unlockedStories.length - 1];
  return latestStory ? getStoryEpisode(latestStory.episodeId) : undefined;
}

/** The newest unread episode is the home screen's temporary talk entry. */
export function getLatestUnreadEpisode(
  unlockedStories: readonly UnlockedStory[],
): StoryEpisode | undefined {
  for (let index = unlockedStories.length - 1; index >= 0; index -= 1) {
    const story = unlockedStories[index];
    if (!story.isRead) {
      return getStoryEpisode(story.episodeId);
    }
  }
  return undefined;
}

export function isEpisodeId(value: number): value is EpisodeId {
  return Number.isInteger(value) && value >= 1 && value <= episodes.length;
}

import {
  EpisodeId,
  Speaker,
  StoryCharacter,
  StoryEpisode,
  UnlockedStory,
} from "./types";

/** Character identity is kept with story content, not inferred by the UI. */
export const STORY_CHARACTER_BY_SPEAKER: Record<Speaker, StoryCharacter> = {
  boss: "gem",
  sub: "alta",
};

export const STORY_CHARACTER_NAMES: Record<StoryCharacter, string> = {
  gem: "ジェム",
  alta: "アルタ",
};

const episodes: readonly StoryEpisode[] = [
  {
    id: 1,
    title: "初めてのタスク完了！",
    lines: [
      {
        row: 1,
        speaker: "sub",
        text: "お疲れ様です。\n今日も無事に目標達成しましたね。",
        left: "normal",
        right: "talk",
      },
      {
        row: 2,
        speaker: "boss",
        text: "うん、おつかれさま～。\n明日もがんばってね。",
        left: "talk",
        right: "normal",
      },
      {
        row: 3,
        speaker: "sub",
        text: "・・・では失礼します。",
        left: "normal",
        right: "talk",
      },
    ],
  },
  {
    id: 2,
    title: "上司からの労い",
    lines: [
      {
        row: 1,
        speaker: "sub",
        text: "お疲れ様です。\n今日も無事に目標達成しましたね。",
        left: "normal",
        right: "talk",
      },
      {
        row: 2,
        speaker: "boss",
        text: "うん、おつかれさま～。\n明日もがんばってね。",
        left: "talk",
        right: "normal",
      },
      {
        row: 3,
        speaker: "sub",
        text: "・・・あれ？",
        left: "normal",
        right: "talk",
      },
    ],
  },
  {
    id: 3,
    title: "部下の決意",
    lines: [
      {
        row: 1,
        speaker: "sub",
        text: "・・・おかしい、\n同じ一日を繰り返してる。",
        left: "normal",
        right: "talk",
      },
      {
        row: 2,
        speaker: "boss",
        text: "うん？どした？",
        left: "talk",
        right: "normal",
      },
      {
        row: 3,
        speaker: "sub",
        text: "・・・いえ？",
        left: "normal",
        right: "talk",
      },
    ],
  },
];

export const STORY_EPISODES: readonly StoryEpisode[] = episodes;

export function getStoryEpisode(id: number): StoryEpisode | undefined {
  return episodes.find((episode) => episode.id === id);
}

/** The most recently unlocked episode is the home screen's talk entry. */
export function getLatestUnlockedEpisode(
  unlockedStories: readonly UnlockedStory[],
): StoryEpisode | undefined {
  const latestStory = unlockedStories[unlockedStories.length - 1];
  return latestStory ? getStoryEpisode(latestStory.episodeId) : undefined;
}

export function isEpisodeId(value: number): value is EpisodeId {
  return Number.isInteger(value) && value >= 1 && value <= episodes.length;
}

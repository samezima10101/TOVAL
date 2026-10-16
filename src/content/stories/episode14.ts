// 仮本文: docs/story-drafts/episode14.md。話ID・分岐IDは購入記録の識別子。
import type { StoryEpisode } from '@/src/domain/common/types';

export const episode14: StoryEpisode = {
  "id": 14,
  "title": "また、ここで",
  "commonBefore": [
    {
      "id": "episode-14-before-1",
      "speaker": "sub",
      "text": "同じ一日に見えても、前とは少し違う気がします。",
      "left": "normal",
      "right": "talk"
    },
    {
      "id": "episode-14-before-2",
      "speaker": "boss",
      "text": "じゃあ、また次も見に来ようか。何が違ったか。",
      "left": "talk",
      "right": "normal"
    }
  ],
  "routes": [
    {
      "id": "episode-14-route-a",
      "label": "また明日、来ます",
      "lines": [
        {
          "id": "episode-14-a-1",
          "speaker": "sub",
          "text": "はい。次の時間も、ここから始めたいです。",
          "left": "normal",
          "right": "talk"
        },
        {
          "id": "episode-14-a-2",
          "speaker": "boss",
          "text": "待ってるよ。まずは今日、おつかれさま。",
          "left": "talk",
          "right": "normal"
        }
      ]
    },
    {
      "id": "episode-14-route-b",
      "label": "少し休んでから来ます",
      "lines": [
        {
          "id": "episode-14-b-1",
          "speaker": "sub",
          "text": "今度は、少し間を空けてから来るかもしれません。",
          "left": "normal",
          "right": "talk"
        },
        {
          "id": "episode-14-b-2",
          "speaker": "boss",
          "text": "それでも大丈夫。戻ってきた時に、また続きを始めよう。",
          "left": "talk",
          "right": "normal"
        }
      ]
    }
  ],
  "commonAfter": [
    {
      "id": "episode-14-after-1",
      "speaker": "sub",
      "text": "今日はここまで。また、ここで。",
      "left": "normal",
      "right": "talk"
    }
  ]
};

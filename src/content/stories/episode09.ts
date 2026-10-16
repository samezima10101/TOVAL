// 仮本文: docs/story-drafts/episode09.md。話ID・分岐IDは購入記録の識別子。
import type { StoryEpisode } from '@/src/domain/common/types';

export const episode09: StoryEpisode = {
  "id": 9,
  "title": "うまくいかなかったこと",
  "commonBefore": [
    {
      "id": "episode-09-before-1",
      "speaker": "sub",
      "text": "集中はできましたが、思ったほど進みませんでした。",
      "left": "normal",
      "right": "talk"
    },
    {
      "id": "episode-09-before-2",
      "speaker": "boss",
      "text": "どこで止まったか、ひとつだけ残しておく？",
      "left": "talk",
      "right": "normal"
    }
  ],
  "routes": [
    {
      "id": "episode-09-route-a",
      "label": "つまずいた所を書きます",
      "lines": [
        {
          "id": "episode-09-a-1",
          "speaker": "sub",
          "text": "同じ所で迷わないよう、書いておきます。",
          "left": "normal",
          "right": "talk"
        },
        {
          "id": "episode-09-a-2",
          "speaker": "boss",
          "text": "それも、今日わかったことだね。",
          "left": "talk",
          "right": "normal"
        }
      ]
    },
    {
      "id": "episode-09-route-b",
      "label": "今日はここまでにします",
      "lines": [
        {
          "id": "episode-09-b-1",
          "speaker": "sub",
          "text": "今は言葉にするのも難しいです。",
          "left": "normal",
          "right": "talk"
        },
        {
          "id": "episode-09-b-2",
          "speaker": "boss",
          "text": "じゃあ、今日は空欄でもいい。明日、思い出したら書こう。",
          "left": "talk",
          "right": "normal"
        }
      ]
    }
  ],
  "commonAfter": [
    {
      "id": "episode-09-after-1",
      "speaker": "sub",
      "text": "また次に、続きをやってみます。",
      "left": "normal",
      "right": "talk"
    }
  ]
};

// 仮本文。編集方法: docs/editing-guide.md。話ID・分岐IDは購入記録の識別子。
import type { StoryEpisode } from '@/src/domain/common/types';

export const episode11: StoryEpisode = {
  "id": 11,
  "title": "同じ言葉",
  "commonBefore": [
    {
      "id": "episode-11-before-1",
      "speaker": "boss",
      "text": "今日も、おつかれさま。",
      "left": "talk",
      "right": "normal"
    },
    {
      "id": "episode-11-before-2",
      "speaker": "sub",
      "text": "その言葉、前にも聞いた気がします。",
      "left": "normal",
      "right": "talk"
    }
  ],
  "routes": [
    {
      "id": "episode-11-route-a",
      "label": "今日の分も受け取ります",
      "lines": [
        {
          "id": "episode-11-a-1",
          "speaker": "sub",
          "text": "ありがとうございます。今日は今日の分ですね。",
          "left": "normal",
          "right": "talk"
        },
        {
          "id": "episode-11-a-2",
          "speaker": "boss",
          "text": "うん。何回でも、その日の分を言うよ。",
          "left": "talk",
          "right": "normal"
        }
      ]
    },
    {
      "id": "episode-11-route-b",
      "label": "毎回同じですね",
      "lines": [
        {
          "id": "episode-11-b-1",
          "speaker": "sub",
          "text": "毎回同じなのに、少し違って聞こえます。",
          "left": "normal",
          "right": "talk"
        },
        {
          "id": "episode-11-b-2",
          "speaker": "boss",
          "text": "聞いている君が違うから、かもしれないね。",
          "left": "talk",
          "right": "normal"
        }
      ]
    }
  ],
  "commonAfter": [
    {
      "id": "episode-11-after-1",
      "speaker": "sub",
      "text": "……では、今日もお疲れ様でした。",
      "left": "normal",
      "right": "talk"
    }
  ]
};

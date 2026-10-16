// 仮本文: docs/story-drafts/episode13.md。話ID・分岐IDは購入記録の識別子。
import type { StoryEpisode } from '@/src/domain/common/types';

export const episode13: StoryEpisode = {
  "id": 13,
  "title": "明日の準備",
  "commonBefore": [
    {
      "id": "episode-13-before-1",
      "speaker": "boss",
      "text": "明日は何から始める？",
      "left": "talk",
      "right": "normal"
    },
    {
      "id": "episode-13-before-2",
      "speaker": "sub",
      "text": "今日の続きを少しだけ進めたいです。",
      "left": "normal",
      "right": "talk"
    }
  ],
  "routes": [
    {
      "id": "episode-13-route-a",
      "label": "道具を揃えておきます",
      "lines": [
        {
          "id": "episode-13-a-1",
          "speaker": "sub",
          "text": "最初に使うものを、ここに置いて帰ります。",
          "left": "normal",
          "right": "talk"
        },
        {
          "id": "episode-13-a-2",
          "speaker": "boss",
          "text": "それなら、明日迷わず手を伸ばせるね。",
          "left": "talk",
          "right": "normal"
        }
      ]
    },
    {
      "id": "episode-13-route-b",
      "label": "やることを一行書きます",
      "lines": [
        {
          "id": "episode-13-b-1",
          "speaker": "sub",
          "text": "次にすることを、一行だけ決めておきます。",
          "left": "normal",
          "right": "talk"
        },
        {
          "id": "episode-13-b-2",
          "speaker": "boss",
          "text": "うん。今、全部終わらせなくてもいいからね。",
          "left": "talk",
          "right": "normal"
        }
      ]
    }
  ],
  "commonAfter": [
    {
      "id": "episode-13-after-1",
      "speaker": "sub",
      "text": "明日の自分に、続きを渡しておきます。",
      "left": "normal",
      "right": "talk"
    }
  ]
};

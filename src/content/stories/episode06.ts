// 仮本文: docs/story-drafts/episode06.md。話ID・分岐IDは購入記録の識別子。
import type { StoryEpisode } from '@/src/domain/common/types';

export const episode06: StoryEpisode = {
  "id": 6,
  "title": "窓の外の雨",
  "commonBefore": [
    {
      "id": "episode-06-before-1",
      "speaker": "boss",
      "text": "雨の音がする。昨日も降ってたっけ？",
      "left": "talk",
      "right": "normal"
    },
    {
      "id": "episode-06-before-2",
      "speaker": "sub",
      "text": "覚えていません。でも、今日は落ち着いて聞けます。",
      "left": "normal",
      "right": "talk"
    }
  ],
  "routes": [
    {
      "id": "episode-06-route-a",
      "label": "少し聞いていきます",
      "lines": [
        {
          "id": "episode-06-a-1",
          "speaker": "sub",
          "text": "もう少しだけ、ここで雨の音を聞いていたいです。",
          "left": "normal",
          "right": "talk"
        },
        {
          "id": "episode-06-a-2",
          "speaker": "boss",
          "text": "うん。終わった後の時間も、たまにはゆっくりね。",
          "left": "talk",
          "right": "normal"
        }
      ]
    },
    {
      "id": "episode-06-route-b",
      "label": "そろそろ帰ります",
      "lines": [
        {
          "id": "episode-06-b-1",
          "speaker": "sub",
          "text": "今日は早めに帰って休もうと思います。",
          "left": "normal",
          "right": "talk"
        },
        {
          "id": "episode-06-b-2",
          "speaker": "boss",
          "text": "気をつけて。傘を忘れないようにね。",
          "left": "talk",
          "right": "normal"
        }
      ]
    }
  ],
  "commonAfter": [
    {
      "id": "episode-06-after-1",
      "speaker": "sub",
      "text": "今日の景色は、覚えておけそうです。",
      "left": "normal",
      "right": "talk"
    }
  ]
};

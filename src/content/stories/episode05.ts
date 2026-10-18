// 仮本文。編集方法: docs/conversation-settings.md。話ID・分岐IDは購入記録の識別子。
import type { StoryEpisode } from '@/src/domain/common/types';

export const episode05: StoryEpisode = {
  "id": 5,
  "title": "始めるまでの時間",
  "commonBefore": [
    {
      "id": "episode-05-before-1",
      "speaker": "sub",
      "text": "今日は、取りかかるまでに時間がかかりました。",
      "left": "normal",
      "right": "talk"
    },
    {
      "id": "episode-05-before-2",
      "speaker": "boss",
      "text": "でも、取りかかった。そこからの時間を大事にしようか。",
      "left": "talk",
      "right": "normal"
    }
  ],
  "routes": [
    {
      "id": "episode-05-route-a",
      "label": "始められてよかったです",
      "lines": [
        {
          "id": "episode-05-a-1",
          "speaker": "sub",
          "text": "途中まででも、手をつけられてよかったです。",
          "left": "normal",
          "right": "talk"
        },
        {
          "id": "episode-05-a-2",
          "speaker": "boss",
          "text": "その続きを見つけやすくしておくと、明日が助かるね。",
          "left": "talk",
          "right": "normal"
        }
      ]
    },
    {
      "id": "episode-05-route-b",
      "label": "もっと早く始めたかった",
      "lines": [
        {
          "id": "episode-05-b-1",
          "speaker": "sub",
          "text": "始める前に迷いすぎた気がします。",
          "left": "normal",
          "right": "talk"
        },
        {
          "id": "episode-05-b-2",
          "speaker": "boss",
          "text": "何から始めるか、今ひとつだけ決めておこうか。",
          "left": "talk",
          "right": "normal"
        }
      ]
    }
  ],
  "commonAfter": [
    {
      "id": "episode-05-after-1",
      "speaker": "sub",
      "text": "今日の分を記録してから帰ります。",
      "left": "normal",
      "right": "talk"
    }
  ]
};

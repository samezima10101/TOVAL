// 仮本文。編集方法: docs/editing-guide.md。話ID・分岐IDは購入記録の識別子。
import type { StoryEpisode } from '@/src/domain/common/types';

export const episode10: StoryEpisode = {
  "id": 10,
  "title": "昨日のメモ",
  "commonBefore": [
    {
      "id": "episode-10-before-1",
      "speaker": "sub",
      "text": "今日は、昨日のメモですぐ始められました。",
      "left": "normal",
      "right": "talk"
    },
    {
      "id": "episode-10-before-2",
      "speaker": "boss",
      "text": "昨日の君が、今日の君を手伝ったんだ。",
      "left": "talk",
      "right": "normal"
    }
  ],
  "routes": [
    {
      "id": "episode-10-route-a",
      "label": "次の自分にも残します",
      "lines": [
        {
          "id": "episode-10-a-1",
          "speaker": "sub",
          "text": "今日の続きも、一行残しておきます。",
          "left": "normal",
          "right": "talk"
        },
        {
          "id": "episode-10-a-2",
          "speaker": "boss",
          "text": "次はその一行が、入口になるかもしれないね。",
          "left": "talk",
          "right": "normal"
        }
      ]
    },
    {
      "id": "episode-10-route-b",
      "label": "少し不思議です",
      "lines": [
        {
          "id": "episode-10-b-1",
          "speaker": "sub",
          "text": "覚えていなくても、助けてもらえるんですね。",
          "left": "normal",
          "right": "talk"
        },
        {
          "id": "episode-10-b-2",
          "speaker": "boss",
          "text": "君が残したものだからね。忘れた日の分も、ここにある。",
          "left": "talk",
          "right": "normal"
        }
      ]
    }
  ],
  "commonAfter": [
    {
      "id": "episode-10-after-1",
      "speaker": "sub",
      "text": "記録しておいてよかったです。",
      "left": "normal",
      "right": "talk"
    }
  ]
};

// 仮本文。編集方法: docs/editing-guide.md。話ID・分岐IDは購入記録の識別子。
import type { StoryEpisode } from '@/src/domain/common/types';

export const episode12: StoryEpisode = {
  "id": 12,
  "title": "増えたページ",
  "commonBefore": [
    {
      "id": "episode-12-before-1",
      "speaker": "sub",
      "text": "気づけば、記録が何ページにもなっていました。",
      "left": "normal",
      "right": "talk"
    },
    {
      "id": "episode-12-before-2",
      "speaker": "boss",
      "text": "全部を覚えていなくても、ここに残ってる。",
      "left": "talk",
      "right": "normal"
    }
  ],
  "routes": [
    {
      "id": "episode-12-route-a",
      "label": "最初の日を見返します",
      "lines": [
        {
          "id": "episode-12-a-1",
          "speaker": "sub",
          "text": "最初は、何を書いていたのでしょう。",
          "left": "normal",
          "right": "talk"
        },
        {
          "id": "episode-12-a-2",
          "speaker": "boss",
          "text": "今の君なら、違う感想を持つかもしれないね。",
          "left": "talk",
          "right": "normal"
        }
      ]
    },
    {
      "id": "episode-12-route-b",
      "label": "今日の続きを書きます",
      "lines": [
        {
          "id": "episode-12-b-1",
          "speaker": "sub",
          "text": "読み返すのは後にして、今日の分を足します。",
          "left": "normal",
          "right": "talk"
        },
        {
          "id": "episode-12-b-2",
          "speaker": "boss",
          "text": "また一ページ増えるね。",
          "left": "talk",
          "right": "normal"
        }
      ]
    }
  ],
  "commonAfter": [
    {
      "id": "episode-12-after-1",
      "speaker": "sub",
      "text": "これなら、できた日を見失わずに済みそうです。",
      "left": "normal",
      "right": "talk"
    }
  ]
};

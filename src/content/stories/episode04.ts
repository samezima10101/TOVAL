// 仮本文。編集方法: docs/conversation-settings.md。話ID・分岐IDは購入記録の識別子。
import type { StoryEpisode } from '@/src/domain/common/types';

export const episode04: StoryEpisode = {
  "id": 4,
  "title": "小さな違い",
  "commonBefore": [
    {
      "id": "episode-04-before-1",
      "speaker": "sub",
      "text": "机の上に、昨日はなかったメモがあります。",
      "left": "normal",
      "right": "talk"
    },
    {
      "id": "episode-04-before-2",
      "speaker": "boss",
      "text": "やったことを書いておいたんだ。忘れたくなくてね。",
      "left": "talk",
      "right": "normal"
    }
  ],
  "routes": [
    {
      "id": "episode-04-route-a",
      "label": "私も残してみます",
      "lines": [
        {
          "id": "episode-04-a-1",
          "speaker": "sub",
          "text": "今日できたことを、一行だけ書いてみます。",
          "left": "normal",
          "right": "talk"
        },
        {
          "id": "episode-04-a-2",
          "speaker": "boss",
          "text": "いいね。明日の自分に渡すメモだ。",
          "left": "talk",
          "right": "normal"
        }
      ]
    },
    {
      "id": "episode-04-route-b",
      "label": "誰が書いたのでしょう",
      "lines": [
        {
          "id": "episode-04-b-1",
          "speaker": "sub",
          "text": "この字、本当に昨日の私の字でしょうか。",
          "left": "normal",
          "right": "talk"
        },
        {
          "id": "episode-04-b-2",
          "speaker": "boss",
          "text": "君が書いたものなら、どこか見覚えがあるんじゃない？",
          "left": "talk",
          "right": "normal"
        }
      ]
    }
  ],
  "commonAfter": [
    {
      "id": "episode-04-after-1",
      "speaker": "sub",
      "text": "……同じように見えても、何かは残るんですね。",
      "left": "normal",
      "right": "talk"
    }
  ]
};

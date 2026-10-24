// 仮本文。編集方法: docs/editing-guide.md。話ID・分岐IDは購入記録の識別子。
import type { StoryEpisode } from '@/src/domain/common/types';

export const episode03: StoryEpisode = {
  "id": 3,
  "title": "部下の決意",
  "commonBefore": [
    {
      "id": "episode-03-before-1",
      "speaker": "sub",
      "text": "・・・おかしい、同じ一日を繰り返してる。",
      "left": "normal",
      "right": "talk"
    },
    {
      "id": "episode-03-before-2",
      "speaker": "boss",
      "text": "うん？ どした？",
      "left": "talk",
      "right": "normal"
    }
  ],
  "routes": [
    {
      "id": "episode-03-route-a",
      "label": "確かめてみたいです",
      "lines": [
        {
          "id": "episode-03-a-1",
          "speaker": "sub",
          "text": "昨日のことを覚えているか、確かめてみたいんです。",
          "left": "normal",
          "right": "talk"
        },
        {
          "id": "episode-03-a-2",
          "speaker": "boss",
          "text": "じゃあ、何か小さな印を残してみようか。",
          "left": "talk",
          "right": "normal"
        }
      ]
    },
    {
      "id": "episode-03-route-b",
      "label": "少し疲れただけかも",
      "lines": [
        {
          "id": "episode-03-b-1",
          "speaker": "sub",
          "text": "同じことばかり考えてしまって。",
          "left": "normal",
          "right": "talk"
        },
        {
          "id": "episode-03-b-2",
          "speaker": "boss",
          "text": "今日はゆっくり休んでから考えてもいいんじゃない？",
          "left": "talk",
          "right": "normal"
        }
      ]
    }
  ],
  "commonAfter": [
    {
      "id": "episode-03-after-1",
      "speaker": "sub",
      "text": "……明日は、ひとつだけ違うことをしてみます。",
      "left": "normal",
      "right": "talk"
    }
  ]
};

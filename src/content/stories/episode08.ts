// 仮本文: docs/story-drafts/episode08.md。話ID・分岐IDは購入記録の識別子。
import type { StoryEpisode } from '@/src/domain/common/types';

export const episode08: StoryEpisode = {
  "id": 8,
  "title": "ひと息",
  "commonBefore": [
    {
      "id": "episode-08-before-1",
      "speaker": "boss",
      "text": "今日はここまでにしようか。肩に力が入ってる。",
      "left": "talk",
      "right": "normal"
    },
    {
      "id": "episode-08-before-2",
      "speaker": "sub",
      "text": "……気づきませんでした。",
      "left": "normal",
      "right": "talk"
    }
  ],
  "routes": [
    {
      "id": "episode-08-route-a",
      "label": "少し伸びをします",
      "lines": [
        {
          "id": "episode-08-a-1",
          "speaker": "sub",
          "text": "席を立って、少し体を動かしてきます。",
          "left": "normal",
          "right": "talk"
        },
        {
          "id": "episode-08-a-2",
          "speaker": "boss",
          "text": "戻ってきたら、荷物をまとめて帰ろうか。",
          "left": "talk",
          "right": "normal"
        }
      ]
    },
    {
      "id": "episode-08-route-b",
      "label": "温かいものを飲みます",
      "lines": [
        {
          "id": "episode-08-b-1",
          "speaker": "sub",
          "text": "お茶を飲んでから帰ります。",
          "left": "normal",
          "right": "talk"
        },
        {
          "id": "episode-08-b-2",
          "speaker": "boss",
          "text": "いいね。僕も一杯もらおうかな。",
          "left": "talk",
          "right": "normal"
        }
      ]
    }
  ],
  "commonAfter": [
    {
      "id": "episode-08-after-1",
      "speaker": "sub",
      "text": "明日のために、今日はゆっくり休みます。",
      "left": "normal",
      "right": "talk"
    }
  ]
};

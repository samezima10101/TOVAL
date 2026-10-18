// 仮本文。編集方法: docs/conversation-settings.md。話ID・分岐IDは購入記録の識別子。
import type { StoryEpisode } from '@/src/domain/common/types';

export const episode07: StoryEpisode = {
  "id": 7,
  "title": "机の上の印",
  "commonBefore": [
    {
      "id": "episode-07-before-1",
      "speaker": "sub",
      "text": "メモの隅に、小さな印をつけてみました。",
      "left": "normal",
      "right": "talk"
    },
    {
      "id": "episode-07-before-2",
      "speaker": "boss",
      "text": "今日の分？",
      "left": "talk",
      "right": "normal"
    }
  ],
  "routes": [
    {
      "id": "episode-07-route-a",
      "label": "できたことの印です",
      "lines": [
        {
          "id": "episode-07-a-1",
          "speaker": "sub",
          "text": "はい。ひとつ進められたので。",
          "left": "normal",
          "right": "talk"
        },
        {
          "id": "episode-07-a-2",
          "speaker": "boss",
          "text": "見つけた時、何をした日か思い出せるね。",
          "left": "talk",
          "right": "normal"
        }
      ]
    },
    {
      "id": "episode-07-route-b",
      "label": "明日の自分への印です",
      "lines": [
        {
          "id": "episode-07-b-1",
          "speaker": "sub",
          "text": "次に来た自分が、見つけられるように。",
          "left": "normal",
          "right": "talk"
        },
        {
          "id": "episode-07-b-2",
          "speaker": "boss",
          "text": "届くといいね。君から君への合図だ。",
          "left": "talk",
          "right": "normal"
        }
      ]
    }
  ],
  "commonAfter": [
    {
      "id": "episode-07-after-1",
      "speaker": "sub",
      "text": "明日、確かめてみます。",
      "left": "normal",
      "right": "talk"
    }
  ]
};

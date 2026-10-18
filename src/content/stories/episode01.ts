// 仮本文。編集方法: docs/conversation-settings.md。話ID・分岐IDは購入記録の識別子。
import type { StoryEpisode } from '@/src/domain/common/types';

export const episode01: StoryEpisode = {
  "id": 1,
  "title": "初めてのタスク完了！",
  "commonBefore": [
    {
      "id": "episode-01-before-1",
      "speaker": "sub",
      "text": "お疲れ様です。今日も無事に目標達成しましたね。",
      "left": "normal",
      "right": "talk"
    },
    {
      "id": "episode-01-before-2",
      "speaker": "boss",
      "text": "うん、おつかれさま～。明日もがんばってね。",
      "left": "talk",
      "right": "normal"
    }
  ],
  "routes": [
    {
      "id": "episode-01-encourage",
      "label": "ありがとうございます！",
      "lines": [
        {
          "id": "episode-01-a-1",
          "speaker": "sub",
          "text": "ありがとうございます！ 明日も頑張ります！",
          "left": "normal",
          "right": "talk"
        },
        {
          "id": "episode-01-a-2",
          "speaker": "boss",
          "text": "いい返事だね～。でも、頑張りすぎはだめだよ？",
          "left": "talk",
          "right": "normal"
        },
        {
          "id": "episode-01-a-3",
          "speaker": "sub",
          "text": "はい！ しっかり休んで、また明日に備えます。",
          "left": "normal",
          "right": "talk"
        }
      ]
    },
    {
      "id": "episode-01-bow",
      "label": "はい、わかりました。",
      "lines": [
        {
          "id": "episode-01-b-1",
          "speaker": "sub",
          "text": "はい、わかりました。",
          "left": "normal",
          "right": "talk"
        },
        {
          "id": "episode-01-b-2",
          "speaker": "boss",
          "text": "あれ、ちょっと疲れてる？ 今日はもうゆっくり休みなね～。",
          "left": "talk",
          "right": "normal"
        },
        {
          "id": "episode-01-b-3",
          "speaker": "sub",
          "text": "……お気遣いありがとうございます。お言葉に甘えます。",
          "left": "normal",
          "right": "talk"
        }
      ]
    }
  ],
  "commonAfter": [
    {
      "id": "episode-01-after-1",
      "speaker": "sub",
      "text": "・・・では失礼します。",
      "left": "normal",
      "right": "talk"
    }
  ]
};

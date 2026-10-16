// 仮本文: docs/story-drafts/episode02.md。話ID・分岐IDは購入記録の識別子。
import type { StoryEpisode } from '@/src/domain/common/types';

export const episode02: StoryEpisode = {
  "id": 2,
  "title": "上司からの労い",
  "commonBefore": [
    {
      "id": "episode-02-before-1",
      "speaker": "sub",
      "text": "お疲れ様です。今日も無事に目標達成しましたね。",
      "left": "normal",
      "right": "talk"
    },
    {
      "id": "episode-02-before-2",
      "speaker": "boss",
      "text": "うん、おつかれさま～。明日もがんばってね。",
      "left": "talk",
      "right": "normal"
    }
  ],
  "routes": [
    {
      "id": "episode-02-route-a",
      "label": "前にも聞いたような……",
      "lines": [
        {
          "id": "episode-02-a-1",
          "speaker": "sub",
          "text": "昨日も同じことを言われた気がします。",
          "left": "normal",
          "right": "talk"
        },
        {
          "id": "episode-02-a-2",
          "speaker": "boss",
          "text": "そう？ 今日は今日のおつかれさま、だよ。",
          "left": "talk",
          "right": "normal"
        }
      ]
    },
    {
      "id": "episode-02-route-b",
      "label": "今日も頑張りました",
      "lines": [
        {
          "id": "episode-02-b-1",
          "speaker": "sub",
          "text": "はい。今日も少し進められました。",
          "left": "normal",
          "right": "talk"
        },
        {
          "id": "episode-02-b-2",
          "speaker": "boss",
          "text": "よかった。続きはまた、明日にしようね。",
          "left": "talk",
          "right": "normal"
        }
      ]
    }
  ],
  "commonAfter": [
    {
      "id": "episode-02-after-1",
      "speaker": "sub",
      "text": "・・・あれ？",
      "left": "normal",
      "right": "talk"
    }
  ]
};

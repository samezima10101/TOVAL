import { StoryEpisode } from "@/src/domain/common/types";

export const SIDE_STORY: StoryEpisode = {
  id: 101,
  title: "雨宿りの帰り道",
  commonBefore: [
    {
      id: "side-01",
      speaker: "sub",
      text: "あ、雨が降ってきましたね。\n傘は持っていますか？",
      left: "normal",
      right: "talk",
    },
    {
      id: "side-02",
      speaker: "boss",
      text: "忘れちゃった。\n少し、ここで雨宿りしようか。",
      left: "talk",
      right: "normal",
    },
    {
      id: "side-03",
      speaker: "sub",
      text: "……急ぎの用事はないですし、\nたまにはゆっくり帰りましょう。",
      left: "normal",
      right: "talk",
    },
    {
      id: "side-04",
      speaker: "boss",
      text: "うん。雨の音、意外といいね。",
      left: "talk",
      right: "normal",
    },
  ],
  commonAfter: [],
};

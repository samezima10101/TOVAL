import type { ShopConversation, StoryEpisode } from "@/src/domain/common/types";

export const SHOP_KEEPER_NAME = "？？？";

export const SIDE_STORY: ShopConversation = {
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

// 追加2件は仮本文。価格・入荷条件はconfig/conversationSettings.tsで編集する。
export const SHOP_CONVERSATIONS: readonly ShopConversation[] = [
  SIDE_STORY,
  {
    id: 102,
    title: "休憩のひととき",
    commonBefore: [
      {
        id: "side-02-01",
        speaker: "sub",
        text: "……少し、休憩しませんか。",
        left: "normal",
        right: "talk",
      },
      {
        id: "side-02-02",
        speaker: "boss",
        text: "いいね。温かいものでも飲もうか。",
        left: "talk",
        right: "normal",
      },
    ],
    commonAfter: [],
  },
  {
    id: 103,
    title: "雨上がり",
    commonBefore: [
      {
        id: "side-03-01",
        speaker: "boss",
        text: "雨、やんだみたいだね。",
        left: "talk",
        right: "normal",
      },
      {
        id: "side-03-02",
        speaker: "sub",
        text: "……本当だ。少し、外を歩きましょうか。",
        left: "normal",
        right: "talk",
      },
    ],
    commonAfter: [],
  },
];

// 原稿 side_story_opening。left/right がともに none の行は店員の立ち絵を隠す。
export const SIDE_STORY_OPENING: StoryEpisode = {
  id: -3,
  title: SHOP_KEEPER_NAME,
  commonBefore: [
    {
      id: "side-story-opening-01",
      speaker: "sub",
      text: "・・・",
      left: "none",
      right: "none",
    },
    {
      id: "side-story-opening-02",
      speaker: "sub",
      text: "・・・[userName]",
      left: "none",
      right: "none",
    },
    {
      id: "side-story-opening-03",
      speaker: "sub",
      text: "・・・",
      left: "normal",
      right: "normal",
    },
    {
      id: "side-story-opening-04",
      speaker: "sub",
      text: "・・・",
      left: "normal",
      right: "normal",
    },
    {
      id: "side-story-opening-05",
      speaker: "sub",
      text: "君ならここに来てくれると信じていたよ",
      left: "normal",
      right: "normal",
    },
    {
      id: "side-story-opening-06",
      speaker: "sub",
      text: "君なら彼らを変えられる",
      left: "normal",
      right: "normal",
    },
    {
      id: "side-story-opening-07",
      speaker: "sub",
      text: "この録音が君に与える影響を",
      left: "normal",
      right: "normal",
    },
    {
      id: "side-story-opening-08",
      speaker: "sub",
      text: "私はここで見ている",
      left: "normal",
      right: "normal",
    },
  ],
  commonAfter: [],
};

export const SHOP_GREETING: StoryEpisode = {
  id: -1,
  title: SHOP_KEEPER_NAME,
  commonBefore: [
    {
      id: "eto-hello",
      speaker: "sub",
      text: "・・・どうも",
      left: "normal",
      right: "normal",
    },
  ],
  commonAfter: [],
};
export const SHOP_GREETING_WITH_ARRIVALS: StoryEpisode = {
  ...SHOP_GREETING,
  commonAfter: [
    {
      id: "eto-new",
      speaker: "sub",
      text: "面白いものが録れたよ",
      left: "normal",
      right: "normal",
    },
  ],
};
export const SHOP_FAREWELL: StoryEpisode = {
  id: -2,
  title: SHOP_KEEPER_NAME,
  commonBefore: [
    {
      id: "eto-bye",
      speaker: "sub",
      text: "引き続き、よろしくね",
      left: "normal",
      right: "normal",
    },
  ],
  commonAfter: [],
};

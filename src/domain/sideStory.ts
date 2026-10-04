import { AppState, StoryEpisode } from "@/src/domain/common/types";

export type ShopConversation = Omit<StoryEpisode, "routes"> & { requiredEpisodeId?: number };

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

// ponytail: 追加2件は仮の本文・入荷条件。正式シナリオが届いたらこのデータだけ差し替える。
export const SHOP_CONVERSATIONS: readonly ShopConversation[] = [
  SIDE_STORY,
  {
    id: 102,
    title: "休憩のひととき",
    requiredEpisodeId: 2,
    commonBefore: [
      { id: "side-02-01", speaker: "sub", text: "……少し、休憩しませんか。", left: "normal", right: "talk" },
      { id: "side-02-02", speaker: "boss", text: "いいね。温かいものでも飲もうか。", left: "talk", right: "normal" },
    ],
    commonAfter: [],
  },
  {
    id: 103,
    title: "雨上がり",
    requiredEpisodeId: 2,
    commonBefore: [
      { id: "side-03-01", speaker: "boss", text: "雨、やんだみたいだね。", left: "talk", right: "normal" },
      { id: "side-03-02", speaker: "sub", text: "……本当だ。少し、外を歩きましょうか。", left: "normal", right: "talk" },
    ],
    commonAfter: [],
  },
];

export function listAvailableConversations(state: AppState): readonly ShopConversation[] {
  return SHOP_CONVERSATIONS.filter((conversation) =>
    state.purchasedSideStoryIds.includes(conversation.id) ||
    conversation.requiredEpisodeId === undefined ||
    state.unlockedStories.some((story) => story.episodeId === conversation.requiredEpisodeId && story.isRead),
  );
}

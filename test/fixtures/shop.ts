import type { ShopConversation, StoryEpisode, StoryLine } from "@/src/domain/common/types";

export const SIDE_STORY_COST_NT = 17;
export const SHOP_KEEPER_NAME = "Fixture shopkeeper";

const line = (id: string): StoryLine => ({
  id, speaker: "sub", text: `${id} fixture dialogue`, left: "normal", right: "talk",
});
const episode = (id: number): StoryEpisode => ({
  id, title: `Fixture episode ${id}`, commonBefore: [line(`episode-${id}`)], commonAfter: [],
});
export const SIDE_STORY: ShopConversation = {
  id: 101, title: "Fixture conversation", commonBefore: [line("side-1"), line("side-2"), line("side-3"), line("side-4")], commonAfter: [],
};
export const SHOP_CONVERSATIONS: readonly ShopConversation[] = [
  SIDE_STORY,
  { ...episode(102), requiredEpisodeId: 2 },
  { ...episode(103), requiredEpisodeId: 2 },
];
export const SHOP_GREETING = episode(-1);
export const SHOP_GREETING_WITH_ARRIVALS = { ...SHOP_GREETING, commonAfter: [line("arrival")] };
export const SHOP_FAREWELL = episode(-2);

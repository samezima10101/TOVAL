import { AppState, ShopConversation } from "@/src/domain/common/types";
import { SHOP_CONVERSATIONS } from "@/src/content/shop";

export type { ShopConversation } from "@/src/domain/common/types";
export { SHOP_CONVERSATIONS, SIDE_STORY } from "@/src/content/shop";

export function listAvailableConversations(state: AppState): readonly ShopConversation[] {
  return SHOP_CONVERSATIONS.filter((conversation) =>
    state.purchasedSideStoryIds.includes(conversation.id) ||
    conversation.requiredEpisodeId === undefined ||
    state.unlockedStories.some((story) => story.episodeId === conversation.requiredEpisodeId && story.isRead),
  );
}

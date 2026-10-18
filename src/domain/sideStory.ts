import { AppState, ShopConversation } from "@/src/domain/common/types";
import { SHOP_CONVERSATIONS } from "@/src/content/shop";
import { getSideStorySetting } from "@/src/config/conversationSettings";

export type { ShopConversation } from "@/src/domain/common/types";
export { SHOP_CONVERSATIONS, SIDE_STORY } from "@/src/content/shop";

export function listAvailableConversations(state: AppState): readonly ShopConversation[] {
  return SHOP_CONVERSATIONS.filter((conversation) => {
    if (state.purchasedSideStoryIds.includes(conversation.id)) return true;
    const { requiredUnlockedEpisodeId } = getSideStorySetting(conversation.id);
    return requiredUnlockedEpisodeId === null || state.unlockedStories.some(
      (story) => story.episodeId === requiredUnlockedEpisodeId,
    );
  });
}

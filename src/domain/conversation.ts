import { getAdditionalRoutePriceNt, getSideStorySetting } from "@/src/config/conversationSettings";
import { AppState } from "./common/types";
import { listAvailableConversations } from "./sideStory";
import { getStoryEpisode, getStoryRoute, isStoryRouteUnlocked, STORY_CATALOG, StoryCatalog } from "./storyData";

function requireRoute(state: AppState, episodeId: number, routeId: string, catalog: StoryCatalog) {
  if (!state.unlockedStories.some((story) => story.episodeId === episodeId)) {
    throw new Error("このストーリーはまだ解放されていません。");
  }
  const episode = getStoryEpisode(episodeId, catalog);
  if (!episode || !getStoryRoute(episode, routeId)) throw new Error("選択肢が見つかりません。");
}

// Replay and duplicate operations return the same state without another write/charge.
export function selectStoryRoute(state: AppState, episodeId: number, routeId: string, catalog = STORY_CATALOG): AppState {
  requireRoute(state, episodeId, routeId, catalog);
  const progress = state.storyRouteProgress[episodeId];
  if (isStoryRouteUnlocked(progress, routeId)) return state;
  if (progress?.firstSelectedRouteId) throw new Error("この選択肢は購入が必要です。");
  return {
    ...state,
    storyRouteProgress: { ...state.storyRouteProgress, [episodeId]: {
      firstSelectedRouteId: routeId,
      extraUnlockedRouteIds: [...(progress?.extraUnlockedRouteIds ?? [])],
    } },
  };
}

export function purchaseStoryRoute(state: AppState, episodeId: number, routeId: string, catalog = STORY_CATALOG): AppState {
  requireRoute(state, episodeId, routeId, catalog);
  const progress = state.storyRouteProgress[episodeId];
  if (isStoryRouteUnlocked(progress, routeId)) return state;
  if (!progress?.firstSelectedRouteId) throw new Error("初回の選択肢を選んでから解放してください。");
  const price = getAdditionalRoutePriceNt(episodeId);
  if (state.totalNt < price) throw new Error(`NTが不足しています（必要: ${price} NT）。`);
  return {
    ...state, totalNt: state.totalNt - price,
    storyRouteProgress: { ...state.storyRouteProgress, [episodeId]: {
      ...progress, extraUnlockedRouteIds: [...progress.extraUnlockedRouteIds, routeId],
    } },
  };
}

export function purchaseSideStory(state: AppState, conversationId: number): AppState {
  if (!listAvailableConversations(state).some((item) => item.id === conversationId)) {
    throw new Error("この会話はまだ入荷していません。");
  }
  if (state.purchasedSideStoryIds.includes(conversationId)) return state;
  const { priceNt } = getSideStorySetting(conversationId);
  if (state.totalNt < priceNt) throw new Error(`NTが不足しています（必要: ${priceNt} NT）。`);
  return { ...state, totalNt: state.totalNt - priceNt,
    purchasedSideStoryIds: [...state.purchasedSideStoryIds, conversationId] };
}

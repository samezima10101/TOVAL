// 編集方法: docs/editing-guide.md。IDは変更せず、値だけを編集する。
export const MAIN_STORY_SETTINGS: Readonly<Record<number, { additionalRoutePriceNt: number }>> = {
  1: { additionalRoutePriceNt: 60 },
  2: { additionalRoutePriceNt: 60 },
  3: { additionalRoutePriceNt: 60 },
  4: { additionalRoutePriceNt: 60 },
  5: { additionalRoutePriceNt: 60 },
  6: { additionalRoutePriceNt: 60 },
  7: { additionalRoutePriceNt: 60 },
  8: { additionalRoutePriceNt: 60 },
  9: { additionalRoutePriceNt: 60 },
  10: { additionalRoutePriceNt: 60 },
  11: { additionalRoutePriceNt: 60 },
  12: { additionalRoutePriceNt: 60 },
  13: { additionalRoutePriceNt: 60 },
  14: { additionalRoutePriceNt: 60 },
};

type SideStorySetting = {
  priceNt: number;
  // null = 条件なし、数値 = そのメイン話の解放が必要。
  requiredUnlockedEpisodeId: number | null;
};

export const SIDE_STORY_SETTINGS: Readonly<Record<number, SideStorySetting>> = {
  101: { priceNt: 60, requiredUnlockedEpisodeId: null },
  102: { priceNt: 60, requiredUnlockedEpisodeId: 2 },
  103: { priceNt: 60, requiredUnlockedEpisodeId: 2 },
};

function validPrice(price: number | undefined): number {
  if (price === undefined || !Number.isSafeInteger(price) || price < 0) {
    throw new Error("会話の価格設定を確認してください（0以上の整数NT）。");
  }
  return price;
}

export function getAdditionalRoutePriceNt(episodeId: number): number {
  return validPrice(MAIN_STORY_SETTINGS[episodeId]?.additionalRoutePriceNt);
}

export function getSideStorySetting(conversationId: number): SideStorySetting {
  const setting = SIDE_STORY_SETTINGS[conversationId];
  if (!setting) throw new Error("サイド会話の設定がありません。");
  validPrice(setting.priceNt);
  return setting;
}

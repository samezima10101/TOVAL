export type StoryArchiveChapterSetting = {
  id: number;
  title: string;
  storyIds: readonly number[];
};

// 表示用の章分け。storyIdsだけを移動し、保存済みの話ID・購入IDは変更しない。
// 現在の会話はChapter 1にまとめる。本文を追加するまでChapter 2〜8は準備中。
export const MEMORY_CHAPTERS: readonly StoryArchiveChapterSetting[] = [
  { id: 1, title: "Chapter 1", storyIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] },
  ...Array.from({ length: 7 }, (_, index) => ({
    id: index + 2,
    title: `Chapter ${index + 2}`,
    storyIds: [],
  })),
];

export const SHOP_CHAPTERS: readonly StoryArchiveChapterSetting[] = [
  { id: 1, title: "Chapter 1", storyIds: [101, 102, 103] },
  ...Array.from({ length: 7 }, (_, index) => ({
    id: index + 2,
    title: `Chapter ${index + 2}`,
    storyIds: [],
  })),
];

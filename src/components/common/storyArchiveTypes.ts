export type StoryArchiveItem = {
  id: number;
  number: number;
  title: string;
  description: string;
  status: string;
  metadata: readonly string[];
  isUnlocked: boolean;
  solo?: boolean;
  action: string;
  actionLabel: string;
  disabled: boolean;
  onPress: () => void;
};

export type StoryArchiveChapter = {
  id: number;
  title: string;
  items: readonly StoryArchiveItem[];
  emptyLabel: string;
};


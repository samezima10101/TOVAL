import type { StoryEpisode, StoryLine } from "@/src/domain/common/types";

type IntroLine = StoryLine & { input?: "userName" | "taskName" };

// Source: scripts_TOVAL_beta, tab 00（special）. Inputs are onboarding only.
export const INTRO_LINES: readonly IntroLine[] = [
  {
    id: "00-01",
    speaker: "boss",
    text: "アルタ、地球人が来たよ～",
    left: "normal4",
    right: "normal3",
  },
  {
    id: "00-02",
    speaker: "sub",
    text: "了解です。",
    left: "normal3",
    right: "normal4",
  },
  {
    id: "00-03",
    speaker: "sub",
    text: "はじめまして。",
    left: "normal1",
    right: "normal2",
  },
  {
    id: "00-04",
    speaker: "sub",
    text: "自分は「アルタ」と申します。",
    left: "normal1",
    right: "normal2",
  },
  {
    id: "00-05",
    speaker: "boss",
    text: "「ジェム」で～す",
    left: "beam1",
    right: "normal1",
  },
  {
    id: "00-06",
    speaker: "sub",
    text: "我々は地球人の調査のため、遠くの星からやってきました。",
    left: "normal1",
    right: "normal4",
  },
  {
    id: "00-07",
    speaker: "sub",
    text: "調査のために地球人を観察したいのですが、",
    left: "normal1",
    right: "normal2",
  },
  {
    id: "00-08",
    speaker: "sub",
    text: "諸事情により直接会うことができません。",
    left: "nervous1",
    right: "normal2",
  },
  {
    id: "00-09",
    speaker: "sub",
    text: "なので、定期的にあなたを観察する時間を作ってもらえるよう、",
    left: "normal3",
    right: "normal2",
  },
  {
    id: "00-10",
    speaker: "sub",
    text: "我々がこのアプリを開発しました。",
    left: "normal1",
    right: "normal2",
  },
  {
    id: "00-11",
    speaker: "boss",
    text: "我々は君を観察できるし、君はタスクに集中できる。",
    left: "normal2",
    right: "normal3",
  },
  {
    id: "00-12",
    speaker: "boss",
    text: "お互いwin-winでしょ？",
    left: "beam4",
    right: "normal1",
  },
  {
    id: "00-13",
    speaker: "sub",
    text: "では、実際に画面を操作してみましょうか。",
    left: "normal1",
    right: "normal2",
  },
  {
    id: "00-14",
    speaker: "boss",
    text: "・・・あ、名前聞くの忘れてない？",
    left: "normal4",
    right: "normal3",
  },
  {
    id: "00-15",
    speaker: "sub",
    text: "おっと。失礼しました。",
    left: "normal1",
    right: "normal2",
  },
  {
    id: "00-16",
    speaker: "sub",
    text: "お名前を教えてください。",
    left: "normal1",
    right: "normal2",
  },
  {
    id: "00-name",
    speaker: "system",
    text: "名前を入力",
    left: "normal1",
    right: "normal2",
    input: "userName",
  },
  {
    id: "00-17",
    speaker: "sub",
    text: "よろしくおねがいします、[userName]。",
    left: "normal1",
    right: "normal2",
  },
];

export const episode00: StoryEpisode = {
  id: 0,
  title: "チュートリアル",
  commonBefore: INTRO_LINES.filter((line) => !line.input),
  commonAfter: [],
};

const segments = INTRO_LINES.reduce<
  { lines: StoryLine[]; field?: "userName" | "taskName" }[]
>(
  (parts, line) => {
    if (line.input) {
      parts[parts.length - 1].field = line.input;
      parts.push({ lines: [] });
    } else parts[parts.length - 1].lines.push(line);
    return parts;
  },
  [{ lines: [] }],
);

export function getIntroSegment(part: number): {
  episode: StoryEpisode;
  field?: "userName" | "taskName";
} {
  const segment = segments[part];
  return {
    episode: {
      ...episode00,
      commonBefore: segment.lines,
      commonAfter: [],
    },
    field: segment.field,
  };
}

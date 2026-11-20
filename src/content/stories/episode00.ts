import type { StoryEpisode, StoryLine } from "@/src/domain/common/types";

type IntroLine = StoryLine & { input?: "userName" | "taskName" };

// Source: scripts_TOVAL_beta, tab 00(special). Inputs are onboarding only.
export const INTRO_LINES: readonly IntroLine[] = [
  {
    id: "00-01",
    speaker: "boss",
    text: "お、接続できたみたい",
    left: "normal2",
    right: "normal3",
  },
  {
    id: "00-02",
    speaker: "sub",
    text: "・・・！了解です。",
    left: "normal3",
    right: "normal2",
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
    text: "この度はTOVALのテストにご協力いただき、誠にありがとうございます。",
    left: "normal1",
    right: "normal2",
  },
  {
    id: "00-05",
    speaker: "sub",
    text: "自分は「アルタ」と申します。\nそして、こちらが・・・",
    left: "normal1",
    right: "normal4",
  },
  {
    id: "00-06",
    speaker: "boss",
    text: "「ジェム」で～す",
    left: "beam1",
    right: "normal3",
  },
  {
    id: "00-07",
    speaker: "sub",
    text: "我々は遠くの星からやってきた、いわゆる宇宙人です。",
    left: "normal1",
    right: "normal2",
  },
  {
    id: "00-08",
    speaker: "sub",
    text: "地球人の調査のため、当アプリを開発いたしました。",
    left: "doubt3",
    right: "normal2",
  },
  {
    id: "00-09",
    speaker: "sub",
    text: "正式版の調査期間は60日を予定していますが、今回はテストプレイということで7日間で完結します。",
    left: "normal1",
    right: "normal2",
  },
  {
    id: "00-10",
    speaker: "sub",
    text: "短い期間ですが、どうぞよろしくお願いします。",
    left: "normal1",
    right: "smile2",
  },
  {
    id: "00-11",
    speaker: "boss",
    text: "よろしく～",
    left: "normal2",
    right: "smile1",
  },
  {
    id: "00-12",
    speaker: "sub",
    text: "では早速、お名前を伺ってもよろしいでしょうか？",
    left: "normal1",
    right: "normal2",
  },
  {
    id: "00-name",
    speaker: "system",
    text: "名前を入力",
    left: "normal1",
    right: "normal1",
    input: "userName",
  },
  {
    id: "00-13",
    speaker: "sub",
    text: "[userName]、ですね。これからよろしくお願いします。",
    left: "normal1",
    right: "smile2",
  },
  {
    id: "00-14",
    speaker: "sub",
    text: "では続いて、TOVALの使い方を説明します。",
    left: "normal1",
    right: "normal2",
  },
  {
    id: "00-15",
    speaker: "sub",
    text: "まず１日の流れは、通知が来る→タイマーを起動→タスクに集中→我々との交流　となります。",
    left: "normal1",
    right: "normal2",
  },
  {
    id: "00-16",
    speaker: "sub",
    text: "タスクの内容は、\n①[userName]が毎日続けたいと思うこと\n②スマホをあまり使わずにできること\n③5分以上続けられること\nが条件です。",
    left: "normal1",
    right: "normal2",
  },
  {
    id: "00-17",
    speaker: "boss",
    text: "もしタスクが思いつかなかったら、「やることやる」ってことにして、毎日違うことやってもいいよ",
    left: "normal2",
    right: "normal3",
  },
  {
    id: "00-18",
    speaker: "boss",
    text: "アプリを起動してもらって君を観察できれば、我々はそれでいいからね～",
    left: "normal2",
    right: "grumpy3",
  },
  {
    id: "00-19",
    speaker: "sub",
    text: "・・・あ、別に撮影や録音をするわけではないのでご安心を。",
    left: "normal3",
    right: "grumpy2",
  },
  {
    id: "00-20",
    speaker: "boss",
    text: "あ～そうだね、地球人の技術は使わないから安心して～",
    left: "beam1",
    right: "grumpy3",
  },
  {
    id: "00-21",
    speaker: "sub",
    text: "・・・聞かなかったことにしてください。",
    left: "beam1",
    right: "grumpy2",
  },
  {
    id: "00-22",
    speaker: "sub",
    text: "では、とりあえず、タスクをお伺いしますね。",
    left: "normal1",
    right: "normal2",
  },
  {
    id: "00-task",
    speaker: "system",
    text: "タスクを入力",
    left: "normal1",
    right: "normal2",
    input: "taskName",
  },
  {
    id: "00-23",
    speaker: "sub",
    text: "ありがとうございます。",
    left: "normal1",
    right: "normal1",
  },
  {
    id: "00-24",
    speaker: "sub",
    text: "では、実際に1日の流れを体験してみましょう。",
    left: "normal1",
    right: "smile2",
  },
];

export const episode00: StoryEpisode = {
  id: 0,
  title: "ファースト|コンタクト",
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

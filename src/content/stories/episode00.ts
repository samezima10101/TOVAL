import type { StoryEpisode, StoryLine } from "@/src/domain/common/types";

type IntroLine = StoryLine & { input?: "userName" | "taskName" };

// Source: scripts_TOVAL, tab 00. Input markers are used only during onboarding.
export const INTRO_LINES: readonly IntroLine[] = [
  {
    id: "00-01",
    speaker: "boss",
    text: "お、接続できたみたい",
    left: "surprised2",
    right: "normal3",
  },
  {
    id: "00-02",
    speaker: "sub",
    text: "...！了解です。",
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
    text: "この度は「TOVAL」のテストプレイに\nご協力いただき、\n誠にありがとうございます。",
    left: "normal1",
    right: "normal2",
  },
  {
    id: "00-05",
    speaker: "sub",
    text: "自分は「アルタ」と申します。\nそして、こちらが...",
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
    text: "本日より我々が貴方のガイドとして\n習慣化をお手伝いさせていただきます。\n以後お見知りおきを。",
    left: "normal1",
    right: "normal2",
  },
  {
    id: "00-08",
    speaker: "sub",
    text: "では早速、お名前を伺っても\nよろしいでしょうか？",
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
    id: "00-09",
    speaker: "sub",
    text: "[userName]、ですね。\nこれからよろしくお願いします。",
    left: "normal1",
    right: "normal2",
  },
  {
    id: "00-10",
    speaker: "sub",
    text: "では続いて、当アプリを用いて継続させたい\nタスクをお伺いします。",
    left: "normal1",
    right: "normal2",
  },
  {
    id: "00-11",
    speaker: "boss",
    text: "「資格勉強」とか、「〇分歩く」とか、\n一言でいいからね～",
    left: "normal2",
    right: "normal1",
  },
  {
    id: "00-task",
    speaker: "system",
    text: "タスクを入力",
    left: "normal1",
    right: "normal1",
    input: "taskName",
  },
  {
    id: "00-12",
    speaker: "sub",
    text: "ありがとうございます。\nこれから2週間継続できるよう、\n一緒に頑張りましょう。",
    left: "normal1",
    right: "normal2",
  },
  {
    id: "00-13",
    speaker: "sub",
    text: "まずはTOVALの概要をお話しします。\n当アプリはTask Observation ...",
    left: "doubt3",
    right: "normal2",
  },
  {
    id: "00-14",
    speaker: "boss",
    text: "あー、先にさあ、",
    left: "doubt4",
    right: "normal3",
  },
  {
    id: "00-15",
    speaker: "boss",
    text: "このアプリの使い方教えたら？\n調査のことを話すと長くなりそうだし",
    left: "normal2",
    right: "normal3",
  },
  {
    id: "00-16",
    speaker: "sub",
    text: "...確かにそうですね。\n詳しいことは後ほどお話しするので、\n先にチュートリアルに進みましょう。",
    left: "normal1",
    right: "normal2",
  },
];

export const episode00: StoryEpisode = {
  id: 0,
  title: "はじめまして",
  commonBefore: INTRO_LINES.filter((line) => !line.input),
  commonAfter: [],
};

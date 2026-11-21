export type PracticeScene = "home" | "setup" | "timer" | "diary" | "done";
export type TutorialTarget =
  | "start"
  | "adjust"
  | "begin"
  | "dial"
  | "power"
  | "finish"
  | "cancel"
  | "diary"
  | "save"
  | "nt";
export type TutorialAction =
  | "open-setup"
  | "set-five"
  | "begin"
  | "power"
  | "finish"
  | "save";
type TutorialStep = {
  id: string;
  speaker: "alta" | "gem";
  text: string;
  scene: PracticeScene;
  target?: TutorialTarget;
  action?: TutorialAction;
  overtime?: boolean;
  fullScreen?: boolean;
};

// Source: scripts_TOVAL_beta, tab tutorial. Wording follows the current controls.
// Five minutes pass instantly in practice; no production timer is created.
export const TUTORIAL_STEPS: readonly TutorialStep[] = [
  {
    id: "home",
    speaker: "alta",
    scene: "home",
    fullScreen: true,
    text: "では習慣化の流れを実際にやってみましょう。ここがホーム画面です。"
  },
  {
    id: "start",
    speaker: "alta",
    scene: "home",
    target: "start",
    action: "open-setup",
    text: "まず、「はじめる」ボタンを押してください。"
  },
  {
    id: "setup",
    speaker: "alta",
    scene: "setup",
    target: "adjust",
    text: "次にタイマーの設定を決めます。\n左側は1時間単位、右側は5分単位で\nタイマーの時間を調節できます。"
  },
  {
    id: "default",
    speaker: "gem",
    scene: "setup",
    target: "adjust",
    text: "今はもう25分って入力されちゃってるけど、\nこういう「デフォルト時間」は\nメニューから設定できるから、\nあとで変えてみてね～"
  },
  {
    id: "five",
    speaker: "alta",
    scene: "setup",
    target: "adjust",
    action: "set-five",
    text: "では[userName]、「＋」、「ー」を押して\n今回は試しに5分を設定してください。"
  },
  {
    id: "begin",
    speaker: "alta",
    scene: "setup",
    target: "begin",
    action: "begin",
    text: "5分に設定できました。\n「タイマーを開始」を押してください。"
  },
  {
    id: "started",
    speaker: "alta",
    scene: "timer",
    fullScreen: true,
    text: "そうするとこのようにタイマーが始まります。\n今回は練習なので、5分間待たずに操作を体験できます。"
  },
  {
    id: "timer",
    speaker: "alta",
    scene: "timer",
    fullScreen: true,
    text: "では、タイマー画面について説明します。"
  },
  {
    id: "remaining",
    speaker: "alta",
    scene: "timer",
    target: "dial",
    text: "ここに残り時間が表示されます。\n0になるまでタスクを進めましょう。"
  },
  {
    id: "power-info",
    speaker: "alta",
    scene: "timer",
    target: "power",
    text: "ここを押すと「省電力モード」になります。\n画面をもう一度タップすると通常の画面に戻ります。"
  },
  {
    id: "power-try",
    speaker: "alta",
    scene: "timer",
    target: "power",
    action: "power",
    text: "試しに押してみてください。"
  },
  {
    id: "power-back",
    speaker: "alta",
    scene: "timer",
    text: "はい、ありがとうございます。"
  },
  {
    id: "lock-intro",
    speaker: "alta",
    scene: "timer",
    text: "ここで１つ注意点があります。"
  },
  {
    id: "lock",
    speaker: "alta",
    scene: "timer",
    text: "電源ボタンで画面を消してしまうと、タイマー、BGMともに止まってしまいます。"
  },
  {
    id: "silent-mode",
    speaker: "gem",
    scene: "timer",
    text: "マナーモードでBGMが無いと、画面ロックに気づかないで作業しちゃうことあるからね～"
  },
  {
    id: "power-reminder",
    speaker: "alta",
    scene: "timer",
    target: "power",
    text: "画面を暗くする際は必ず「省電力モード」にするよう、気を付けてください。"
  },
  {
    id: "finish-info",
    speaker: "alta",
    scene: "timer",
    target: "finish",
    text: "下のボタンは、目標時間経過後に押すことができるようになり、タイマーを終了できます。"
  },
  {
    id: "overtime",
    speaker: "gem",
    scene: "timer",
    target: "dial",
    overtime: true,
    text: "延長した時間はここに記録されていくよ"
  },
  {
    id: "nt",
    speaker: "alta",
    scene: "timer",
    target: "nt",
    text: "タイマーを終了すると、「NT」というポイントを獲得することができます。"
  },
  {
    id: "nt-rate",
    speaker: "alta",
    scene: "timer",
    target: "nt",
    text: "1秒1NTで換算され、目標時間＋延長時間分のNTを獲得します。\nこの練習ではNTや記録は追加されません。"
  },
  {
    id: "nt-use",
    speaker: "gem",
    scene: "timer",
    target: "nt",
    text: "ちなみにNTの使い道はいろいろあるから、\nいっぱい貯めとくとお得かもね～"
  },
  {
    id: "cancel",
    speaker: "alta",
    scene: "timer",
    target: "cancel",
    text: "ここから途中でタイマーをやめることができます。\nただその場合、貯まったNTは消滅してしまうので、\nご注意ください。目標時間に達する前だけキャンセルできます。"
  },
  {
    id: "background",
    speaker: "alta",
    scene: "timer",
    text: "タイマー起動後に他のアプリを使うことはできますが、その際はタイマーが一時停止します。"
  },
  {
    id: "foreground-only",
    speaker: "alta",
    scene: "timer",
    text: "タイマーは「TOVALを開いている時間のみ」が計測されることにご注意ください。"
  },
  {
    id: "finish",
    speaker: "alta",
    scene: "timer",
    target: "finish",
    action: "finish",
    overtime: true,
    text: "タイマーの説明は以上です。\n練習用に目標時間が経過した状態にしました。「終了」を押しましょう。"
  },
  {
    id: "diary",
    speaker: "alta",
    scene: "diary",
    fullScreen: true,
    text: "ここでタスクの振り返りをメモすることができます。"
  },
  {
    id: "diary-optional",
    speaker: "gem",
    scene: "diary",
    fullScreen: true,
    text: "何ページまで進んだ～とか、今日はどこまで歩いた～とかね。\n書かなくても大丈夫～"
  },
  {
    id: "save",
    speaker: "alta",
    scene: "diary",
    target: "save",
    action: "save",
    text: "今回はチュートリアルなのでスキップしましょう。\n空欄のまま「保存して終了」を押してください。練習用のため記録には残りません。"
  },
  {
    id: "complete",
    speaker: "alta",
    scene: "done",
    fullScreen: true,
    text: "以上でチュートリアルは終了です。"
  },
  {
    id: "feedback-intro",
    speaker: "gem",
    scene: "done",
    fullScreen: true,
    text: "あ、ちょっとまって、言いたいことある"
  },
  {
    id: "feedback-issues",
    speaker: "gem",
    scene: "done",
    fullScreen: true,
    text: "もしアプリの不具合やとか使いにくいところ、見ずらい画面とかあったら、"
  },
  {
    id: "feedback-screenshot",
    speaker: "gem",
    scene: "done",
    fullScreen: true,
    text: "「スクリーンショット」をしてくれると助かる～"
  },
  {
    id: "feedback-testflight",
    speaker: "alta",
    scene: "done",
    fullScreen: true,
    text: "不具合の報告はTestFlightの「フィードバックを送信」からできます。"
  },
  {
    id: "ready",
    speaker: "alta",
    scene: "done",
    fullScreen: true,
    text: "詳細はタスク終了後にご案内いたしますので、準備ができ次第、先ほどの流れでタスクを行ってみてください。"
  },
  {
    id: "waiting-alta",
    speaker: "alta",
    scene: "done",
    fullScreen: true,
    text: "では後ほどお会いいたしましょう。\nチュートリアルはメニューからいつでもやり直せます。"
  }
];

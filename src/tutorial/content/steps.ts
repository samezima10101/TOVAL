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
  | "save";
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
};

// Source: scripts_TOVAL, tab tutorial. Wording follows the current controls.
// Five minutes pass instantly in practice; no production timer is created.
export const TUTORIAL_STEPS: readonly TutorialStep[] = [
  {
    id: "start",
    speaker: "alta",
    scene: "home",
    target: "start",
    action: "open-setup",
    text: "では習慣化の流れを実際にやってみましょう。\nまず、「はじめる」ボタンを押してください。",
  },
  {
    id: "setup",
    speaker: "alta",
    scene: "setup",
    target: "adjust",
    text: "次にタイマーの設定を決めます。\n左側は1時間単位、右側は5分単位でタイマーの時間を調節できます。",
  },
  {
    id: "default",
    speaker: "gem",
    scene: "setup",
    target: "adjust",
    text: "練習では25分から始めるよ。こういう「デフォルト時間」はメニューから設定できるから、あとで変えてみてね～",
  },
  {
    id: "five",
    speaker: "alta",
    scene: "setup",
    target: "adjust",
    action: "set-five",
    text: "では[userName]、「＋」、「−」を押して今回は試しに5分を設定してください。",
  },
  {
    id: "begin",
    speaker: "alta",
    scene: "setup",
    target: "begin",
    action: "begin",
    text: "5分に設定できました。\n「タイマーを開始」を押してください。",
  },
  {
    id: "started",
    speaker: "alta",
    scene: "timer",
    target: "dial",
    text: "そうするとこのようにタイマーが始まります。\n今回は練習なので、5分間待たずに操作を体験できます。",
  },
  {
    id: "timer",
    speaker: "alta",
    scene: "timer",
    text: "では、タイマー画面について説明します。",
  },
  {
    id: "remaining",
    speaker: "alta",
    scene: "timer",
    target: "dial",
    text: "ここに残り時間が表示されます。\n0になるまでタスクを進めましょう。",
  },
  {
    id: "power-info",
    speaker: "alta",
    scene: "timer",
    target: "power",
    text: "ここを押すと「省電力モード」になります。\n画面をもう一度タップすると通常の画面に戻ります。",
  },
  {
    id: "power-try",
    speaker: "alta",
    scene: "timer",
    target: "power",
    action: "power",
    text: "試しに押してみてください。\n黒い画面になったら、画面をタップして戻りましょう。",
  },
  {
    id: "power-back",
    speaker: "alta",
    scene: "timer",
    text: "はい、ありがとうございます。",
  },
  {
    id: "lock",
    speaker: "alta",
    scene: "timer",
    text: "電源ボタンで画面を消してしまうと、タイマー、BGMともに止まってしまいます。",
  },
  {
    id: "power-reminder",
    speaker: "alta",
    scene: "timer",
    target: "power",
    text: "画面を暗くする際は必ず省電力モードにすることをお忘れなく。",
  },
  {
    id: "finish-info",
    speaker: "alta",
    scene: "timer",
    target: "finish",
    text: "下のボタンは、目標時間経過後に押すことができるようになり、タイマーを終了できます。",
  },
  {
    id: "manual-finish",
    speaker: "gem",
    scene: "timer",
    target: "finish",
    text: "タイマーは自動的に止まるんじゃなくて、このボタンを押して止める必要があるんだよね～",
  },
  {
    id: "overtime",
    speaker: "gem",
    scene: "timer",
    target: "dial",
    overtime: true,
    text: "延長した時間はここに記録されていくよ。\n今は練習用の延長表示だよ～",
  },
  {
    id: "nt",
    speaker: "alta",
    scene: "timer",
    text: "タイマーを終了すると、「NT」というポイントを獲得することができます。",
  },
  {
    id: "nt-rate",
    speaker: "alta",
    scene: "timer",
    text: "1秒1NTで換算され、目標時間＋延長時間分のNTを獲得します。\nこの練習ではNTや記録は追加されません。",
  },
  {
    id: "nt-use",
    speaker: "gem",
    scene: "timer",
    text: "ちなみにNTの使い道はいろいろあるから、いっぱい貯めとくといいかも～",
  },
  {
    id: "cancel",
    speaker: "alta",
    scene: "timer",
    target: "cancel",
    text: "ここから途中でタイマーをやめることができます。\nただ、その回で貯まったNTは受け取れませんので、ご注意ください。目標時間に達する前だけキャンセルできます。",
  },
  {
    id: "background",
    speaker: "alta",
    scene: "timer",
    text: "TOVALの画面を開かずにタブ化したり、他のアプリを使うと、タイマーは一時停止します。なるべく自分のタスクに集中しましょう。",
  },
  {
    id: "finish",
    speaker: "alta",
    scene: "timer",
    target: "finish",
    action: "finish",
    overtime: true,
    text: "タイマーの説明は以上です。\n練習用に目標時間が経過した状態にしました。「終了」を押しましょう。",
  },
  {
    id: "diary",
    speaker: "alta",
    scene: "diary",
    target: "diary",
    text: "ここでタスクの振り返りをメモすることができます。",
  },
  {
    id: "diary-optional",
    speaker: "gem",
    scene: "diary",
    target: "diary",
    text: "何ページまで進んだ～とか、今日はどこまで歩いた～とかね。\n書かなくても大丈夫～",
  },
  {
    id: "save",
    speaker: "alta",
    scene: "diary",
    target: "save",
    action: "save",
    text: "今回はチュートリアルなので入力をスキップしましょう。\n空欄のまま「保存して終了」を押してください。練習用のため記録には残りません。",
  },
  {
    id: "complete",
    speaker: "alta",
    scene: "done",
    text: "以上でチュートリアルは終了です。",
  },
  {
    id: "ready",
    speaker: "alta",
    scene: "done",
    text: "では準備ができたら、先ほどの流れでタスクを行ってみてください。",
  },
  {
    id: "waiting-gem",
    speaker: "gem",
    scene: "done",
    text: "終わったら我々についてもっと詳しく話すね。\nじゃ、待ってるよ～",
  },
  {
    id: "waiting-alta",
    speaker: "alta",
    scene: "done",
    text: "お待ちしております。\nチュートリアルはメニューからいつでもやり直せます。",
  },
];

# フォルダ型テキスト枠

更新日: 2026-10-23（日本時間）。対象はログ詳細Modal、共通会話枠、ホームの集中時間設定Modal、メニューの各カード。

共通部品は`shape="folder"`（既定）のフォルダ型と、`shape="rectangle"`の長方形を描画する。メニューの各カードは長方形を使い、ログ・会話・ホームの集中時間設定Modalはフォルダ型を使う。

## サイズ変更の方針

[`assets/images/file_textbox.svg`](../assets/images/file_textbox.svg)のインデックス部分、右上・右下の斜めの角、銀色の半透明背景と白い輪郭を共通の[`FileTextboxBackground`](../src/components/common/FileTextboxBackground.tsx)で描画する。親の実寸に合わせて本体の右辺・下辺を移動し、左上のインデックスを縦横別々に引き延ばさない。

通常の枠（幅120以上・高さ56以上）では、インデックスを斜辺まで含む幅93・高さ19で固定する。右上・右下の角と内側の線幅1も固定し、下の本体の幅・高さだけを変更する。単位はReact Nativeのレイアウトと同じpt相当。これより小さな枠では、装飾が交差しないよう装飾を縦横同率で縮小し、インデックスの比率を維持する。文字を入れる用途では通常の枠を使う。

元SVGを画像として`contentFit="fill"`で表示すると、インデックスも枠全体と一緒に変形する。アプリ内でサイズを変えて使う場合は、この共通部品を使う。

## 利用方法

背景だけを描く部品のため、親Viewが位置・幅・高さ・本文の余白を決める。背景を先に置き、後から文字や操作を置く。

```tsx
import { Text, View } from "react-native";

import FileTextboxBackground from "@/src/components/common/FileTextboxBackground";

<View
  style={{
    position: "relative",
    width: 280,
    height: 400,
    paddingTop: 28,
    paddingHorizontal: 20,
    paddingBottom: 18,
  }}
>
  <FileTextboxBackground />
  <Text>本文</Text>
</View>
```

幅340・高さ210へ変える場合も、親の`width`・`height`だけを変更する。画面幅への追従は親の`flex`や`left`・`right`で指定できる。本文の余白の目安は上28以上・左右20以上・下18以上とし、長文は利用側のScrollViewに入れる。背景部品に本文やスクロール、日付移動、会話進行を持たせない。

長方形では`<FileTextboxBackground shape="rectangle" />`を指定する。インデックスや斜めの角を付けず、四隅が直角の輪郭にする。`#CFCFCF`と白のグラデーション、塗りの不透明度0.38、白い輪郭の不透明度0.49はフォルダ型と共通にする。

背景は親全体へ絶対配置し、`onLayout`で実寸を取得して描画する。タップとアクセシビリティの対象から除外するため、本文のボタン・スクロールを妨げない。任意の`style`は背景の影などの装飾に使い、枠自体の寸法は親で指定する。

現行の利用箇所は[`LogModal`](../src/components/log/LogModal.tsx)、[`StoryMessageBox`](../src/components/story/StoryMessageBox.tsx)、[`TimerSetupModal`](../src/components/home/TimerSetupModal.tsx)。ログの上余白32、会話枠の左右18・下60・高さ210を含む外側の配置と本文余白は、各利用箇所で管理する。集中時間設定はスクロールせず、小型画面では数字・余白と文字倍率を調整してSafe Area内へ固定表示し、枠の下へ`× CLOSE`を置く。開始／再開、時間の増減、保存エラーと再試行は設定Modalが担当する。

## 原本と描画の変更

メニューはBGM・タスク・ユーザー名・デフォルト時間・通知設定の各カードで`shape="rectangle"`を使い、上32・左右20・下20の本文余白を取る。2026-10-23の追加指示により、銀色と白の色・透明度を保ったまま、インデックスや斜角のない長方形とする。通知時刻とデフォルト時間はタイトルと同じ行の右端に表示する。タスク名・ユーザー名は暗い背景の単一行入力欄をカード内に配置し、直接タップで編集する。名前用のModal・編集ボタンは使わない。通知・デフォルト時間は右端の時間を直接タップして標準ピッカーで選択・自動保存する。操作と未検証項目は[メニュー設定の手順](manual-acceptance-checklist.md#menu-folder-settings)を参照する。

元SVGはデザイン原本として残し、共通部品の座標・色・透過率・グラデーションの基準にする。実行時にSVGファイルを読み込んで部分変形する方式ではなく、原本は現在のバンドルへ同梱しない。原本のインデックス形状・角・色を変更した場合は、共通部品の対応する定数・描画も揃える。新しい画面で同じ枠を使うだけなら、原本や共通部品の変更は不要。

共通部品は1つの連続した輪郭を使い、インデックスと本体の境界へ分割線や半透明の重なりを作らない。元SVGに含まれる`foreignObject`のCSS背景ぼかしは描画しない。半透明の塗りとグラデーションで表現し、ログの発光は利用側の影で指定する。日付は枠の上、日付矢印は枠の下の閉じる操作の左右へ配置し、枠の幅を日付矢印の領域で狭めない。

SDKの参照先は[Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/)と[`react-native-svg`](https://docs.expo.dev/versions/v57.0.0/sdk/svg/)。既存依存の15.15.4を使い、SVG変換用の新規依存は追加しない。

iPhoneでの縦長・横長の見え方、影・グラデーション・本文・キーボードと操作は[共通枠の確認手順](manual-acceptance-checklist.md#file-textbox-resizing)、時間の増減・開始／再開・閉じるは[集中時間設定Modalの確認手順](manual-acceptance-checklist.md#timer-setup-file-modal)を参照する。

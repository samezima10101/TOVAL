# フォント設定

更新日: 2026-10-18（日本時間）。対象はFigma「UI-v3」のフォント反映。

## 書体と用途

参照: [UI-v3](https://www.figma.com/design/omePA4nHN8O6RyGVg4sh7M/MyJune?node-id=329-204)、[使用フォント見本](https://www.figma.com/design/omePA4nHN8O6RyGVg4sh7M/MyJune?node-id=329-887)。見本内部の見出しは「UI-v4」だが、ユーザー指定のUI-v3セクションに置かれているものを参照した。

| 定義 | 書体・ウェイト | 用途 |
| --- | --- | --- |
| `Fonts.regular` | Zen Kaku Gothic New Regular | 本文、補助説明、入力欄、曜日など |
| `Fonts.medium` | Zen Kaku Gothic New Medium | NT表示、会話本文、会話一覧のタイトルなど |
| `Fonts.bold` | Zen Kaku Gothic New Bold | ボタン、見出し、話者名など |
| `Fonts.black` | Zen Kaku Gothic New Black | デザインでBlackを使う部品向けの共通定義。現行の画面では未使用 |
| `Fonts.timer` | Bebas Neue Regular | タイマーの残り時間・延長時間 |
| `Fonts.pixel` | DotGothic16 Regular | ホームのタスク名・当日状態・解放案内、ログの日付・開始時刻・集中時間・日記 |

[共通定義](../src/constants/typography.ts)を[テーマ](../src/constants/theme.ts)から再公開する。各画面・UI部品の`fontFamily`で指定する。ウェイトごとに別ファイルを登録しているため、同時に`fontWeight`で太さを指定しない。カレンダー内部の月・曜日はライブラリの既定ウェイトを`normal`へ戻し、指定したフォントファイルを使う。

今回の対象は書体・ウェイトと読み込み処理。文字サイズ、余白、色、背景、画像、ボタン形状、ツールバー、設定画面などのデザイン反映は別工程。現行に対応する表示がないデザイン上の文字は、その画面の実装時に扱う。

## 読み込み

[AppFontLoader](../src/components/common/AppFontLoader.tsx)が`expo-font`の`useFonts`で6ファイルを読み込み、完了後に共有状態と画面をマウントする。ファイルはすべて`assets/fonts/`内に同梱し、製品アプリでの起動時に外部フォント配信サービスへ接続しない。Expo Goでも同じ読み込み経路を使える構成とした。[Expo SDK 57のフォント読み込み資料](https://docs.expo.dev/versions/v57.0.0/sdk/font/#usage)を参照。

読み込み中はスプラッシュを維持する。失敗した場合はスプラッシュを閉じ、端末標準フォントでエラーと再試行ボタンを表示する。再試行は読み込みコンポーネントを再マウントして行う。端末標準のアラート・キーボードや、同梱フォントに含まれない絵文字等には端末側の表示が使われる。

## 配布元とライセンス

2026-10-18にGoogle Fonts公式リポジトリから静的TTFを取得した。改変・サブセット化は行っていない。追加のnpm依存はない。

| 配布元 | 同梱ファイル | ライセンス |
| --- | --- | --- |
| [Zen Kaku Gothic New](https://github.com/google/fonts/tree/main/ofl/zenkakugothicnew) | Regular / Medium / Bold / Blackの4ファイル | [OFL](../assets/fonts/zenkakugothicnew-OFL.txt) |
| [Bebas Neue](https://github.com/google/fonts/tree/main/ofl/bebasneue) | Regular | [OFL](../assets/fonts/bebasneue-OFL.txt) |
| [DotGothic16](https://github.com/google/fonts/tree/main/ofl/dotgothic16) | Regular | [OFL](../assets/fonts/dotgothic16-OFL.txt) |

フォントを差し替える場合はファイルと登録名・利用箇所を揃え、対応するライセンスを維持する。保存形式や会話・購入IDの変更は不要。

検証結果は[フォント検証記録](verification/fonts-2026-10-18.md)、iPhoneでの手順は[手動チェックリスト](manual-acceptance-checklist.md#font-completion)を参照する。


## メニューの書体統一（2026-10-23）

メニュー上のタスク名・ユーザー名・デフォルト時間・通知時刻はZen Kaku Gothic New Medium／18に揃える。カード見出しは同Bold／19、本文・補助説明は同Regularとし、用途ごとの階層を保つ。時間は両方ともアプリ側のTextで描画し、タップするとiPhone標準ホイールを下から表示する。標準ホイール内はOSの書体を使用する。通知は端末の12／24時間設定・1分刻み、デフォルトは24時間形式・5分刻みとし、自動保存を維持する。iPhoneの表示・文字拡大・操作は未検証。


## メニュー共通スタイルの管理（2026-10-24）

最新のユーザー指示により、`app/(tabs)/menu.tsx`がカードの背景・余白・見出し・値・説明・編集ボタン・保存状態・エラーと、画面内のBGM／時間設定の表示を管理する。BGMと時間設定は同ファイル内のローカルコンポーネントへ移し、共通のstylesを直接参照する。タスク名・ユーザー名は共通の直接入力を使い、入力欄の文字と暗い背景もmenu.tsxで定義する。不要な名前編集モーダルは削除した。スタイルのprops受け渡しは行わず、itemStylesと専用型ファイルを廃止した。共通KeyboardEditorの入力欄・操作バー・キーボード余白処理とiPhone標準ホイールは継続利用する。

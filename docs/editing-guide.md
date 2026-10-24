# コンテンツ・音・表示の編集ガイド

日常的に変更する場所と、共通部品を使う際の制約をまとめる。完成条件は[完成基準](completion-criteria.md)、操作確認と実施結果は[手動チェックリスト](manual-acceptance-checklist.md)、保存・移行は[データ仕様](data-integrations.md)、コマンドは[開発運用手順](development-operations.md)を参照する。

## 会話本文・価格・入荷条件

| 編集対象 | ファイル |
| --- | --- |
| メイン14話のタイトル・本文・2分岐 | [src/content/stories/](../src/content/stories/)の`episode01.ts`〜`episode14.ts` |
| 各話の取りまとめ・本文と分岐の参照 | [storyData.ts](../src/domain/storyData.ts) |
| サイド101〜103と店員の挨拶・入荷告知・退店本文 | [shop.ts](../src/content/shop.ts) |
| 追加分岐価格・サイド価格・入荷条件 | [conversationSettings.ts](../src/config/conversationSettings.ts) |
| ショップ／メモリーの章名・話の所属と順序 | [storyArchive.ts](../src/config/storyArchive.ts) |

メインは`title`、`commonBefore`、`routes`の`label`・`lines`、`commonAfter`を編集する。再生順は共通前半→選択分岐→共通後半。行には一意な`id`、`speaker`（`boss`=ジェム、`sub`=アルタ、`both`=両者）、`text`、左右の表情を指定し、本文の改行は`\n`を使う。`both`は両者の名前を表示する。立ち絵は話者によらず常に不透明で表示する。

第1話は[会話原稿](https://docs.google.com/spreadsheets/d/1-7rnog6vxtoi-MvNjKZ7Wyb1b6-GHhV-gZp8AWJgMWU/edit)のタブ`01`を反映している。共通前14行・分岐A4行／B5行・共通後12行。シートの`gem`／`alta`は`boss`／`sub`へ対応させ、行種別が空でも本文と話者がある行は取り込む。原稿の`[userName]`・`［userName］`は本文に保持し、`useStoryReader`の`userName`オプションで文字送り前に置換する。メイン画面は保存済みの名前を渡し、未指定時は「ゲスト」。シート側にタイトル指定はないため既存タイトルを維持している。

表情は`left`にジェム、`right`にアルタの名前を指定する。画像の対応は[StoryCharacters.tsx](../src/components/story/StoryCharacters.tsx)の`faceAssets`、利用可能な名前は[GemExpression／AltaExpression](../src/domain/common/types.ts)で管理する。

| キャラクター | 表情名と画像（各範囲は番号順） |
| --- | --- |
| ジェム | `normal1〜4` → `gem/G01-1〜4.png`、`surprised1〜4` → `G02-1〜4.png`、`doubt3〜4` → `G03-3〜4.png`、`beam1〜2` → `G04-1〜2.png`、`nervous1〜4` → `G05-1〜4.png` |
| アルタ | `normal1〜4` → `alta/A01-1〜4.png`、`grumpy1〜4` → `A02-1〜4.png`、`grin1〜4` → `A03-1〜4.png`、`sparkle1〜2` → `A04-1〜2.png`、`smirk3〜4` → `A05-3〜4.png` |

画像は`assets/faces/`以下。既存の`normal`・`talk`・`doubt`は互換用に従来の画像を維持する。例: `left: "surprised1", right: "sparkle1"`。

- 話ID1〜14、サイドID101〜103、分岐IDは保存済み権利の識別子なので維持する。第1話は`episode-01-encourage`／`episode-01-bow`、第2〜14話は`episode-NN-route-a`／`episode-NN-route-b`。削除・改名には別途移行設計が必要。
- 価格は0以上の安全な整数NT。メインは話ごとの`additionalRoutePriceNt`、サイドは`priceNt`を変更する。0 NTでも確認後に解放する。
- 各話の初回分岐選択はA/Bどちらも無料、未選択のもう一方だけが購入対象。選択地点より前に閉じた場合は未選択のまま。
- `requiredUnlockedEpisodeId`は`null`（条件なし）または実在するメイン話ID。`unlockedStories`に含まれれば満たし、読了は不要。
- 現行初期値は全価格60 NT、101は条件なし、102/103は第2話解放。これらを固定の完成条件にしない。
- 本文・価格の変更で既購入の権利をリセット・再課金しない。購入済みサイドは条件変更後も表示・再生し、告知済みIDも維持する。
- 表示価格・残高判定・消費額、一覧の入荷表示・購入可否はそれぞれ共通判定を使う。通常の設定変更では`conversation.ts`・`sideStory.ts`や保存処理を変更しない。

設定変更は開発アプリをReloadして反映する。配布アプリには更新ビルドが必要で、アプリ内管理画面やクラウド管理はない。保存キー・schemaVersion・旧形式の扱いは[データ仕様](data-integrations.md)に集約する。

## 章一覧と会話画面

`MEMORY_CHAPTERS`・`SHOP_CHAPTERS`の`title`・`storyIds`を変更する。既存IDをいずれか1章へ重複なく配置し、保存IDは変えない。現行は全会話を各Chapter 1へまとめ、空のChapter 2〜8は準備中。ショップで表示できる会話が0件の章は未入荷とする。

[StoryArchive](../src/components/common/StoryArchive.tsx)が4列の章番号・固定タイトル帯・左のホイール一覧・右の詳細と操作を共有する。画面全体は固定し、一覧と詳細文だけをスクロールする。選択が変わると帯の文字・詳細・操作対象を更新し、章変更時は最初の話へ戻す。購入中は選択を固定する。章内番号は表示順であり、解放・購入には元のIDを使う。

詳細紹介は共通前半の最初の台詞を使い、未解放メインのタイトル・本文は隠す。`ROUTE UNLOCK`は分岐権利数、`OPEN`は既存の解放日。既読数として扱わない。

章番号は[StoryNumber](../src/components/common/StoryNumber.tsx)が[assets/numbers/](../assets/numbers/)の字形と番号を対応させる。提供ファイル名と字形に不一致があるため、ファイル名だけで割り当て直さない。現在は01〜14に対応し、章数を増やす際は素材も追加する。

| 会話UI | 責務 |
| --- | --- |
| [StoryScene](../src/components/story/StoryScene.tsx) | ヘッダー・閉じる・エラー・任意のキャラクター領域と固定会話枠を1回だけ配置 |
| [StoryMessageBox](../src/components/story/StoryMessageBox.tsx) | 枠の位置・寸法・背景・余白・枠内スクロール。`children`と`contentKey`を受け取る |
| 同ファイルの`StoryMessage` | 話者・本文・文字送り・タップ操作。枠は作らない |
| [StoryCharacters](../src/components/story/StoryCharacters.tsx) | 画像・表情（話者による透明化なし） |
| [StoryChoices](../src/components/story/StoryChoices.tsx)／[StoryUnlockConfirmation](../src/components/story/StoryUnlockConfirmation.tsx) | メイン固有の選択肢・解放確認の中身 |

権利判定・購入・保存・退出ガード・再生フック・戻り先・背景は[story.tsx](../app/story.tsx)／[side-story.tsx](../app/side-story.tsx)が持つ。共通UIへ移さない。ショップ挨拶・退店は共通ヘッダーを使わず、同じ枠と本文表示を組み合わせる。`StoryDialogue`や引数の形を判別する別APIは作らない。

メイン会話はStorySceneの上部にstory-bg.pngを縦横比を保ったcoverで中央配置し、左右を切り取る立ち絵映像、下部に会話枠を配置する。LIVE・白いコーナー・DAY番号・解放日を重ね、立ち絵は常に不透明。映像枠は左右16のmarginを入れ、残りの幅÷1.38と表示領域高の52%の小さい方の高さを使う。背景画像の元の16:9へ枠を合わせず、枠に合わせて中央からトリミングする。下部を覆う机の色面は置かない。下部は左右22・上12・下28の余白内でStoryMessageBoxのinFlowを使い、高さ190（狭い画面では縮小可）で上端を固定し、白い話者名・本文・右下の▼を表示する。長文・選択肢は枠内スクロール。通常のサイド／ショップ枠はstyles.frameの左右18・下60・高さ210。contentKeyは台詞・選択肢・確認内容が変わった時だけ更新し、文字送り中には変えない。

## BGM・タブ効果音

[audioSettings.ts](../src/config/audioSettings.ts)で音源・画面割当・初期音量を管理する。

| 設定 | 現行値 |
| --- | --- |
| `DEFAULT_BGM_VOLUME` | `0.3`（初期30%） |
| `DEFAULT_SE_VOLUME` | `1`（初期100%） |
| `BGM_TRACKS.default` | `assets/audio/timer-bgm.mp3` |
| `BGM_TRACKS.non` | `source: null`（一時停止） |
| `TAB_PRESS_SOUND` | `assets/audio/tabs.mp3` |
| `SCREEN_BGM` | `/`・`/memory`・`/timer`・`/story`・`/log`・`/menu`は`default`、`/shop`・`/side-story`は`non` |

音源を追加する場合は利用権を確認して`assets/audio/`に配置し、`BGM_TRACKS`へ静的な`require`で登録して`SCREEN_BGM`を変更する。同一音源は1登録を共用し、動的パスの`require`や無音ファイルは使わない。未登録ルートは無音。Modal・クエリ・会話の進行行は曲の判定に使わない。同梱音源の更新には配布ビルドが必要。

[AppShell](../app/_layout.tsx)の[useScreenBgm](../src/hooks/useScreenBgm.ts)だけで共通BGMプレイヤーを持つ。同じ曲はreplace/seekせず継続し、別曲へ切り替える。`non`や音量0は一時停止し、曲のある画面・0より大きい音量へ戻れば続きから再開する。非同期の古い再生要求は画面変更・背景移動時に破棄する。

[AudioSettings](../src/components/menu/AudioSettings.tsx)内の`VolumeSetting`を両音量で共有する。標準スライダーは0〜100%・1%刻み。操作中は即時プレビュー、指を離すと保存し、VoiceOverなど非ドラッグ操作は変更時に保存する。保存中の追加操作を抑止し、失敗時は対象だけを保存済み値へ戻して同じ希望値で再試行する。プレビューは永続化せず、音量の変更だけでBGMをreplace/seek・音声モード再初期化しない。

`bgmVolume`・`seVolume`は独立した0〜1の有限数で、共通の`isValidAudioVolume`で検証する。初期値の変更は保存済み音量の上書きには使わない。保存API・プレビューは[AppStateProvider](../src/state/AppStateProvider.tsx)、移行は[データ仕様](data-integrations.md)を参照する。

[タブレイアウト](<../app/(tabs)/_layout.tsx>)の`tabPress`から[useTabSound](../src/hooks/useTabSound.ts)を呼ぶ。4タブの選択中再タップでも1回鳴らし、プログラム遷移では鳴らさない。単一SEプレイヤーで連打時は先頭から再生し、ループ・押下ごとのプレイヤー追加をしない。SEでBGMの音源・音量・位置を変えず、非アクティブ時・タブを離れる時は停止して保留要求を破棄する。

[audioSession.ts](../src/audio/audioSession.ts)をBGMとSEで共有し、`playsInSilentMode=false`・`shouldPlayInBackground=false`とする。非アクティブ・ロック・他アプリ利用中は停止し、復帰時は現在の設定を再確認する。黒画面ModalだけではBGMを止めず、タイマーの計測条件には接続しない。BGMエラーと再試行表示は[AppFrame](../src/components/common/AppFrame.tsx)が担当する。

[app.json](../app.json)のexpo-audio設定は`microphonePermission`・`recordAudioAndroid`・`enableBackgroundPlayback`・`enableBackgroundRecording`をfalseにする。ネイティブ設定・依存変更の反映には再ビルドが必要。Expo Go・JS Reload・設定生成の確認だけで製品バイナリの確認を済ませない。

## フォントとメニューの共通スタイル

[theme.ts](../src/constants/theme.ts)の`Fonts`と`FONT_ASSETS`を編集する。現在の登録は以下の5ファイルで、ローカル同梱により外部配信へ依存しない。

| 定義 | 書体 | 用途 |
| --- | --- | --- |
| `regular` | Zen Kaku Gothic New Regular | 本文・補助説明・入力欄 |
| `medium` | 同Medium | NT・会話本文・一覧タイトル・設定値 |
| `bold` | 同Bold | ボタン・見出し・話者名 |
| `timer` | Bebas Neue Regular | 残り時間・延長時間 |
| `pixel` | DotGothic16 Regular | ホームのタスク・状態・解放案内、ログの日時・集中時間・日記 |

各ウェイトのファイルを`fontFamily`で指定し、同時に`fontWeight`を指定しない。カレンダー内部の既定ウェイトは`normal`へ戻す。[AppFontLoader](../src/components/common/AppFontLoader.tsx)は`useFonts`完了までスプラッシュを維持し、失敗時は端末標準フォントで再試行を表示する。OSのアラート・キーボード・絵文字は端末側の表示になる。

差し替え時はファイル・登録名・利用箇所を揃え、[Zen Kaku Gothic NewのOFL](../assets/fonts/zenkakugothicnew-OFL.txt)・[Bebas NeueのOFL](../assets/fonts/bebasneue-OFL.txt)・[DotGothic16のOFL](../assets/fonts/dotgothic16-OFL.txt)を維持する。配布元は各Google Fonts公式リポジトリ（[Zen](https://github.com/google/fonts/tree/main/ofl/zenkakugothicnew)／[Bebas](https://github.com/google/fonts/tree/main/ofl/bebasneue)／[Dot](https://github.com/google/fonts/tree/main/ofl/dotgothic16)）。

[menu.tsx](<../app/(tabs)/menu.tsx>)は画面配置・キーボード余白・入力表示スクロールを担当し、設定本体を以下へ分ける。

| ファイル | 担当 |
| --- | --- |
| [AudioSettings](../src/components/menu/AudioSettings.tsx) | BGM・効果音 |
| [UserSettings](../src/components/menu/UserSettings.tsx) | タスク名・ユーザー名、下書き・検証・保存・入力参照 |
| [DefaultTimerSettings](../src/components/menu/DefaultTimerSettings.tsx) | デフォルト集中時間 |
| [NotificationSettings](../src/components/menu/NotificationSettings.tsx) | 通知時刻・許可状態・再試行 |
| [NativeTimeSetting](../src/components/menu/NativeTimeSetting.tsx) | 標準ホイール・自動保存・再試行 |

[SettingsLayout](../src/components/menu/SettingsLayout.tsx)の`SettingsCard`・`SettingsRow`・`SettingsTitle`を共有する。全カードと時間選択Modalの見出しは`styles.sectionTitle`で色・書体・サイズを管理する（現行Bold／18）。個別見出しで同じ指定を重ねない。横並び行だけ1行・縮小・倍率制限を付け、ユーザー情報の見出しには付けない。値・入力・補助説明は各設定内で管理する。

名前はカード内を直接タップして単一行編集し、名前用Modalは使わない。時間は右端をタップしてiPhone標準ホイールを下から表示する。デフォルト時間はUTC・24時間形式・5分刻み、通知時刻は端末の12／24時間設定・1分刻み。保存中の選択変更は最新値へまとめて直列保存し、失敗時は未保存値を保って再試行・元に戻す操作を提供する。時間選択には✕／OKバーを使わない。

## 共通のテキスト枠・画面素材

[FileTextboxBackground](../src/components/common/FileTextboxBackground.tsx)は[原本SVG](../assets/images/file_textbox.svg)に基づく背景だけを描く。既定の`shape="folder"`はログ・会話・[TimerSetupModal](../src/components/home/TimerSetupModal.tsx)、`shape="rectangle"`はメニューカードで使う。

- 親が位置・幅・高さ・本文余白を決め、背景を先に置いてから本文・操作を重ねる。背景自体は絶対配置・タップ対象外。寸法は親に指定し、背景の`style`は影などの装飾に使う。
- 通常枠（幅120以上・高さ56以上）はインデックス幅93・高さ19、右の斜角・線幅を固定して右辺・下辺だけを動かす。小さい枠は装飾を同率で縮小する。元SVGを`fill`で引き延ばして代用しない。
- フォルダ型の本文余白の目安は上28以上・左右20以上・下18以上。メニューは`SettingsCard`側で管理する（現行は左右25・上下20）。長文のスクロールは利用側に置く。
- 長方形はインデックス・斜角なし。両形状とも銀色と白のグラデーション、塗り0.38・白輪郭0.49を共用し、フォルダは連続した輪郭で重なりや分割線を作らない。
- 原本はデザイン基準として保持し、実行時には直接読み込まない。形状・色を変える際は共通部品も揃える。原本のCSS背景ぼかしは再現せず、影は利用側で指定する。

背景は各画面の[ScreenBackground](../src/components/common/ScreenBackground.tsx)の`source`で選ぶ。現行はホームが`cockpit-bg.png`、メモリー・ログ・メニューが`starry-bg.png`、タイマー・メインが`primary-bg.png`、ショップ・サイドが`shop-bg.png`。画面全高・中央・比率維持のcoverを共用し、背景用Contextや登録フックは作らない。

共通ヘッダー・ロゴフッター・エラー表示は`AppFrame`が持ち、画像の選択やキャラクター分岐は持たない。ヘッダー76・タブバー60などの寸法は使用箇所に置き、`theme.ts`へ移さない。タブ画面の下余白は`useBottomTabBarHeight`を使い、スクロール内容内に上下余白を確保してバーの背後を通す。Safe Areaは維持し、OSステータスバーはルートとconfig pluginで非表示にする。

ホームの[モニター配置](<../app/(tabs)/index.tsx>)と[monitor_frame.svg](../assets/images/monitor_frame.svg)は360×270（4:3）を維持し、contain・両軸同率で拡縮する。固定画面内で文字・再開操作を収め、集中開始はモニター外、ショップ入口はタブバーより上の右下へ置く。省略文字も読み上げでは全文を渡す。

[PrimaryButton](../src/components/common/PrimaryButton.tsx)は[hex_button.svg](../assets/images/hex_button.svg)を共用し、標準幅222・最小高さ65。長いラベルは折り返し、無効・処理中の操作抑止と読み上げを維持する。ショップの`they.png`は[shop.tsx](../app/shop.tsx)で挨拶・退店時だけ画面全体へcover表示し、一覧・サイドには表示しない。

## キーボード編集と文字数上限

[KeyboardEditor](../src/components/common/KeyboardEditor.tsx)は入力・操作バー・キーボード余白を共有し、下書き・検証・保存・キャンセルの意味は利用側に残す。

- `useKeyboardEditor()`の`toolbarBottom`を操作バーへ、`contentBottomInset`を編集中の表示領域へ適用する。画面内編集では実測した`bottomOffset`・`minBottom`を渡し、メニューはキーボード非表示時もタブバー上にバーを残す。全画面Modalは引数省略で使える。
- `KeyboardEditorInput`には高さまたは制約付きの`flex: 1`領域を与える。単一行は`multiline={false}`。`autoGrow`は同じ書体・幅・余白の非表示Textで計測し、最小46から`maxInputHeight`まで増やして、以後は入力欄内部をスクロールする。計測用の末尾ゼロ幅文字は保存しない。
- ログの高さ上限は実際の表示高から決め、標準3行分94を下限とする。カーソル追従はネイティブ入力に任せ、日本語変換中の選択位置を上書きしない。
- `KeyboardEditorToolbar`へ`bottom`・`busy`・`saveDisabled`・保存／キャンセル処理と読み上げ名を渡す。保存側でも二重実行を防ぐ。ログの文字数表示はバー中央、保存エラーは対象入力欄の下に置く。

[useInputReveal](../src/hooks/useInputReveal.ts)へ`scrollRef`と安定した`useCallback`の`getInput`を渡し、`onScroll`を外側ScrollViewへ接続する。`revealInput`をフォーカス・レイアウト・内容高変更時に呼ぶ。入力と表示領域を`measureInWindow`の同じ座標で測り、隠れた分だけ動かす。キーボード表示後も再計測し、古い要求・入力対象変更・フォーカス解除後の結果を破棄する。

余白は`topInset`・`bottomInset`（既定各8）、計測を次フレームへ送る場合は`deferToAnimationFrame`。メニューは上`top + 76 + 8`・即時計測、[LogModal](../src/components/log/LogModal.tsx)は上下8・次フレーム計測を使う。フォルダ内では画面全体を前提にする`scrollResponderScrollNativeHandleToKeyboard`を使わない。

`maxLength`は必須で、入力とカウンタは`String.length`（UTF-16コード単位）に揃える。

| 項目 | 上限・定義 |
| --- | --- |
| タスク名（初回登録・メニュー） | 80、[MAX_TASK_NAME_LENGTH](../src/domain/common/types.ts) |
| ユーザー名 | 40、[MAX_USER_NAME_LENGTH](../src/domain/reminder.ts) |
| 日記（完了時・ログ） | 1000、[MAX_DIARY_LENGTH](../src/domain/common/types.ts) |

前後空白も入力上限に含み、保存時にtrimする。絵文字の見た目の数とは異なる。ユーザー名保存APIの互換検証はtrim後40 Unicodeコードポイントを維持する。

上限超過の旧値は切り詰めず、ネイティブへ`Math.max(maxLength, 現在値.length)`を渡して削除可能にする。設定上限を超える間はOK無効・キーボード完了などの保存入口も無言で停止し、文字数超過アラートは出さない。空白だけの必須入力と保存失敗のエラーは維持する。キャンセル・他項目の保存で旧値を変更しない。

ユーザー情報は項目ごとに下書きを保持し、非編集中の未保存項目に「未保存」を表示する。親が同じ編集状態を`UserSettings`とScrollView外の`UserSettingsToolbar`へ渡し、✕／OKは選択中項目だけへ作用する。ログは選んだ日記本文だけを編集し、他のメモや開始時刻・集中時間を保持する。保存失敗では下書きを保持して再フォーカスし、成功・キャンセルでキーボードを閉じる。

## 編集後の確認

[開発運用手順](development-operations.md)の静的診断とiOSバンドル生成、変更に対応する[手動チェックリスト](manual-acceptance-checklist.md)を実施する。価格・条件の試験値は意図した製品値へ戻してReloadする。PCの診断や過去の確認結果を、変更後のiPhone表示・操作・聴音の合格へ流用しない。未実施項目は未検証として残す。

# コンテンツ・音・表示の編集ガイド

日常的に変更する場所と、共通部品を使う際の制約をまとめる。完成条件は[完成基準](completion-criteria.md)、操作確認と実施結果は[手動チェックリスト](manual-acceptance-checklist.md)、保存形式は[データ仕様](data-integrations.md)、コマンドは[開発運用手順](development-operations.md)を参照する。

## 会話本文・価格・入荷条件

| 編集対象 | ファイル |
| --- | --- |
| メイン14話のタイトル・本文・分岐・単独回の解放条件 | [src/content/stories/](../src/content/stories/)の`episode01.ts`〜`episode14.ts` |
| 各話の取りまとめ・本文と分岐の参照 | [storyData.ts](../src/domain/storyData.ts) |
| サイド101〜103と店員の挨拶・入荷告知・退店本文 | [shop.ts](../src/content/shop.ts) |
| 追加分岐価格・サイド価格・入荷条件 | [conversationSettings.ts](../src/config/conversationSettings.ts) |
| ショップ／メモリーの章名・話の所属と順序 | [storyArchive.ts](../src/config/storyArchive.ts) |
| 第0話の本文・表情・入力位置 | [episode00.ts](../src/content/stories/episode00.ts) |
| 初回会話の分割・名前／タスク入力 | [episode00.ts](../src/content/stories/episode00.ts)・[IntroInput.tsx](../src/tutorial/IntroInput.tsx) |
| 操作練習の台詞・強調対象・進行条件 | [steps.ts](../src/tutorial/steps.ts)・[TutorialOverlay.tsx](../src/tutorial/TutorialOverlay.tsx) |

メインは`title`、`commonBefore`、`routes`の`label`・`lines`、`commonAfter`を編集する。再生順は共通前半→選択分岐→共通後半。行には一意な`id`、`speaker`（`boss`=ジェム、`sub`=アルタ、`both`=両者）、`text`、左右の表情を指定し、本文の改行は`\n`を使う。`both`は両者の名前を表示する。none以外の立ち絵は話者によらず不透明で表示する。

第1話は[会話原稿](https://docs.google.com/spreadsheets/d/1-7rnog6vxtoi-MvNjKZ7Wyb1b6-GHhV-gZp8AWJgMWU/edit)のタブ`01`を反映している。共通前14行・分岐A4行／B5行・共通後12行。シートの`gem`／`alta`は`boss`／`sub`へ対応させ、行種別が空でも本文と話者がある行は取り込む。原稿の`[userName]`・`［userName］`は本文に保持し、`useStoryReader`の`userName`オプションで文字送り前に置換する。メイン画面は保存済みの名前を渡し、未指定時は「ゲスト」。シート側にタイトル指定はないため既存タイトルを維持している。

第2話は同じ原稿のタブ`02`を反映し、共通前31行・分岐A6行／B5行・共通後7行。行種別が空でも本文と話者がある行を含め、表情の空欄は直前の値を引き継ぐ。既存タイトル・話ID・分岐IDを維持する。`system`話者は「システム」と表示する。

第4話は同じ原稿のタブ`04`を反映し、共通前25行・分岐A5行／B6行・共通後15行。行種別が空でも本文と話者がある5行を含め、本文・選択肢・左右表情・名前差込を保持する。シートにタイトル指定はないため、既存タイトル・話ID・分岐IDを維持する。

第5話は同じ原稿のタブ`05`を反映し、共通前37行・分岐A「かわいい！」6行／B「かっこいい！」7行・共通後4行。行種別が空の台詞も含め、本文・左右表情・名前差込・both話者を保持する。28行目の話者空欄（「え、我々は『かっこいい』枠でしょ？」の台詞）は前後の文脈からジェムへ補完する。シートにタイトル指定はないため、既存タイトル・話ID・分岐IDを維持する。

第6話は同じ原稿のタブ`06`を反映したアルタ単独回。共通前16行、質問1「どうして答えられないの？」13行、質問2「エトって誰？」26行、質問3「ジェムの外見について知りたい」25行→「謝った？」4行→「何もしない」7行で、共通後はない。行種別が空の3台詞も含め、全91台詞の左表情は`none`、右表情は原稿どおり。タイトル指定がないため既存タイトルと話ID・分岐A/Bの権利IDを維持し、3問目は`episode-06-route-c`を追加する。

単独回は`soloCharacter: "alta"`または`"gem"`を指定し、登場しない側の表情は本文で`none`にする。メモリーのタイトル選択帯と詳細説明パネルの背景色は[theme.ts](../src/constants/theme.ts)の`SoloStoryColors`を参照する。現在は淡い青緑。再生中の会話枠は通常色を使い、その上に単独回のタイトルは追加しない。質問数は`routes`の配列長で変えられる。ルート内の追加選択は`choices`へ再帰的に指定し、選択後はその`lines`へ進む。追加選択は同じルート権利に含み、別課金・進行位置保存はしない。

質問の`requirement`は原稿と同じファイルで編集する。`anyEpisodeRouteCount`は指定した`episodeIds`のどれか1話で`count`以上のルート権利を持つ条件、`allEpisodeRoutes`は指定話すべてのルート権利を持つ条件。`description`は未達時に表示する説明。第6話の質問2は第1〜6話のどれかで2ルート以上、質問3は第1〜5話の全ルートを要求する。条件を満たしても追加分岐の購入は必要。初回は条件達成済みの質問から1つ無料で選べる。取得済み権利は条件変更後も利用でき、質問の表示と保存APIが同じ判定を使う。全質問・追加選択の本文確認は、テスト領域の第6話を選択肢3個へ設定してメモリーから行う。

表情は`left`にジェム、`right`にアルタの名前を指定する。`none`は指定側の画像を描画せず、もう一方の位置を維持する。画像の対応は[StoryCharacters.tsx](../src/components/story/StoryCharacters.tsx)の`faceAssets`、利用可能な名前は[GemExpression／AltaExpression](../src/domain/common/types.ts)で管理する。

演出は台詞の`effect`で指定する。`effect: { type: "shout", target: "alta" }`はアルタのみ、target: "gem"はジェムのみを、台詞へ切り替わったとき上下3ポイント・25ms刻み8区間（計200ms）震わせて元の位置へ戻す。背景・もう一人・スライド・モニター装飾・会話枠は固定。文字サイズとスクロールは通常どおり。台詞の切替・画面終了時は停止し位置を戻す。第2話の最後（episode-02-after-6）はアルタを指定。調整箇所はStoryCharactersのshake。

行の`slide`は`slide1〜4`を指定でき、[StoryScene.tsx](../src/components/story/StoryScene.tsx)で`assets/slides/ep02-1〜4.png`へ静的に対応する。1400×950の素材を、下端クロップ後の映像枠全体へ比率維持のcontain・中央配置で表示する。スライドはクロップせず、上下端を含む全体を枠内に収める。`slideBackground: true`の行は、`assets/slides/slide_background.png`を表示枠全体へcoverで描き、キャラクターとスライドの間に表示する。第2話ではepisode-02-before-11〜17だけに指定し、10以前と18以降では表示しない。第2話のスライド表示中は、ジェムの台詞でleft: normal2／right: normal1、アルタの台詞でleft: normal1／right: normal2を指定する。指定のない行ではスライドを消して通常表示へ戻る。通常のストーリー再生で使用する。

| キャラクター | 表情名と画像（各範囲は番号順） |
| --- | --- |
| ジェム | `normal1〜4` → `gem/G01-1〜4.png`、`surprised1〜4` → `G02-1〜4.png`、`doubt1〜6` → `G03-1〜6.png`、`beam1〜2` → `G04-1〜2.png`、`nervous1〜4` → `G05-1〜4.png`、`shocked1〜4` → `G08-1〜4.png`、`glare2` → `G09-2.png` |
| アルタ | `normal1〜4` → `alta/A01-1〜4.png`、`grumpy1〜4` → `A02-1〜4.png`、`grin1〜4` → `A03-1〜4.png`、`sparkle1〜2` → `A04-1〜2.png`、`smirk3〜4` → `A05-3〜4.png`、`nervous1〜4` → `A08-1〜4.png` |

画像は`assets/faces/`以下。既存の`normal`・`talk`・`doubt`は互換用に従来の画像を維持する。例: `left: "surprised1", right: "sparkle1"`。

- 話ID1〜14、サイドID101〜103、分岐IDは保存済み権利の識別子なので維持する。第1話は`episode-01-encourage`／`episode-01-bow`、第2〜14話は`episode-NN-route-a`／`episode-NN-route-b`。削除・改名時は、そのIDの保存済み権利を持つ利用者がいるか確認し、必要な場合に移行を設計する。
- 価格は0以上の安全な整数NT。メインは話ごとの`additionalRoutePriceNt`、サイドは`priceNt`を変更する。0 NTでも確認後に解放する。
- 各話の初回分岐選択はA/Bどちらも無料、未選択のもう一方だけが購入対象。選択地点より前に閉じた場合は未選択のまま。
- `requiredUnlockedEpisodeId`は`null`（条件なし）または実在するメイン話ID。`unlockedStories`に含まれれば満たし、読了は不要。
- 現行初期値は全価格60 NT、101は条件なし、102/103は第2話解放。これらを固定の完成条件にしない。
- 本文・価格の変更で既購入の権利をリセット・再課金しない。購入済みサイドは条件変更後も表示・再生し、告知済みIDも維持する。
- 表示価格・残高判定・消費額、一覧の入荷表示・購入可否はそれぞれ共通判定を使う。通常の設定変更では`conversation.ts`・`sideStory.ts`や保存処理を変更しない。

設定変更は開発アプリをReloadして反映する。配布アプリには更新ビルドが必要で、アプリ内管理画面やクラウド管理はない。保存キー・schemaVersion・未対応形式の扱いは[データ仕様](data-integrations.md)に集約する。

第3話は同じ原稿のタブ`03`を反映し、共通前29行・分岐A5行／B4行・共通後10行。行種別が空でも本文と話者がある行を含め、本文・選択肢・左右表情・`[userName]`を保持する。既存タイトル・話ID・分岐IDを維持する。追加表情はジェム`smile3` → `gem/G07-3.png`、アルタ`angry2` → `alta/A07-2.png`。

## 初回チュートリアル

専用ファイルは6件。`TutorialContext.ts`に画面接続の型・フック、`TutorialProvider.tsx`に進行・初回保存、`TutorialOverlay.tsx`に配置・操作、`TutorialEffects.tsx`に強調枠・アニメーション、`IntroInput.tsx`に初回入力、`steps.ts`に操作練習の台詞をまとめる。第0話の本文と分割は`src/content/stories/episode00.ts`、再実行の入口はメニュー画面で管理し、同内容を専用ファイルへ重複させない。

`TutorialEffects.tsx`の`CoachMark`は実操作を待つ対象（`interactive`）だけに青緑色`#BDF9F5`の2ポイント外枠を表示し、800msで不透明度100%→25%、800msで100%へ戻す。枠の内側は透明で、位置・大きさ・対象UIを動かさず、枠自体はタップを受け取らない。説明だけの段階は既存色の静止枠。段階終了・非表示・対象変更ではループを停止する。内部フック`useTutorialReducedMotion`をボックスの切り替えと共有し、「視差効果を減らす」が有効なら静止枠にする。

終了の確認は`TutorialProvider.tsx`の`close`に集約する。`skipped`は確認アラートを表示し、キャンセルでは保存・遷移せず、「スキップする」を選んだ後だけ終了処理へ進む。右端のボタン・入力ダイアログ・ストーリー／タイマーの戻る操作は同じ処理を使い、`completed`は確認なしで完了する。`TutorialOverlay`のスキップボタンは案内ボックスから分けて右上へ配置し、VoiceOverでも案内と一緒に操作できるようにする。

原稿タブ`00`の16台詞・2入力は`src/content/stories/episode00.ts`を唯一の本文として管理する。`INTRO_LINES`の`input`行を`episode00.ts`の`getIntroSegment`で区切り、初回は既存の`app/story.tsx`へ`source=tutorial`で渡す。その位置で`IntroInput.tsx`の入力ダイアログを重ね、終了後はタブ`tutorial`を基にした30段階の案内へ進む。`boss`／`sub`はメイン会話と同じ対応。

同じファイルの`episode00`は入力行を除いた見返し用の16台詞。メモリーのChapter 1・第0話から既存の表示部品で再生する。保存済みの名前を差し込み、再入力・操作練習・保存処理は起動しない。第0話は常時再生可能な`STORY_ARCHIVE_CATALOG`にだけ追加し、日次解放・保存検証に使う`STORY_CATALOG`は第1〜14話を維持する。

`steps.ts`の`scene`は案内中の既存画面／ダイアログ、`target`はコーチマークの対象、`action`は実操作を待つ条件。`action`がない段階はボックス内外のタップまたは「次へ」で進み、実操作の段階は強調対象だけで進む。「戻る」は前の段階へ移り、先頭では進行を変えない。`fullScreen: true`では画面を暗くせず全体を見せ、ボックスは画面下部へ置く。本文の高さ上限や内部スクロールを設けず、実測したボックスを対象の上か下へ配置し、フッターへの重なりを許す。

30段階のうち、新1はホームの紹介、新2は「はじめる」の操作。以降は旧番号+1となる。新7・8はタイマー全体、新18〜20は`nt`でヘッダーのNT枠、新24・25は振り返り画面全体、新27〜30はホーム全体を表示する。ホーム・タイマー・時間設定・省電力・日記を複製せず、それぞれに`TutorialOverlay`を重ねる。対象へ`useTutorialTarget`のrefを付け、PrimaryButtonでは`tutorialTarget`を指定する。

`TutorialProvider`は同じ`scene`内では段階だけを切り替え、時間設定・振り返りのModalを閉じ直さない。画面をまたぐ移動だけを`pendingIndex`へ保持し、現在のネイティブModalが閉じ終わってから画面を切り替える。強調対象も話番号でなく対象IDで保持し、同じ対象の説明中に強調枠やボックス位置を初期化しない。時間設定はホーム、タイマーと振り返りは`/timer`、終了説明はホームへ接続する。時間設定の開始段階へ戻った場合は5分で開き、それ以前の設定説明へ戻った場合は25分からやり直す。練習中の振り返り表示は段階から決め、前後の移動で本番の保存を呼ばない。残り時間・延長時間も一時状態の固定値を既存TimerDialへ渡す。

ボックス全体（枠・背景・本文・操作）の切り替えは`TutorialEffects.tsx`の`TutorialTransition`で140msのフェード（不透明度75%→100%）と4ポイントの移動を行う。ボックス自体を消さず、連続タップでは前のアニメーションを停止して最新の本文へ切り替える。iPhoneの「視差効果を減らす」が有効な場合はアニメーションを行わず、設定変更も反映する。

初回判定・進行・一時タイマー状態は`TutorialProvider.tsx`、案内とエラー表示は`TutorialOverlay.tsx`、メニューの入口は`app/(tabs)/menu.tsx`を編集する。練習中は内側のAppStateContextで開始／停止／終了操作を差し替え、本番のタイマー・報酬・保存を呼ばない。ネイティブModal内にも案内を置き、閉じ終わってから通常画面へ戻す。初回の入力保存と案内への連続遷移を検証する場合は、実利用とは別の検証端末・保存領域でチュートリアルキーがない状態を用意する。通常のメニュー再実行は操作練習から始まる。

ホームとメニューのタブ間移動は`router.navigate`を使う。`router.dismissTo`が送るPOP_TOはSDK 58のタブでは処理されないため、ストーリー・タイマーなどタブの外側のスタックから戻る場合だけに使う。タブ内かどうかは`useSegments()`の先頭が`(tabs)`かで判定する。`useRootNavigationState()`の最上位ルートはSDK内部の`__root`なので、直接`(tabs)`と比較しない。開始と終了の両方で同じ判定を使い、手動タブ押下を発生させない。

## 章一覧と会話画面

`MEMORY_CHAPTERS`・`SHOP_CHAPTERS`の`title`・`storyIds`を変更する。既存IDをいずれか1章へ重複なく配置し、保存IDは変えない。現行は全会話を各Chapter 1へまとめ、空のChapter 2〜8は準備中。ショップで表示できる会話が0件の章は未入荷とする。

[StoryArchive](../src/components/common/StoryArchive.tsx)が4列の章番号・固定タイトル帯・左のホイール一覧・右の詳細と操作を共有する。画面全体は固定し、一覧と詳細文だけをスクロールする。選択が変わると帯の文字・詳細・操作対象を更新し、章変更時は最初の話へ戻す。購入中は選択を固定する。メモリーの話番号は第0〜14話のID、ショップの章内番号は表示順を使い、解放・購入には元のIDを使う。

詳細紹介は共通前半の最初の台詞を使い、未解放メインのタイトル・本文は隠す。`ROUTE UNLOCK`は分岐権利数、`OPEN`は既存の解放日。既読数として扱わない。

章番号は[StoryNumber](../src/components/common/StoryNumber.tsx)が[assets/numbers/](../assets/numbers/)の字形と番号を対応させる。提供ファイル名と字形に不一致があるため、ファイル名だけで割り当て直さない。現在は01〜14に対応し、章数を増やす際は素材も追加する。

| 会話UI | 責務 |
| --- | --- |
| [StoryScene](../src/components/story/StoryScene.tsx) | ヘッダー・閉じる・エラー・任意のキャラクター領域と固定会話枠を1回だけ配置 |
| [StoryMessageBox](../src/components/story/StoryMessageBox.tsx) | 枠の位置・寸法・背景・余白・固定話者タグ・枠内スクロール。`children`・`contentKey`・`speaker`／任意の`speakerName`を受け取る |
| 同ファイルの`StoryMessage` | 本文・文字送り・タップ操作。枠・話者タグは作らない |
| [StoryCharacters](../src/components/story/StoryCharacters.tsx) | 画像・表情（話者による透明化なし） |
| [StoryChoices](../src/components/story/StoryChoices.tsx)／[StoryUnlockConfirmation](../src/components/story/StoryUnlockConfirmation.tsx) | メイン固有の選択肢・解放確認の中身 |

権利判定・購入・保存・退出ガード・再生フック・戻り先・背景は[story.tsx](../app/story.tsx)／[side-story.tsx](../app/side-story.tsx)が持つ。共通UIへ移さない。ショップ挨拶・退店は共通ヘッダーを使わず、同じ枠と本文表示を組み合わせる。`StoryDialogue`や引数の形を判別する別APIは作らない。

メイン会話はStorySceneの上部にstory-bg.pngと立ち絵の拡大率を保ち、下端を切り取った映像、下部に会話枠を配置する。LIVE・白いコーナー・DAY番号・解放日を重ね、none以外の立ち絵は不透明。映像枠は左右16以上の余白を取り、背景素材1400×950の拡大率で描き、表示枠は素材座標の高さ850まで（下端100を約10.5%切り取る）とする。上下の直線状の白い枠線は付けない。切り取り前の描画高を表示領域高の52%以内に収め、高さが制限されるときは幅も同率で縮めて中央に配置する。背景は元の1400×950の描画寸法を保ち、表示枠の下端でクリップする。スライドは短縮後の枠へ中央配置・containで全体を表示し、スライド用の背景は枠全体をcoverで覆う。コーナー装飾の下側とDAY・日付は短くした枠の下端へ合わせる。立ち絵は700×1000、背景は1400×950を基準に同率で拡縮する。立ち絵と背景の上端を揃え、立ち絵の下部は素材座標で150pxクリップする。画面上の立ち絵は幅が映像幅の50%、高さが映像幅×1000/1400となる。片側がnoneでも位置を保つ。下部を覆う机の色面は置かない。下部は左右22・上12・下28の余白内でStoryMessageBoxのinFlowを使い、高さ240（狭い画面では縮小可）で上端を固定し、話者名は左上のファイルタグ内に固定し、本文と右下の▼は本文領域へ表示する。枠内は上28・下18の余白を取り、フォルダのインデックスより下に本文・選択肢を置く。話者タグはScrollViewの外で左6・上0・幅68・高さ19に配置し、白文字14・1行・必要時縮小でタグの輪郭内に収める。`speaker`から通常話者・２人・システムを表示し、ショップだけ`speakerName`で店員名を渡す。選択肢・購入確認では話者なし。スクロール表示領域を余白の内側に制限し、バウンスを無効にして長文・選択肢を枠内でスクロールする。通常のサイド／ショップ枠はstyles.frameの左右18・下60・高さ240。contentKeyは台詞・選択肢・確認内容が変わった時だけ更新し、文字送り中には変えない。

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

`bgmVolume`・`seVolume`は独立した0〜1の有限数で、共通の`isValidAudioVolume`で検証する。初期値の変更は保存済み音量の上書きには使わない。保存API・プレビューは[AppStateProvider](../src/state/AppStateProvider.tsx)、保存形式は[データ仕様](data-integrations.md)を参照する。

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

## デバッグセンター

Expo Goなどの開発起動と内部用ビルドでは、メニュー末尾の「デバッグ画面」から開く。外部用では入口を表示せず、`/debug`直接指定もメニューへ戻す。ビルド区分の設定は[開発運用手順](development-operations.md#内部用と外部用の切り替え)。画面は[src/debug/DebugScreen.tsx](../src/debug/DebugScreen.tsx)、検証データは[debugActions.ts](../src/debug/debugActions.ts)にまとめる。

### 会話の確認

ストーリー確認専用画面は使わず、テストデータのエピソード・選択肢進捗を設定してメモリーから再生する。第0話は常時再生可能で、入力やチュートリアルを開始しない。サイド会話はテスト領域で必要なメイン話を解放し、NTを追加して通常のショップから購入・再生する。

### テストデータの操作

「テストデータに切り替える」で独立した保存領域へ切り替える。初回は空の状態で、通常データはコピーしない。切り替えると画面が作り直されるため、必要に応じてメニューから再度開く。テスト領域は画面下にTEST DATAを表示する。テストデータは次回も保持し、再起動では通常データから始まる。進行中タイマーがある間は切り替えできない。破損などでデバッグ画面を開けない場合もReloadすれば通常データへ戻る。

操作は次の通り。通常画面での完了・購入・保存処理は同じ実装を通り、テスト領域へ保存する。

- 5秒タイマーは通常のタイマー画面を開く。タスク未設定時は「デバッグ用タスク」を作成する。計測条件・秒単位NT・終了・日記保存の規則は通常どおり。
- 「日次解放をもう一度試す」は確認後に最終完了日だけをnullにする。恒常的な解除・端末時刻の変更ではなく、次回完了1回に対してもう1話を解放できる状態を作る。
- 「解放する話」「選択肢の進捗」は[StoryProgressControls.tsx](../src/debug/StoryProgressControls.tsx)。数字の標準ホイールを画面内で直接回し、「話」「話から」「話まで」は固定表示する。解放範囲・権利の削除／置換・NT・第6話についての説明を欄内に表示する。[NumberSetting.tsx](../src/debug/NumberSetting.tsx)はiOS標準部品の左右各20ポイントの内部余白を考慮し、幅112・表示高56で選択中の1行だけを表示する。内部のiOSホイールは高さ216のまま中央配置し、上下の候補・余白をクリップする。開始／終了は2列に分け、単位を各ホイールの下へ置く。両方とも第1話〜解放済みの最終話を候補にし、もう片方の選択によって候補の配列を変更しない。終了話を開始話より前へ動かしたら開始話も下げ、開始話を終了話より後へ動かしたら終了話も上げる。範囲は1つの状態として同時更新する。個数ボタンは最小幅64・高さ56と内側余白を持ち、狭幅では折り返す。選択肢の個数は横並びの0・1・2・3個から選ぶ。3個は第6話だけの指定時に有効。「決定」1回で直接保存し、別画面のピッカーや追加確認は出さない。ホイール／個数の操作だけでは保存せず、決定後の保存成功でだけ進捗を反映する。エピソードは0〜14話まで連続解放し、指定より後の話・選択肢権利を削除する。残る話の選択肢は保持、新しい話は0個。選択肢は解放済みの開始話〜終了話へ各話0・1・2個を設定し、第6話だけの指定では3個も選べる。本文の上から順に権利を置き換え、条件付き質問も直接解放する。NT・サイド・ログ・日次判定を変更せず、NT消費／返還なし。第0話は対象外。進捗操作だけでは同日の再解放はできない。
- 「NT操作」は[NtControls.tsx](../src/debug/NtControls.tsx)。進捗と別の欄で、1〜`Number.MAX_SAFE_INTEGER`を16桁以内で入力して追加／減算する。負残高・加算後の安全範囲超過は拒否し、成功・失敗後も入力を保持する。ストーリー進捗を変えない。
- 一括データは3日分の日記（0秒・45分15秒・1時間、空・改行・長文）と進行リセット。全話／全分岐の一括プリセットは使わず、上の進捗欄とNT欄で作成する。変更内容を確認してから保存する。名前・タスク・音量・通知時刻・デフォルト時間は保持し、チュートリアル初回判定は消さない。最初の会話からの新規起動検証は専用端末の新規データを使う。
- 「次の保存1回を失敗させる」はテスト領域だけに作用する。次の自動保存でも消費される。未消費予約は閉じても残り、解除・通常データへ戻る・Reloadで消える。失敗後は同じ操作で再試行する。
- 状態の表示・共有は環境・OS・残高・件数・話ID・タイマー情報などに限定し、名前・タスク名・日記本文を含めない。テスト中は通知予約の同期を止め、通常領域の通知を維持する。通知の即時発火・任意日時への時計変更は実装していない。

[StateAccess.tsx](../src/debug/StateAccess.tsx)とProviderの保存キューで、ビルド区分・テスト領域・保存結果を確認する。外部用では`src/debug/`と保存故障注入モジュールを条件付きrequireごと除外する。デバッグ機能は残し、ビルドで切り替えて運用する。完全撤去が必要な場合は、`app/debug.tsx`、メニューとルートレイアウトの`DEBUG_CENTER`接続、Providerの専用Context接続（末尾をchildrenだけへ戻す）、`src/debug/`、音源設定の`/debug`をまとめて外し、静的診断・両バンドルを確認する。

## 編集後の確認

[開発運用手順](development-operations.md)の静的診断とiOSバンドル生成、変更に対応する[手動チェックリスト](manual-acceptance-checklist.md)を実施する。価格・条件の試験値は意図した製品値へ戻してReloadする。PCの診断や過去の確認結果を、変更後のiPhone表示・操作・聴音の合格へ流用しない。未実施項目は未検証として残す。

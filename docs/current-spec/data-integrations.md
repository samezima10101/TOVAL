# データ・連携仕様

2026-10-15更新: 保存失敗・破損保全・計測停止を実装。[実装・検証記録](../manual-acceptance-checklist.md#record-protection)を参照。iPhone実機は未検証。

同日追記: A03・A05の開始情報・開始日集計・日記編集・ホーム日付更新を実装。[日付と記録の検証記録](../manual-acceptance-checklist.md#date-record-alignment)を参照。画面操作・iPhone実機は未検証。

## 永続化の単位と更新順序

**事実**: AsyncStorageのキー`@my-june/app-state-v1`に、AppState全体を1件のJSON文字列で保存する。キー末尾v1はデータスキーマの番号ではなく、現在の`schemaVersion`は8。DB、クラウド同期、別のログファイルは実装されていない。根拠: [APP_STATE_STORAGE_KEY/load/save](../../src/storage/appStateRepository.ts)、[型](../../src/domain/common/types.ts)。

**事実**: Providerの変更操作はPromiseキューで直列化し、最新のstateRefを参照する。原則は「検証→次状態を作る→Repository保存→stateRef/React state更新」。保存失敗時は共有状態を更新せず、後続操作のキューは継続する。保証範囲はこのProvider内であり、複数ブラウザタブや別プロセス間の排他制御はない。根拠: [enqueue/commitState](../../src/state/AppStateProvider.tsx)。

**更新**: 上記は完了・購入等の業務状態に適用する。計測停止は保存キューを待たずstateRef/React stateへ同期反映する。保存結果の反映では、保存中に停止された同じセッションの最新タイマーを維持する。停止/再開保存の失敗は通知し、再試行成功まで停止する。再開は保存成功後に現在のAppStateとルートフォーカスを再確認し、現在時刻から開始する。共通画面・日記・黒画面に再試行導線がある。根拠: [saveAndCommit/applyTimerEligibility/retryTimerSave](../../src/state/AppStateProvider.tsx)、[タイマー](../../app/timer.tsx)。

## AppState項目

以下は[AppState型](../../src/domain/common/types.ts)と[初期値・検証](../../src/storage/appStateRepository.ts)で確認した事実。

| 項目 | 型・初期値 | 用途・更新 |
| --- | --- | --- |
| `schemaVersion` | 現在8 | 保存形式の識別 |
| `userName` | string、空 | 旧データから維持するが現在の設定・表示UIなし |
| `taskName` | string、空 | 1件の現在タスク。入力保存時にtrim |
| `totalNt` | 非負整数、0 | 正常完了で加算、分岐・サイド購入で減算 |
| `totalCompletions` | 非負整数、0 | 正常完了ごとに+1。同日でも加算 |
| `lastCompletionDate` | YYYY-MM-DDまたはnull | 最後の正常終了日。当日完了と当日の話解放を判定 |
| `unlockedStories` | 配列、空 | メイン解放ID・解放日・既読を保持 |
| `storyRouteProgress` | 話IDをキーにするオブジェクト、空 | 初回分岐・追加購入分岐 |
| `purchasedSideStoryIds` | 重複なしの正整数配列、空 | 購入済みサイド会話ID |
| `announcedSideStoryIds` | 重複なしの正整数配列、空 | ショップ挨拶で告知済みの商品ID |
| `diaryLogs` | 配列、空 | 完了単位の集中時間・日記 |
| `activeTimer` | オブジェクトまたはnull | 同時に最大1セッション |

### メイン解放・分岐

| データ | 項目 | 意味 |
| --- | --- | --- |
| `UnlockedStory` | `episodeId`、`unlockedDate`、`isRead` | 解放したメイン話、解放時のローカル日付、話単位の読了 |
| `StoryRouteProgress` | `firstSelectedRouteId?`、`extraUnlockedRouteIds` | 最初に無料選択した分岐と、追加購入した分岐ID |

**事実**: 第1話の分岐IDは`episode-01-encourage`と`episode-01-bow`。追加価格は`STORY_ROUTE_UNLOCK_COST_NT=60`。初回選択を後から置き換える操作はなく、追加解放は別配列へ追加する。根拠: [本文](../../src/domain/storyData.ts)、[Provider](../../src/state/AppStateProvider.tsx)、[定数](../../src/domain/common/types.ts)。

### タイマー

| 項目 | 意味 |
| --- | --- |
| `sessionId` | Date.nowとMath.randomから作る識別子。完了ログIDにも使用 |
| `plannedSeconds` | 予定集中秒数、0〜86100の整数 |
| `startedTaskName` | セッション作成時のタスク名 |
| `startInfo` | 新規開始ボタンの呼出時、保存キューを待つ前に取得する`startedAt`（時刻ms）・`startedDate`（端末ローカルYYYY-MM-DD）・`startedTime`（HH:MM:SS）。旧タイマーはnull。停止・再開・読込時の停止正規化で変更しない |
| `accumulatedMs` | 閉じた実行区間の累積ms。停止時にメモリ反映し、保存成功で永続化。失敗中はメモリの値と最後の保存値が異なることがある |
| `runningSince` | 現在の実行区間開始の時刻ms、停止時null |

**事実**: 経過ms=`accumulatedMs + max(0, now-runningSince)`（実行中のみ）。獲得NT=`floor(経過ms/1000)`。予定達成はmsで判定。Date.nowベースで、単調増加時計やサーバー時刻は使用しない。根拠: [getTimerElapsedMs/getTimerSnapshot](../../src/domain/timer.ts)。

### 日記ログ

| 項目 | 意味 |
| --- | --- |
| `id` | 完了したタイマーのsessionId。ログ内で重複不可 |
| `startInfo` | タイマーからそのまま継承。開始日の暦と時刻表示は後から再計算しない。旧ログ・旧タイマー由来はnull |
| `logDate` | カレンダー上の所属日。新規は`startInfo.startedDate`。旧ログは元の`completedDate`、旧タイマーを完了した場合は互換動作として終了日 |
| `completedAt` | 終了ボタンを押した時刻ms |
| `completedDate` | その時点の端末ローカル日付 |
| `completedTime?` | HH:MM。現行の新規記録には入り、古い記録では省略可 |
| `totalTimerSeconds` | 延長込みの実集中秒数、端数切捨て |
| `diary` | trim済み日記文字列。空文字可 |
| `unlockedEpisodeId` | その完了で解放した話ID、解放なしはnull |

**事実**: カレンダーの印・一覧・選択日の合計は`logDate`を使う。正常完了の実集中秒数を開始日の合計に全量加算し、日付境界で分割しない。キャンセルではログを作らない。各記録に開始時刻（旧記録は「記録なし」）・集中時間・日記を表示し、開始日は個別項目として表示しない。時間と合計は「0時間0分0秒」形式。`completedAt/completedDate/completedTime`は終了情報として維持するが、開始時刻の代用にしない。タスク名、予定秒数、獲得NT、日記更新時刻、タイムゾーンID、キャンセル履歴はログに保存しない。根拠: [completeTimer](../../src/domain/completion.ts)、[ログ](../../app/log.tsx)、[LogModal](../../src/components/log/LogModal.tsx)。

## 作成・更新・削除の一覧

| 操作 | 保存される変更 | 根拠 |
| --- | --- | --- |
| 初回タスク保存/名前編集 | `taskName`更新 | [setTaskName](../../src/state/AppStateProvider.tsx) |
| タイマー開始 | `activeTimer`作成。既存があればそのまま返す | [startTimer](../../src/state/AppStateProvider.tsx) |
| 実行開始/停止 | 停止は直ちに区間を閉じて保存。再開は保存成功後に現在の資格を確認 | [applyTimerEligibility](../../src/state/AppStateProvider.tsx) |
| 期限前キャンセル | `activeTimer=null`。他の業務データは変更なし | [cancelTimer](../../src/domain/completion.ts) |
| 正常完了 | NT・累計・最終日更新、日記追加、条件付き話追加、タイマー消去 | [completeTimer](../../src/domain/completion.ts) |
| 保存済み日記編集 | 指定ログの`diary`だけを更新。1000文字以下・空文字可・trim。保存成功前は元のログを保持 | [editDiary](../../src/domain/diary.ts)、[updateDiary](../../src/state/AppStateProvider.tsx) |
| メイン読了 | 該当話の`isRead=true` | [markStoryRead](../../src/state/AppStateProvider.tsx) |
| 初回分岐選択 | `firstSelectedRouteId`追加 | [selectInitialStoryRoute](../../src/state/AppStateProvider.tsx) |
| 別分岐購入 | 残高-60、`extraUnlockedRouteIds`追加 | [unlockAdditionalStoryRoute](../../src/state/AppStateProvider.tsx) |
| サイド購入 | 残高-60、`purchasedSideStoryIds`追加 | [unlockSideStory](../../src/state/AppStateProvider.tsx) |
| 入荷告知読了 | `announcedSideStoryIds`に未告知ID追加 | [announceSideStories](../../src/state/AppStateProvider.tsx) |
| 旧データ読込 | 移行後に現行形式を保存 | [load/parsePersistedState](../../src/storage/appStateRepository.ts) |
| 破損データの明示的初期化 | 対象・影響を確認後、原文をrecoveryキーへ退避・照合してから主キーを初期化 | [initializePreservedData](../../src/storage/appStateRepository.ts)、[確認UI](../../app/_layout.tsx) |

**事実**: 日記編集は既存の保存キューとsaveAndCommitを使い、集中時間・NT・完了回数・会話解放を変更しない。失敗時は元の状態と入力下書きを維持してエラーを表示し、保存を再試行できる。編集キャンセルは下書きの破棄のみ。旧ログの長い日記は読込時に切り捨てず保持するが、編集保存時には1000文字以下にする。

**事実**: タスク削除、日記削除、購入取消/返金、通常データの全消去、製品版のエクスポート/インポート操作はない。破損時だけ確認付きの退避・初期化がある。RepositoryにremoveItemはなく、退避も自動削除しない。`reset-project`は端末データではなくソースを初期化する別用途。

## 日付と日次制約

**事実**: 日付キーは端末のローカル暦。今日の完了=`lastCompletionDate === today`。完了・日次解放は終了ボタンの時刻を使い、日記保存が翌日でも終了日を維持する。ログ所属日は開始日と別管理。ホームは次のローカル0時のタイマー、active復帰、30秒ごとの時計再確認で当日表示を更新する。保存状態のリセットは行わない。案内は未解放あり・本日完了済み・全話解放済みを分岐し、話数はカタログを参照する。根拠: [useLocalToday](../../src/hooks/useLocalToday.ts)、[ホーム](../../app/index.tsx)、[isFirstCompletionOnDate](../../src/domain/completion.ts)。

**限界**: 時計やタイムゾーンを変えると「その日」の判定や実行区間の時間に影響し得る。最後の日付だけを持つため、日付を往復した際に暦日単位の履歴制約は保証しない。0時の表示更新と復帰時の挙動はiPhone実機未検証。

## 保存検証・旧形式の移行

以下は[parsePersistedState/validateAppState/migrateLegacyState](../../src/storage/appStateRepository.ts)で確認した事実。

| 保存形式 | 処理 |
| --- | --- |
| v8 | 型、整数、日付、開始情報（nullまたは全3項目）、所属日と開始日の一致、ID重複、既存話ID、タイマー範囲等を検証して受入。欠落した開始情報を自動補正しない |
| v7 | `startInfo=null`、ログの`logDate=completedDate`を追加しv8として検証。元の必須配列（日記・購入・告知）の欠落は破損として拒否 |
| v4/v5/v6 | 従来の互換補完に加え開始情報null・元所属日のlogDateを追加しv8として検証。購入・告知・日記を欠けていれば補う |
| 旧`isSideStoryUnlocked=true` | 購入済みID `[101]`へ移行 |
| v5の日記で日付欠落 | `completedAt`から読込時のローカル日付を補う。元のタイムゾーンは復元不可 |
| v0〜v3/番号なし | 旧形式の省略可能フィールドを補完。存在する不正フィールドは受け入れない。v3より前の解放話は既読として扱う。元形式にない日記・ショップは初期値 |
| v1以前のタイマー | startedAtから実集中を復元できないため累積0、停止として維持 |
| v4 | 専用のv4/v5/v6分岐が先に実行されるため、そこで不正ならlegacy経路には進まずnull |
| JSON不正、未対応バージョン、現行/旧形式の検証不合格 | parseはnull、loadはPreservedDataError。通常画面を開かず主キー原文を保護し、通常保存・移行による上書きを拒否 |

**互換動作**: 開始情報を持たない全旧タイマーは`startInfo=null`のまま再開・完了する。v1以前の旧startedAtも、元のローカル暦・開始ボタンの記録として転用しない。完了時は従来の終了日に所属させ、開始時刻は「記録なし」。開始日を現在日や再開日から推定しない。v5の日付欠落だけは従来どおりcompletedAtから補完する。既存の日付があれば移動しない。主キーは変更せず、対応旧版を読んだ時にv8へ1回保存する。移行保存の失敗時は旧原文が残り、読込エラーから再試行できる。

**事実**: 有効な旧形式はload時に現行形式で保存する。不正データでは書込資格を無効にし、通常保存前にも主キーの形式を確認する。再読込または明示的初期化へ進める。初期化時だけ `@my-june/recovery/<時刻>-<乱数>` に原文を退避・照合し、主キーが変わっていないことを確認して初期値へ置換する。退避失敗は通知して中止する。自動修復/退避からのアプリ内自動復元はない。実行中の保存タイマーはProvider読込時に区間を停止へ正規化し、未確定時間を加算しない。

**事実**: 分岐IDは文字列・重複等の検証が中心で、該当話の実在分岐との照合はない。購入/告知IDも正整数・重複のみで商品カタログと照合しない。話解放と分岐進捗の整合、最終完了日とログの整合は全面的には検証しない。通常の購入APIでは実在性を再確認するが、保存データ全体の意味的整合を保証するものではない。

**検証状況**: 破損保護・退避・旧形式はメモリストレージで補助確認済み。保存済み累積を維持し未保存区間の損失を許容する方針はA04で確定。iPhoneのエラー表示/ロック/再起動等は未検証。[保持項目・検証データ・再現手順](../manual-acceptance-checklist.md#record-protection)を参照。物語ID変更時の移行ルールは引き続き未確定。

## 静的コンテンツ

| 内容 | 保存場所・現状 |
| --- | --- |
| メイン本文 | [storyData.ts](../../src/domain/storyData.ts): 1「初めてのタスク完了！」、2「上司からの労い」、3「部下の決意」 |
| サイド本文 | [shop.ts](../../src/content/shop.ts): 101「雨宿りの帰り道」4行、102「休憩のひととき」2行、103「雨上がり」2行 |
| 入荷条件 | [sideStory.ts](../../src/domain/sideStory.ts): 101条件なし、102/103は第2話既読、購入済みは常に可 |
| 店員会話 | [shop.ts](../../src/content/shop.ts): 挨拶1行、入荷告知追加1行、退店1行。エトの立ち絵は仮アイコン |
| 表情 | [StoryCharacters](../../src/components/story/StoryCharacters.tsx): 各2画像、doubtはtalkと同じ画像を使用 |
| BGM・背景 | [bgm.ts](../../src/constants/bgm.ts)、[timer.tsx](../../app/timer.tsx): ローカル固定アセット |

**事実**: 102/103の本文・入荷条件はソースコメントで仮と明記されている。本文はアプリに同梱し、CMSやサーバーから取得しない。変更はソース変更と再配布が必要。

## 認証・権限・外部サービス

| 分野 | 確認した事実・限界 | 根拠 |
| --- | --- | --- |
| 認証 | ログイン、セッション、ユーザーID、役割、サーバー認可なし | [状態型](../../src/domain/common/types.ts)、[Provider](../../src/state/AppStateProvider.tsx) |
| ゲーム内権限 | 保存済み解放/購入状態で画面と購入APIを制御する。NTはアプリ内ポイント。実決済なし | [メイン](../../app/story.tsx)、[サイド](../../app/side-story.tsx)、[Provider](../../src/state/AppStateProvider.tsx) |
| データ送信 | `app/`と`src/`にfetch/axios/環境変数による業務API連携は見つからない。分析・広告・クラッシュ送信のアプリ実装なし | [依存](../../package.json)、[app](../../app/)、[src](../../src/) |
| 端末許可要求 | アプリソースにマイク/通知/位置情報等の許可要求処理なし。BGMはexpo-audio | [BGMフック](../../src/hooks/useScreenBgm.ts)、[設定](../../app.json) |
| ネイティブ生成設定 | expo-audioをオプションなしで登録。ローカル57.0.4プラグインでは録音Android許可とバックグラウンド再生設定が既定で有効 | [app.json](../../app.json)、[ローカルプラグイン](../../node_modules/expo-audio/plugin/build/withAudio.js) |
| ルーティング | URI schemeはmyjune、typedRoutes有効。URL引数でも保存済み権限を検査 | [設定](../../app.json)、[メイン](../../app/story.tsx)、[サイド](../../app/side-story.tsx) |
| 開発サービス | Expo/npm等は開発基盤。アプリ業務データのクラウド同期とは別。配布アカウント情報は未確認 | [package](../../package.json)、[README](../../README.md) |

ローカルプラグインへのリンクは調査環境用で、Gitに同梱されない。生成済みManifest/Info.plist・配布バイナリは確認しておらず、「許可要求処理なし」は「バイナリに権限宣言がない」を意味しない。

**事実**: 保存はJSONであり、このコードには暗号化・署名・SecureStore・改ざん検知・サーバー残高照合を実装していない。端末OSによる保護やバックアップ挙動は本調査で検証していない。

**要確認**: 日記の機密性、保存期間、端末変更時の移行、バックアップ、不要な録音・背景再生宣言の扱い。現在のローカル専用設計を維持するかも仕様決定が必要。

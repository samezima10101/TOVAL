# データ・連携仕様

## 永続化の単位と更新順序

**事実**: AsyncStorageのキー`@my-june/app-state-v1`に、AppState全体を1件のJSON文字列で保存する。キー末尾v1はデータスキーマの番号ではなく、現在の`schemaVersion`は7。DB、クラウド同期、別のログファイルは実装されていない。根拠: [APP_STATE_STORAGE_KEY/load/save](../../src/storage/appStateRepository.ts)、[型](../../src/domain/common/types.ts)。

**事実**: Providerの変更操作はPromiseキューで直列化し、最新のstateRefを参照する。原則は「検証→次状態を作る→Repository保存→stateRef/React state更新」。保存失敗時は共有状態を更新せず、後続操作のキューは継続する。保証範囲はこのProvider内であり、複数ブラウザタブや別プロセス間の排他制御はない。根拠: [enqueue/commitState](../../src/state/AppStateProvider.tsx)。

## AppState項目

以下は[AppState型](../../src/domain/common/types.ts)と[初期値・検証](../../src/storage/appStateRepository.ts)で確認した事実。

| 項目 | 型・初期値 | 用途・更新 |
| --- | --- | --- |
| `schemaVersion` | 現在7 | 保存形式の識別 |
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
| `accumulatedMs` | 保存済み・確定済み実行区間の累積ms |
| `runningSince` | 現在の実行区間開始の時刻ms、停止時null |

**事実**: 経過ms=`accumulatedMs + max(0, now-runningSince)`（実行中のみ）。獲得NT=`floor(経過ms/1000)`。予定達成はmsで判定。Date.nowベースで、単調増加時計やサーバー時刻は使用しない。根拠: [getTimerElapsedMs/getTimerSnapshot](../../src/domain/timer.ts)。

### 日記ログ

| 項目 | 意味 |
| --- | --- |
| `id` | 完了したタイマーのsessionId。ログ内で重複不可 |
| `completedAt` | 終了ボタンを押した時刻ms |
| `completedDate` | その時点の端末ローカル日付 |
| `completedTime?` | HH:MM。現行の新規記録には入り、古い記録では省略可 |
| `totalTimerSeconds` | 延長込みの実集中秒数、端数切捨て |
| `diary` | trim済み日記文字列。空文字可 |
| `unlockedEpisodeId` | その完了で解放した話ID、解放なしはnull |

**事実**: タスク名、起動時刻、予定秒数、獲得NT、日記更新時刻、タイムゾーンID、キャンセル履歴はログに保存しない。表示される時刻は起動時刻ではない。根拠: [completeTimer](../../src/domain/completion.ts)、[LogModal](../../src/components/log/LogModal.tsx)。

## 作成・更新・削除の一覧

| 操作 | 保存される変更 | 根拠 |
| --- | --- | --- |
| 初回タスク保存/名前編集 | `taskName`更新 | [setTaskName](../../src/state/AppStateProvider.tsx) |
| タイマー開始 | `activeTimer`作成。既存があればそのまま返す | [startTimer](../../src/state/AppStateProvider.tsx) |
| 実行開始/停止 | `runningSince`、`accumulatedMs`更新 | [applyTimerEligibility](../../src/state/AppStateProvider.tsx) |
| 期限前キャンセル | `activeTimer=null`。他の業務データは変更なし | [cancelTimer](../../src/domain/completion.ts) |
| 正常完了 | NT・累計・最終日更新、日記追加、条件付き話追加、タイマー消去 | [completeTimer](../../src/domain/completion.ts) |
| メイン読了 | 該当話の`isRead=true` | [markStoryRead](../../src/state/AppStateProvider.tsx) |
| 初回分岐選択 | `firstSelectedRouteId`追加 | [selectInitialStoryRoute](../../src/state/AppStateProvider.tsx) |
| 別分岐購入 | 残高-60、`extraUnlockedRouteIds`追加 | [unlockAdditionalStoryRoute](../../src/state/AppStateProvider.tsx) |
| サイド購入 | 残高-60、`purchasedSideStoryIds`追加 | [unlockSideStory](../../src/state/AppStateProvider.tsx) |
| 入荷告知読了 | `announcedSideStoryIds`に未告知ID追加 | [announceSideStories](../../src/state/AppStateProvider.tsx) |
| 旧データ読込 | 移行後に現行形式を保存 | [load/parsePersistedState](../../src/storage/appStateRepository.ts) |

**事実**: タスク削除、日記編集/削除、購入取消/返金、全データ消去、エクスポート/インポートのアプリ操作はない。RepositoryにもremoveItemはない。`reset-project`は端末データではなくソースを初期化する別用途。

## 日付と日次制約

**事実**: 日付キーは端末のローカル暦。今日の完了=`lastCompletionDate === todayKey()`。当日初回解放も最終完了日との比較のみで判断する。翌日0時に保存状態をリセットするジョブはなく、ホームが再描画された時に表示が変わる。根拠: [日付](../../src/domain/common/date.ts)、[ホーム](../../app/index.tsx)、[isFirstCompletionOnDate](../../src/domain/completion.ts)。

**推測**: 画面を開いたまま日付が変わると、再描画まで旧表示が残り得る。時計やタイムゾーンを変えると「その日」の判定や実行区間の時間に影響し得る。最後の日付だけを持つため、日付を往復した際に暦日単位の履歴制約は保証しない。

## 保存検証・旧形式の移行

以下は[parsePersistedState/validateAppState/migrateLegacyState](../../src/storage/appStateRepository.ts)で確認した事実。

| 保存形式 | 処理 |
| --- | --- |
| v7 | 型、整数、日付、ID重複、既存話ID、タイマー範囲等を検証して受入 |
| v4/v5/v6 | 先にフィールドを補ってv7として検証。購入・告知・日記を欠けていれば補う |
| 旧`isSideStoryUnlocked=true` | 購入済みID `[101]`へ移行 |
| v5の日記で日付欠落 | `completedAt`から読込時のローカル日付を補う。元のタイムゾーンは復元不可 |
| v0〜v3/番号なし | 旧形式を正規化。v3より前の解放話は既読として扱う。日記・ショップは初期値 |
| v1以前のタイマー | startedAtから実集中を復元できないため累積0、停止として維持 |
| v4 | 専用のv4/v5/v6分岐が先に実行されるため、そこで不正ならlegacy経路には進まずnull |
| JSON不正、未対応バージョン、現行検証不合格 | nullとして扱い、loadは初期状態を返す。UIへ破損エラーは出さない |

**事実**: 有効な旧形式はload時に現行形式で上書き保存する。無効データはその場では削除しないが、次の通常保存で同じキーを上書きする。バックアップキー・隔離・回復UIはない。実行中の保存タイマーはProviderの読込時に区間を停止へ正規化し、未確定時間を加算しない。

**事実**: 分岐IDは文字列・重複等の検証が中心で、該当話の実在分岐との照合はない。購入/告知IDも正整数・重複のみで商品カタログと照合しない。話解放と分岐進捗の整合、最終完了日とログの整合は全面的には検証しない。通常の購入APIでは実在性を再確認するが、保存データ全体の意味的整合を保証するものではない。

**要確認**: 破損時の回復方針、旧形式ごとの保持項目、強制終了時に未確定時間を失ってよいか、物語ID変更時の移行ルール。

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

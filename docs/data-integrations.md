# データ・連携仕様

更新日: 2026-10-24（日本時間）。現行の保存形式はv14。仕様の合格条件は[完成基準](completion-criteria.md)、検証手順と実施結果は[手動チェックリスト](manual-acceptance-checklist.md)を参照する。

## 永続化の単位と更新順序

**事実**: AsyncStorageのキー`@my-june/app-state-v1`に、AppState全体を1件のJSON文字列で保存する。キー末尾v1はデータスキーマの番号ではなく、現在の`schemaVersion`は14。DB、クラウド同期、別のログファイルは実装されていない。根拠: [APP_STATE_STORAGE_KEY/load/save](../src/storage/appStateRepository.ts)、[型](../src/domain/common/types.ts)。

**事実**: Providerの変更操作はPromiseキューで直列化し、最新のstateRefを参照する。原則は「検証→次状態を作る→Repository保存→stateRef/React state更新」。保存失敗時は共有状態を更新せず、後続操作のキューは継続する。保証範囲はこのProvider内であり、複数ブラウザタブや別プロセス間の排他制御はない。根拠: [enqueue/commitState](../src/state/AppStateProvider.tsx)。

**更新**: 上記は完了・購入等の業務状態に適用する。計測停止は保存キューを待たずstateRef/React stateへ同期反映する。保存結果の反映では、保存中に停止された同じセッションの最新タイマーを維持する。停止/再開保存の失敗は通知し、再試行成功まで停止する。再開は保存成功後に現在のAppStateとルートフォーカスを再確認し、現在時刻から開始する。共通画面・日記・黒画面に再試行導線がある。根拠: [saveAndCommit/applyTimerEligibility/retryTimerSave](../src/state/AppStateProvider.tsx)、[タイマー](../app/timer.tsx)。

**通知設定**: ユーザー名と通知時刻も保存成功後に共有状態へ反映する。OSへの通知予約はその後に同期し、予約失敗を設定保存失敗と区別する。予約失敗でも保存済みの名前・時刻を戻さず、メニューの再試行と前景復帰で再同期する。OSの許可状態と予約状態はアプリの保存データとは別に照合する。固定ID`myjune-daily-timer-reminder`でiOSの繰り返し予約を置き換え、更新前に取り消さないため、予約更新の失敗では旧予約が残る場合がある。許可されていない場合はその予約を取り消す。根拠: [予約処理](../src/notifications/reminderNotifications.ts)、[同期Provider](../src/state/ReminderNotificationProvider.tsx)。

**BGM音量**: 保存済み値は`state.bgmVolume`に保持する。`previewBgmVolume(number | null)`で操作中だけの値を設定／解除し、`useAppState().bgmVolume`はプレビューがあればその値、なければ保存済み値を返す。スライダーを離したときに`setBgmVolume`で保存し、成功後に保存済みstateへ反映する。失敗時はプレビューを解除して表示・再生を保存済み値へ戻し、同じ希望値で再試行する。プレビュー値は他項目の保存に混ぜない。根拠: [Provider](../src/state/AppStateProvider.tsx)、[メニュー](../app/(tabs)/menu.tsx)。

**効果音音量**: 保存済み値は`state.seVolume`へ独立して保持する。`previewSeVolume(number | null)`で操作中の値を設定／解除し、`useAppState().seVolume`が現在の音量を返す。`setSeVolume`で保存成功後にstateへ反映する。メニューの両音量は共通`VolumeSetting`を使い、対象音量だけを保存／失敗時復帰／再試行する。どちらもVoiceOverなど非ドラッグの増減は変更時に保存する。タブ押下は音を再生するだけで、記録・NT・会話権利や音量の保存値を更新しない。

## AppState項目

以下は[AppState型](../src/domain/common/types.ts)と[初期値・検証](../src/storage/appStateRepository.ts)で確認した事実。

| 項目 | 型・初期値 | 用途・更新 |
| --- | --- | --- |
| `schemaVersion` | 現在14 | 保存形式の識別 |
| `bgmVolume` | 0〜1の有限数、0.3 | メニューの標準スライダーで0〜100%に調整。操作中は即時プレビューし、指を離すと保存。0は無音・一時停止。旧`bgmEnabled`を置換し、SEには使わない |
| `seVolume` | 0〜1の有限数、1 | BGMとは独立したタブ効果音音量。メニューで0〜100%・1%刻みに調整し、プレビュー／保存／失敗時復帰はBGMと共通化。0で効果音だけを無音にする |
| `userName` | string、「ゲスト」 | メニューの入力は40 UTF-16コード単位で制限し、保存時にtrim。保存APIの互換検証はtrim後1〜40 Unicodeコードポイントを維持する。既存の長い名前は移行・他項目の保存・編集開始で切り詰めない。保存済みの名前を通知本文へ使用 |
| `notificationHour` | 0〜23の整数、21 | 毎日の通知時刻の時。端末ローカル時刻 |
| `notificationMinute` | 0〜59の整数、30 | 毎日の通知時刻の分 |
| `defaultTimerMinutes` | 0〜1435の整数・5分刻み、25 | メニューで変更し、ホームの時間設定Modalを開くたびに入力する初期時間。進行中タイマーの予定時間は変更しない |
| `taskName` | string、空 | 1件の現在タスク。初回登録・メニューの入力は80 UTF-16コード単位で制限し、保存時にtrim。既存値は読込時に切り詰めない |
| `totalNt` | 非負整数、0 | 正常完了で加算、分岐・サイド購入で減算 |
| `totalCompletions` | 非負整数、0 | 正常完了ごとに+1。同日でも加算 |
| `lastCompletionDate` | YYYY-MM-DDまたはnull | 最後の正常終了日。当日完了と当日の話解放を判定 |
| `unlockedStories` | 配列、空 | メイン解放ID・解放日を保持 |
| `storyRouteProgress` | 話IDをキーにするオブジェクト、空 | 初回分岐・追加購入分岐 |
| `purchasedSideStoryIds` | 重複なしの正整数配列、空 | 購入済みサイド会話ID |
| `announcedSideStoryIds` | 重複なしの正整数配列、空 | ショップ挨拶で告知済みの商品ID |
| `diaryLogs` | 配列、空 | 完了単位の集中時間・日記 |
| `activeTimer` | オブジェクトまたはnull | 同時に最大1セッション |

### メイン解放・分岐

| データ | 項目 | 意味 |
| --- | --- | --- |
| `UnlockedStory` | `episodeId`、`unlockedDate` | 解放したメイン話、解放時のローカル日付 |
| `StoryRouteProgress` | `firstSelectedRouteId?`、`extraUnlockedRouteIds` | 最初に無料選択した分岐と、追加購入した分岐ID |

**事実**: 第1話の分岐IDは`episode-01-encourage`と`episode-01-bow`。追加価格は[専用設定](../src/config/conversationSettings.ts)の話ごとの`additionalRoutePriceNt`（初期60）。初回選択を後から置き換える操作はなく、追加解放は別配列へ追加する。根拠: [本文](../src/domain/storyData.ts)、[Provider](../src/state/AppStateProvider.tsx)、[設定編集方法](conversation-settings.md)。

### タイマー

| 項目 | 意味 |
| --- | --- |
| `sessionId` | Date.nowとMath.randomから作る識別子。完了ログIDにも使用 |
| `plannedSeconds` | 予定集中秒数、0〜86100の整数 |
| `startedTaskName` | セッション作成時のタスク名 |
| `startInfo` | 新規開始ボタンの呼出時、保存キューを待つ前に取得する`startedAt`（時刻ms）・`startedDate`（端末ローカルYYYY-MM-DD）・`startedTime`（HH:MM:SS）。旧タイマーはnull。停止・再開・読込時の停止正規化で変更しない |
| `accumulatedMs` | 閉じた実行区間の累積ms。停止時にメモリ反映し、保存成功で永続化。失敗中はメモリの値と最後の保存値が異なることがある |
| `runningSince` | 現在の実行区間開始の時刻ms、停止時null |

**事実**: 経過ms=`accumulatedMs + max(0, now-runningSince)`（実行中のみ）。獲得NT=`floor(経過ms/1000)`。予定達成はmsで判定。Date.nowベースで、単調増加時計やサーバー時刻は使用しない。根拠: [getTimerElapsedMs/getTimerSnapshot](../src/domain/timer.ts)。

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

**事実**: カレンダーの印・一覧・選択日の合計は`logDate`を使う。正常完了の実集中秒数を開始日の合計に全量加算し、日付境界で分割しない。キャンセルではログを作らない。各記録に開始時刻（旧記録は「記録なし」）・集中時間・日記を表示し、開始日は個別項目として表示しない。開始時刻は「9時5分」の形式で秒を省略する。集中時間と合計は時分秒で表示し、0時間のときは「時間」を省略する（例: 45分15秒、0分0秒）。保存している開始時刻・秒数自体は変更しない。`completedAt/completedDate/completedTime`は終了情報として維持するが、開始時刻の代用にしない。タスク名、予定秒数、獲得NT、日記更新時刻、タイムゾーンID、キャンセル履歴はログに保存しない。根拠: [completeTimer](../src/domain/completion.ts)、[ログ](../app/(tabs)/log.tsx)、[LogModal](../src/components/log/LogModal.tsx)。

**2026-10-23のユーザー回答で確定した矢印移動**: 移動先は「集中記録のある日」とする。`diaryLogs`から重複のない`logDate`を取り、選択日より前／後にある最も近い日へ移動する。空の日を選択していても同じ比較を使い、候補がない方向は薄く表示して操作できなくする。ログイン・起動日の履歴と保存項目・形式は追加しない。日記編集も従来どおり対象ログの`diary`だけを更新する。UI/iPhoneの確認は未実施で、手順と結果は[ログ表示のチェックリスト](manual-acceptance-checklist.md#calendar-log-design)に記録する。

## 作成・更新・削除の一覧

| 操作 | 保存される変更 | 根拠 |
| --- | --- | --- |
| 初回タスク保存/名前編集 | `taskName`更新 | [setTaskName](../src/state/AppStateProvider.tsx) |
| ユーザー名保存 | `setUserName`で`userName`のみ更新。処理キュー内の最新通知時刻を保持し、保存成功後にOSの予約を更新 | [Provider](../src/state/AppStateProvider.tsx)、[メニュー](../app/(tabs)/menu.tsx) |
| 通知時刻保存 | `setNotificationTime`で`notificationHour`・`notificationMinute`のみ更新。最新の名前を長さも含め保持し、保存成功後にOSの予約を更新。入力はiPhone標準の時刻ピッカー | [Provider](../src/state/AppStateProvider.tsx)、[メニュー](../app/(tabs)/menu.tsx) |
| デフォルト時間保存 | `setDefaultTimerMinutes`で`defaultTimerMinutes`だけを更新。0分〜23時間55分の5分刻みを検証し、保存成功後に共有状態へ反映。ホームの時間設定Modal内の一時的な増減では設定を上書きしない | [Provider](../src/state/AppStateProvider.tsx)、[ホーム](../app/(tabs)/index.tsx) |
| BGM音量保存 | `setBgmVolume`で0〜1の有限数を検証し`bgmVolume`だけを更新。保存キューと保存成功後のstate反映を使い、プレビューは永続化しない | [Provider](../src/state/AppStateProvider.tsx)、[メニュー](../app/(tabs)/menu.tsx) |
| 効果音音量保存 | `setSeVolume`で0〜1の有限数を検証し`seVolume`だけを更新。BGMと同じ保存キューを使い、他の保存値・プレビューを混ぜない | [Provider](../src/state/AppStateProvider.tsx)、[メニュー](../app/(tabs)/menu.tsx) |
| タイマー開始 | `activeTimer`作成。既存があればそのまま返す | [startTimer](../src/state/AppStateProvider.tsx) |
| 実行開始/停止 | 停止は直ちに区間を閉じて保存。再開は保存成功後に現在の資格を確認 | [applyTimerEligibility](../src/state/AppStateProvider.tsx) |
| 期限前キャンセル | `activeTimer=null`。他の業務データは変更なし | [cancelTimer](../src/domain/completion.ts) |
| 正常完了 | NT・累計・最終日更新、日記追加、条件付き話追加、タイマー消去 | [completeTimer](../src/domain/completion.ts) |
| 保存済み日記編集 | 指定ログの`diary`だけを更新。1000 UTF-16コード単位以下・空文字可・trim。入力時制限と保存前の無言のガードを使い、保存成功前は元のログを保持 | [editDiary](../src/domain/diary.ts)、[updateDiary](../src/state/AppStateProvider.tsx) |
| 初回分岐選択 | `firstSelectedRouteId`追加 | [selectInitialStoryRoute](../src/state/AppStateProvider.tsx) |
| 別分岐購入 | 残高から設定価格を減算、`extraUnlockedRouteIds`追加 | [unlockAdditionalStoryRoute](../src/state/AppStateProvider.tsx) |
| サイド購入 | 残高から設定価格を減算、`purchasedSideStoryIds`追加 | [unlockSideStory](../src/state/AppStateProvider.tsx) |
| 入荷告知読了 | `announcedSideStoryIds`に未告知ID追加 | [announceSideStories](../src/state/AppStateProvider.tsx) |
| 旧データ読込 | 移行後に現行形式を保存 | [load/parsePersistedState](../src/storage/appStateRepository.ts) |
| 破損データの明示的初期化 | 対象・影響を確認後、原文をrecoveryキーへ退避・照合してから主キーを初期化 | [initializePreservedData](../src/storage/appStateRepository.ts)、[確認UI](../src/components/common/AppStartupGate.tsx) |

**事実**: 日記編集は既存の保存キューとsaveAndCommitを使い、集中時間・NT・完了回数・会話解放を変更しない。失敗時は元の状態と入力下書きを維持してエラーを表示し、保存を再試行できる。編集キャンセルは下書きの破棄のみ。旧ログの長い日記は読込・編集開始時に切り捨てず、削除して短く編集できる。1000 UTF-16コード単位を超える間はOKを無効にし、保存処理でも警告なしで止める。domainの日記上限検証は維持する。

**事実**: タスク削除、日記削除、購入取消/返金、通常データの全消去、製品版のエクスポート/インポート操作はない。破損時だけ確認付きの退避・初期化がある。RepositoryにremoveItemはなく、退避も自動削除しない。

## 日付と日次制約

**事実**: 日付キーは端末のローカル暦。今日の完了=`lastCompletionDate === today`。完了・日次解放は終了ボタンの時刻を使い、日記保存が翌日でも終了日を維持する。ログ所属日は開始日と別管理。ホームは次のローカル0時のタイマー、active復帰、30秒ごとの時計再確認で当日表示を更新する。保存状態のリセットは行わない。案内は未解放あり・本日完了済み・全話解放済みを分岐し、話数はカタログを参照する。根拠: [useLocalToday](../src/hooks/useLocalToday.ts)、[ホーム](../app/(tabs)/index.tsx)、[isFirstCompletionOnDate](../src/domain/completion.ts)。

**限界**: 時計やタイムゾーンを変えると「その日」の判定や実行区間の時間に影響し得る。最後の日付だけを持つため、日付を往復した際に暦日単位の履歴制約は保証しない。0時の表示更新と復帰時の挙動はiPhone実機未検証。

## 保存検証・旧形式の移行

以下は[parsePersistedState/validateAppState/migrateLegacyState](../src/storage/appStateRepository.ts)で確認した事実。

| 保存形式 | 処理 |
| --- | --- |
| v14 | `bgmVolume`・`seVolume`の0〜1の有限数、デフォルト時間の0〜1435の整数・5分刻み、通知時刻の時0〜23・分0〜59の整数とユーザー名、以下の既存条件を検証。必須項目の欠落・不正型・範囲外は保全 |
| v13 | `seVolume=1`だけを補完してv14へ保存。BGM音量・名前・通知・デフォルト時間・記録・権利・進行中タイマー等の全既存値を保持し、旧必須項目の不正値を補正しない |
| v12 | 旧`bgmEnabled`の真偽値を検証し、true→`bgmVolume=0.3`、false→0へ変換して旧項目を除去。`seVolume=1`を追加。デフォルト時間・通知時刻・名前・進捗・進行中タイマー等を保持してv14へ保存。旧必須項目の欠落・不正型は補正しない |
| v11 | デフォルト時間25分・SE音量1を追加し、旧BGM真偽値を音量へ変換。通知時刻・ユーザー名・進捗・進行中タイマー等を保持してv14へ保存。旧形式の必須項目も検証し、不正な通知時刻等を補正しない |
| v10 | デフォルト時間25分・通知時刻21:30・SE音量1を追加し、旧BGM真偽値を音量へ変換。空白だけのユーザー名は「ゲスト」へ移行。有効な既存名・他の保存項目を保持してv14へ保存。旧形式の必須項目も検証 |
| v9 | デフォルト時間25分・BGM音量0.3・SE音量1・通知設定の初期値を補完しv14へ保存。他の全項目は補完せず保持。型、整数、日付、開始情報（nullまたは全3項目）、所属日と開始日の一致、ID重複、既存話ID、タイマー範囲等を検証して受入。欠落した開始情報を自動補正しない |
| v8 | 旧isReadの真偽値を検証して除去。デフォルト時間・BGM音量0.3・SE音量1・通知設定を補い、他の必須項目は補完せず、解放・購入・NT・ログ・タイマー等を保持してv14へ保存 |
| v7 | `startInfo=null`、ログの`logDate=completedDate`、デフォルト時間・BGM音量0.3・SE音量1・通知設定を追加し、旧isReadを除去してv14として検証。元の必須配列（日記・購入・告知）の欠落は破損として拒否 |
| v4/v5/v6 | 従来の互換補完に加え開始情報null・元所属日のlogDate・デフォルト時間・BGM音量0.3・SE音量1・通知設定を追加し、旧isReadを除去してv14として検証。購入・告知・日記を欠けていれば補う |
| 旧`isSideStoryUnlocked=true` | 購入済みID `[101]`へ移行 |
| v5の日記で日付欠落 | `completedAt`から読込時のローカル日付を補う。元のタイムゾーンは復元不可 |
| v0〜v3/番号なし | 旧形式の省略可能フィールドを補完。存在する不正フィールドは受け入れない。v3以降で必須だった旧isReadは型を検証後に除去する。元形式にない日記・ショップは初期値、デフォルト時間は25分 |
| v1以前のタイマー | startedAtから実集中を復元できないため累積0、停止として維持 |
| v4 | 専用のv4/v5/v6分岐が先に実行されるため、そこで不正ならlegacy経路には進まずnull |
| JSON不正、未対応バージョン、現行/旧形式の検証不合格 | parseはnull、loadはPreservedDataError。通常画面を開かず主キー原文を保護し、通常保存・移行による上書きを拒否 |

**互換動作**: 開始情報を持たない全旧タイマーは`startInfo=null`のまま再開・完了する。v1以前の旧startedAtも、元のローカル暦・開始ボタンの記録として転用しない。完了時は従来の終了日に所属させ、開始時刻は「記録なし」。開始日を現在日や再開日から推定しない。v5の日付欠落だけは従来どおりcompletedAtから補完する。既存の日付があれば移動しない。主キーは変更せず、対応旧版を読んだ時にv14へ1回保存する。移行保存の失敗時は旧原文が残り、読込エラーから再試行できる。デフォルト時間はv12以降の値を保持し、項目のないv11以前は25分とする。通知設定がないv10以前は通知時刻21:30、空白だけのユーザー名は「ゲスト」とし、有効な既存名は保持する。v11以降の通知時刻・名前はそのまま保持する。BGM音量はv13の値を保持し、v10〜v12の旧オン／オフを0.3／0へ変換し、音設定のない旧版では0.3とする。SE音量はv13以前に1を追加する。

**事実**: 有効な旧形式はload時に現行形式で保存する。不正データでは書込資格を無効にし、通常保存前にも主キーの形式を確認する。再読込または明示的初期化へ進める。初期化時だけ `@my-june/recovery/<時刻>-<乱数>` に原文を退避・照合し、主キーが変わっていないことを確認して初期値へ置換する。退避失敗は通知して中止する。自動修復/退避からのアプリ内自動復元はない。実行中の保存タイマーはProvider読込時に区間を停止へ正規化し、未確定時間を加算しない。

**事実**: 分岐IDは文字列・重複等の検証が中心で、該当話の実在分岐との照合はない。購入/告知IDも正整数・重複のみで商品カタログと照合しない。話解放と分岐進捗の整合、最終完了日とログの整合は全面的には検証しない。通常の購入APIでは実在性を再確認するが、保存データ全体の意味的整合を保証するものではない。

**検証状況**: 破損保護・退避・旧形式はメモリストレージで補助確認済み。保存済み累積を維持し未保存区間の損失を許容する方針はA04で確定。iPhoneのエラー表示/ロック/再起動等は未検証。[保持項目・検証データ・再現手順](manual-acceptance-checklist.md#record-protection)を参照。本文/価格/条件の変更ではIDを維持し、既存購入・解放をリセットしない。ID変更や削除には別途移行設計が必要。

## 静的コンテンツ

| 内容 | 保存場所・現状 |
| --- | --- |
| メイン本文 | [stories](../src/content/stories/): 全14話各2分岐の独立ファイル。[storyData.ts](../src/domain/storyData.ts)でカタログ化 |
| サイド本文 | [shop.ts](../src/content/shop.ts): 101「雨宿りの帰り道」4行、102「休憩のひととき」2行、103「雨上がり」2行 |
| 入荷条件 | [専用設定](../src/config/conversationSettings.ts): 初期101条件なし、102/103は第2話解放。[sideStory.ts](../src/domain/sideStory.ts)で共通判定、購入済みは常に可 |
| 店員会話 | [shop.ts](../src/content/shop.ts): 挨拶1行、入荷告知追加1行、退店1行。エトの立ち絵は仮アイコン |
| 表情 | [StoryCharacters](../src/components/story/StoryCharacters.tsx): 各2画像、doubtはtalkと同じ画像を使用 |
| BGM・効果音・背景 | [audioSettings.ts](../src/config/audioSettings.ts)でBGM一覧・8画面の割当・タブ押下音`assets/audio/tabs.mp3`・両音量の初期値。実行時の音量はAppStateで独立保存。[timer.tsx](../app/timer.tsx)の背景はローカル固定アセット |

**事実**: 全メインと102/103は仮本文。価格・入荷条件は専用設定で本文から分離した。本文はアプリに同梱し、CMSやサーバーから取得しない。変更はソース変更と再配布が必要。

## 認証・権限・外部サービス

| 分野 | 確認した事実・限界 | 根拠 |
| --- | --- | --- |
| 認証 | ログイン、セッション、ユーザーID、役割、サーバー認可なし | [状態型](../src/domain/common/types.ts)、[Provider](../src/state/AppStateProvider.tsx) |
| ゲーム内権限 | 保存済み解放/購入状態で画面と購入APIを制御する。NTはアプリ内ポイント。実決済なし | [メイン](../app/story.tsx)、[サイド](../app/side-story.tsx)、[Provider](../src/state/AppStateProvider.tsx) |
| データ送信 | `app/`と`src/`にfetch/axios/環境変数による業務API連携は見つからない。分析・広告・クラッシュ送信のアプリ実装なし | [依存](../package.json)、[app](../app/)、[src](../src/) |
| 端末許可要求 | 初回起動時に通知許可を要求する。拒否済みならメニューからOS設定を開く。マイク・位置情報の許可要求なし。BGMはexpo-audio | [メニュー](../app/(tabs)/menu.tsx)、[設定](../app.json) |
| 通知 | expo-notificationsによるiPhone端末内の毎日繰り返し予約。保存済みの名前・時刻に同期し、同じリマインダーを重複登録しない。iOS以外は未対応状態を表示。リモートプッシュのサーバー・トークン取得・業務データ送信は不要 | [予約処理](../src/notifications/reminderNotifications.ts)、[依存](../package.json)、[完成基準A11](completion-criteria.md#a11-毎日のローカル通知) |
| ネイティブ生成設定 | expo-audio 57.0.5のmicrophonePermission/recordAudioAndroid/enableBackgroundPlayback/enableBackgroundRecordingをfalseへ明示。introspectでマイク説明・audio背景モード・録音/背景サービス宣言なしを確認。実prebuild/製品バイナリは未検証 | [app.json](../app.json)、[ローカルプラグイン](../node_modules/expo-audio/plugin/build/withAudio.js) |
| ルーティング | URI schemeはmyjune、typedRoutes有効。URL引数でも保存済み権限を検査 | [設定](../app.json)、[メイン](../app/story.tsx)、[サイド](../app/side-story.tsx) |
| 開発サービス | Expo/npm等は開発基盤。アプリ業務データのクラウド同期とは別。配布アカウント情報は未確認 | [package](../package.json)、[開発運用手順](development-operations.md) |

ローカルプラグインへのリンクは調査環境用で、Gitに同梱されない。生成済みManifest/Info.plist・配布バイナリは確認していない。通知モジュール追加後は既存の開発ビルドを再ビルドし、iPhoneで通知許可・予約・表示を確認する。ソース上のマイク・位置情報の許可要求がないことだけで、バイナリの宣言がないとは判定しない。

**事実**: 保存はJSONであり、このコードには暗号化・署名・SecureStore・改ざん検知・サーバー残高照合を実装していない。端末OSによる保護やバックアップ挙動は本調査で検証していない。

**残る課題**: 日記の保存期間、端末変更時の移行、バックアップ、長期利用での保存サイズ・更新性能は未整備。全ログを同じJSONとして保存し、変更時に全体を検証・書き込む。録音・背景設定は無効化済みだが、製品バイナリの宣言確認は未実施。

2026-10-24 全画面maxLength監査: 全5入力にタスク80・ユーザー名40・日記1000のUTF-16単位の入力時制限を指定し、カウンタを`String.length`へ揃えた。文字数超過の画面警告は出さず、共通入力の旧超過値は現在の長さまでネイティブ上限を広げて保持・短縮する。超過中はOKと保存処理を止める。domainの日記上限検証と、ユーザー名のtrim後40 Unicodeコードポイントの互換検証を維持し、読込・移行・他項目の保存で既存の長い名前や日記を切り詰めない。schemaVersion 12・保存キー・更新順序に変更はない。[iPhone手順M44](manual-acceptance-checklist.md#input-maxlength-audit)は未実施。

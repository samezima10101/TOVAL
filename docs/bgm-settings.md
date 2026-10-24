# BGM・効果音設定と音量調整

更新日: 2026-10-24（日本時間）。対象: Expo SDK 57。BGMとタブ効果音の独立した0〜100%音量調整を実装済み、iPhoneでの表示・聴音・保存操作は未検証。

## 編集するファイル

[audioSettings.ts](../src/config/audioSettings.ts)にBGM音源一覧、画面別の割り当て、タブ効果音、初期音量（BGM30%・効果音100%）をまとめる。実行時の音量はAppStateの`bgmVolume`・`seVolume`で独立して保存する。旧`src/constants/bgm.ts`はこのファイルへ移した。

| 画面             | ルート        | 現在の音源ID |
| ---------------- | ------------- | ------------ |
| ホーム           | `/`           | default      |
| メモリー         | `/memory`     | default      |
| タイマー         | `/timer`      | default      |
| ストーリー       | `/story`      | default      |
| ログ             | `/log`        | default      |
| ショップ         | `/shop`       | non（無音）  |
| サイドストーリー | `/side-story` | non（無音）  |
| メニュー         | `/menu`       | default      |

ホーム・メモリー・ログ・メニューは`app/(tabs)/`の常設タブ。ショップはタブ外のStack画面。ヘッダーの3本線も同じ`/menu`タブへの入口とし、独立したメニュー画面や`/settings`は使用しない。グループ名はURLに含まれない。共通プレイヤーはタブ外のルートAppShellに置き、タブ切り替えで作り直さない。

現在利用できるのは`assets/audio/timer-bgm.mp3`の1曲。将来、ストーリー・タイマー・ショップ・サイドストーリーの4画面へそれぞれ別の音源を割り当てる。ホーム・メモリー・ログも独立して指定できる。

## 音源の追加と割り当て

1. 利用権を確認した音源を`assets/audio/`に配置する。既存曲の出所・利用権は今回新たに確認していない。正式追加曲の制作・購入は今回の対象外。
2. `BGM_TRACKS`へIDと静的な`require`を登録する。例: `story: { source: require("@/assets/audio/story-bgm.mp3") as AudioSource }`。この例のファイルは未配置なので、実ファイルを用意してから登録する。動的なパス文字列でrequireしない。
3. `SCREEN_BGM`の対象ルートをそのIDへ変更する。例: `"/story": "story"`。他画面の設定や画面コードを変更する必要はない。誤ったIDと対象ルートの欠落は型チェックで検出する。
4. lint・型チェック・iOS export後、同一曲の連続性、別曲への切替、背景復帰をiPhoneで確認する。設定だけの変更も同梱アセットの更新・配布が必要。

同一音源は1つの登録を共用する。`getScreenBgm`は音源を返し、未登録ルートは無音とする。モーダル・会話の進行行・クエリ引数は曲の判定に使わない。

無音にしたい画面には`"non"`を割り当てる。`BGM_TRACKS.non.source=null`は共通プレイヤーの一時停止を意味し、無音ファイルや別プレイヤーは使わない。保存済み音量も変更しない。曲のある画面へ戻ると、音量が0より大きければ同じ曲の続きから再開する。2026-10-18の指示でショップ・サイドストーリーをnonへ変更した。

2026-10-17の再生準備の変更: require登録した音源はexpo-assetで端末内へ準備し、AudioPlayerのisLoadedを待ってから再生する。空のプレイヤーへの不要なpauseを避ける。ダウンロード/読み込みは各15秒で打ち切って再試行を案内し、待機中の背景移動・オフ・画面変更では古い要求を破棄する。2026-10-18にユーザーが無音の原因はマナーモードだったと訂正。前日の変更が無音を解決したという判定はしない。[経緯と訂正](verification/bgm-2026-10-17.md#silent-playback-report)。

## 再生と音量調整

ルートの[AppShell](../app/_layout.tsx)だけが[useScreenBgm](../src/hooks/useScreenBgm.ts)を呼び、`useAudioPlayer(null)`で1プレイヤーを保持する。同じ音源ではreplace/seekをせず、別音源ではpause→replace→playとする。非同期の音声モード設定を直列化し、古い遷移・背景移動の要求は再生前に破棄する。

メニューのBGM項目で標準スライダーを使い、0〜100%を1%刻みで調整する。初期値は30%。操作中はその場で表示とプレイヤーの音量へ反映し、指を離すと`setBgmVolume`で保存する。VoiceOverなどドラッグを伴わない増減操作は変更時に保存する。0%はプレイヤーを一時停止し、0%より大きい音量へ戻すと同じ曲の続きから再開する。再生中の音量変更だけで曲をreplace/seekしない。

保存中は追加のスライダー操作を抑止する。保存失敗時は保存済みの音量へ表示・再生を戻して通知し、同じ希望値で保存を再試行できる。未保存のプレビュー値は永続化せず、購入・日記編集と同じ保存キュー／破損保全を使う。音声自体の失敗は共通バナーとコンソールへ通知し、「BGMを再試行」で現在の設定を再適用する。音声失敗によって保存済み音量を勝手に変更しない。

共通バナーの表示は[AppFrame](../src/components/common/AppFrame.tsx)が担当し、AppShellからエラーと再試行コールバックを受け取る。プレイヤーを持つフックはAppShellに残し、読み込み・復旧の表示切替でも呼び出し位置を維持する。

`playsInSilentMode=false`、`shouldPlayInBackground=false`。AppStateがactive以外なら同期的にpauseし、復帰時に現在の画面・音量を再確認する。黒画面Modalだけでは停止しない。タイマーの計測資格・停止／再開処理には接続しない。

## 音量の管理と依存

BGM音量は0〜1の有限数で保存し、各音源・画面には個別音量を持たせない。30%を表す0.3は新規データと旧オン設定の移行時の初期値であり、実行中の固定音量ではない。メニューの操作中のプレビューと保存済み音量を分け、AppShellから共通プレイヤーへ現在の音量を渡す。

`useAppState().bgmVolume`がプレビューまたは保存済みの音量を返す。AppShellは既存の`useScreenBgm(source, enabled, volume)`の署名を維持し、準備済みかつ音量が0より大きい時に有効化する。音量の反映は再生開始／音源切替とは別の処理で`player.volume`へ適用し、音量だけの変更で音声モードを再初期化しない。

標準スライダーは`@react-native-community/slider` 5.2.0を使用する（[Expo SDK 57公式資料](https://docs.expo.dev/versions/v57.0.0/sdk/slider/)）。独自のスライダー描画は追加しない。ネイティブ依存の追加を既存の開発ビルドへ反映するには再ビルドが必要。

メニューも既存曲の割り当てとし、ショップ・サイドからメニューを開くと、音量が0より大きければ再生し、戻ると無音になる。BGM音量を効果音へ流用しない。iPhoneのスライダー操作、途中で0%にした場合の再開位置、保存失敗と再試行は未検証。

## タブ押下の効果音

`TAB_PRESS_SOUND`に指定する`assets/audio/tabs.mp3`を4つのタブ（ホーム・メモリー・ログ・メニュー）の押下時に1回だけ再生する。タブレイアウトが`useTabSound(volume)`の再生関数を`tabPress`へ接続し、選択中タブの再タップでも鳴らす。プログラムによる画面遷移では鳴らさない。単一のSEプレイヤーを使い、連打時は同じ音を先頭から再生し直す。ループやタップごとのプレイヤー追加は行わない。

効果音はBGMと独立した`seVolume`を使い、`DEFAULT_SE_VOLUME=1`（初期100%）、0%で効果音だけを無音にする。`previewSeVolume(number | null)`でプレビューを設定／解除し、`setSeVolume`で保存する。メニューの「BGM音量」と「効果音音量」は同じ`VolumeSetting({ title, volume, onPreview, onSave })`とスタイルを共用し、どちらも標準スライダーの0〜100%・1%刻みとする。操作中はプレビュー、指を離すと保存し、VoiceOverなど非ドラッグの増減は変更時に保存する。失敗時は対象の音量だけを保存済み値へ戻し、同じ希望値で再試行する。両音量の検証は共通の`isValidAudioVolume`を使う。

`src/audio/audioSession.ts`の`prepareAudioSession()`をBGMとSEで共用し、BGMが0%でも`playsInSilentMode=false`・`shouldPlayInBackground=false`を適用する。SEは非アクティブ時・タブレイアウトを離れた時に停止して保留中の押下を破棄し、復帰だけでは鳴らさない。SE終了でBGMのセッションを無効化しない。

効果音の押下・音量変更でBGMの音源・音量・再生位置を変えない。BGMのマナーモード遵守・背景停止と計測の条件を維持する。今回のSE実装はタブ押下音のみとし、他の操作音・通知音や追加音源は含めない。依存追加はなく、既存のexpo-audioと標準スライダーを使う。実機のタップ・連打・聴音・VoiceOver・保存失敗は[M46](manual-acceptance-checklist.md#tab-sound-effect)で確認し、現時点は未実施。

## 保存とネイティブ設定

保存キーは`@my-june/app-state-v1`を維持し、schemaVersionは14。v13からは`seVolume=1`だけを補完し、既存のBGM音量・全データを保持する。v12以前は従来の移行に`seVolume=1`を加える。BGMはv10〜v12の旧`bgmEnabled`をtrue→0.3、false→0へ置き換え、音設定のないv9以前は0.3。v12のデフォルト時間・通知設定・名前と既存の記録・購入権利・進行中タイマー等を保持する。従来の補完・旧既読フラグ除去も維持する。現行の両音量の欠落・不正型・有限でない値・範囲外は破損として保全し、旧形式の必須音設定の欠落・不正値も補正しない。移行保存の失敗でも旧原文を上書きしない。[保存形式の詳細](data-integrations.md)を参照。

[app.json](../app.json)のexpo-audio設定は`microphonePermission`、`recordAudioAndroid`、`enableBackgroundPlayback`、`enableBackgroundRecording`をすべてfalseとする。[SDK 57公式資料](https://docs.expo.dev/versions/v57.0.0/sdk/audio/)とローカル57.0.5プラグインを照合した。設定変更のネイティブ反映には新しいアプリバイナリが必要。Expo GoやJS Reloadだけでは確認できない。

`expo config --type introspect`の仮想生成結果ではマイク説明、audio background mode、録音・背景サービス宣言なし。実際のprebuild成果物・製品バイナリは未検証。[過去の検証記録](verification/bgm-2026-10-17.md)、[BGM音量チェックリスト](manual-acceptance-checklist.md#bgm-volume)、[タブ効果音と音量チェックリスト](manual-acceptance-checklist.md#tab-sound-effect)を参照。過去のオン／オフ検証を音量調整・効果音の合格には流用しない。

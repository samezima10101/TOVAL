# BGM設定と将来の音量調整

更新日: 2026-10-19（日本時間）。対象: 工程4後半・Expo SDK 57。

## 編集するファイル

[audioSettings.ts](../src/config/audioSettings.ts)に音源一覧、画面別の割り当て、初期オン設定、共通音量をまとめる。旧`src/constants/bgm.ts`はこのファイルへ移した。

| 画面 | ルート | 現在の音源ID |
| --- | --- | --- |
| ホーム | `/` | default |
| メモリー | `/memory` | default |
| タイマー | `/timer` | default |
| ストーリー | `/story` | default |
| ログ | `/log` | default |
| ショップ | `/shop` | non（無音） |
| サイドストーリー | `/side-story` | non（無音） |

現在利用できるのは`assets/audio/timer-bgm.mp3`の1曲。将来、ストーリー・タイマー・ショップ・サイドストーリーの4画面へそれぞれ別の音源を割り当てる。ホーム・メモリー・ログも独立して指定できる。

## 音源の追加と割り当て

1. 利用権を確認した音源を`assets/audio/`に配置する。既存曲の出所・利用権は今回新たに確認していない。正式追加曲の制作・購入は今回の対象外。
2. `BGM_TRACKS`へIDと静的な`require`を登録する。例: `story: { source: require("@/assets/audio/story-bgm.mp3") as AudioSource }`。この例のファイルは未配置なので、実ファイルを用意してから登録する。動的なパス文字列でrequireしない。
3. `SCREEN_BGM`の対象ルートをそのIDへ変更する。例: `"/story": "story"`。他画面の設定や画面コードを変更する必要はない。誤ったIDと7画面の欠落は型チェックで検出する。
4. lint・型チェック・iOS export後、同一曲の連続性、別曲への切替、背景復帰をiPhoneで確認する。設定だけの変更も同梱アセットの更新・配布が必要。

同一音源は1つの登録を共用する。`getScreenBgm`は音源を返し、未登録ルートは無音とする。モーダル・会話の進行行・クエリ引数は曲の判定に使わない。

無音にしたい画面には`"non"`を割り当てる。`BGM_TRACKS.non.source=null`は共通プレイヤーの一時停止を意味し、無音ファイルや別プレイヤーは使わない。BGMオン設定も変更しない。曲のある画面へ戻ると、オンなら同じ曲の続きから再開する。2026-10-18の指示でショップ・サイドストーリーをnonへ変更した。

2026-10-17の再生準備の変更: require登録した音源はexpo-assetで端末内へ準備し、AudioPlayerのisLoadedを待ってから再生する。空のプレイヤーへの不要なpauseを避ける。ダウンロード/読み込みは各15秒で打ち切って再試行を案内し、待機中の背景移動・オフ・画面変更では古い要求を破棄する。2026-10-18にユーザーが無音の原因はマナーモードだったと訂正。前日の変更が無音を解決したという判定はしない。[経緯と訂正](verification/bgm-2026-10-17.md#silent-playback-report)。

## 再生とオン／オフ

ルートの[AppShell](../app/_layout.tsx)だけが[useScreenBgm](../src/hooks/useScreenBgm.ts)を呼び、`useAudioPlayer(null)`で1プレイヤーを保持する。同じ音源ではreplace/seekをせず、別音源ではpause→replace→playとする。非同期の音声モード設定を直列化し、古い遷移・背景移動の要求は再生前に破棄する。

ホームのスイッチは`useAppState().setBgmEnabled`へ接続する。初期値オン。保存中は連打を抑止し、保存成功後に表示と再生を変更する。失敗時は保存済み設定を維持して通知し、同じ希望値で保存を再試行できる。購入・日記編集と同じ保存キュー／破損保全を使う。音声自体の失敗は共通バナーとコンソールへ通知し、「BGMを再試行」で現在の設定を再適用する。音声失敗によってオン／オフの保存値を勝手に変更しない。

共通バナーの表示は[AppFrame](../src/components/common/AppFrame.tsx)が担当し、AppShellからエラーと再試行コールバックを受け取る。プレイヤーを持つフックはAppShellに残し、読み込み・復旧の表示切替でも呼び出し位置を維持する。

`playsInSilentMode=false`、`shouldPlayInBackground=false`。AppStateがactive以外なら同期的にpauseし、復帰時に現在の画面・保存済みオン／オフを再確認する。黒画面Modalだけでは停止しない。タイマーの計測資格・停止／再開処理には接続しない。

## 将来のメニューへの接続

現在のBGM音量は`AUDIO_VOLUMES.bgm=0.3`で従来値を維持する。各音源・画面には音量を持たせない。将来メニューで共有の音量状態を管理し、AppShellから`useScreenBgm(source, bgmEnabled, bgmVolume)`の第3引数へ渡せば、再生中の曲のvolumeにも反映する。同じ音源のreplace/seekは行わない。

SEは別の`AUDIO_VOLUMES.se=1`を予約する（SEは未実装のため従来値はなく、将来用の既定値）。BGMオン／オフをSEへ流用しない。SEプレイヤー・仮音源・保存項目は追加していない。将来の音量保存は、AppStateの項目・検証／移行・保存キューによるsetterを追加する。現在保存する音設定は`bgmEnabled`だけ。

メニュー画面、メニューを開くヘッダーアイコン、BGM/SEスライダー、音量の永続化、SE再生は後工程。ホームのスイッチを後からそのメニューへ移せる。

## 保存とネイティブ設定

保存キーは`@my-june/app-state-v1`を維持し、schemaVersionは10。v9からは`bgmEnabled=true`だけを追加し、その他の値は保持する。v8以前の移行・旧既読フラグの除去は従来どおり。既読/未読は2026-10-16に廃止済みで今回復元していない。v10の設定欠落・不正型は破損として保全する。移行保存の失敗でも旧原文を上書きしない。

[app.json](../app.json)のexpo-audio設定は`microphonePermission`、`recordAudioAndroid`、`enableBackgroundPlayback`、`enableBackgroundRecording`をすべてfalseとする。[SDK 57公式資料](https://docs.expo.dev/versions/v57.0.0/sdk/audio/)とローカル57.0.5プラグインを照合した。設定変更のネイティブ反映には新しいアプリバイナリが必要。Expo GoやJS Reloadだけでは確認できない。

`expo config --type introspect`の仮想生成結果ではマイク説明、audio background mode、録音・背景サービス宣言なし。実際のprebuild成果物・製品バイナリは未検証。[今回の検証記録](verification/bgm-2026-10-17.md)と[実機チェックリスト](manual-acceptance-checklist.md#bgm-completion)を参照。

# 開発運用手順

更新日: 2026-10-23（日本時間）。Expo SDK 57を維持する。

## 環境と依存の再現

Node 22.15.0 / npm 10.9.2を使用する。[package.json](../package.json)のengines・packageManager、[.nvmrc](../.nvmrc)、[.npmrc](../.npmrc)で指定している。Windowsでは.nvmrcだけでNodeが自動切替されないため、実行する版を先に確認する。

```powershell
node --version
npm --version
Get-Command node,npm
npm ci
npm ls --depth=0
npm run deps:check
npm run lint
npm run typecheck
npm run doctor
npm run bundle:ios
```

通常の再現にはnpm ciを使う。依存の解決版は[package-lock.json](../package-lock.json)を参照する。依存を変更する際は[AGENTS.md](../AGENTS.md)と[SDK 57の版指定ドキュメント](https://docs.expo.dev/versions/v57.0.0/)を読み、Expoパッケージはnpx expo installで導入する。package.jsonとlockを一緒に更新・確認する。

deps:checkとdoctorの全診断にはExpo APIやReact Native Directoryへの通信が必要。インストールにはnpmレジストリとキャッシュへの書き込み、バンドルにはHermesコンパイラの実行と一時ファイルの書き込みが必要となる。

## 起動とバンドル生成

```powershell
npm run start
```

通常はLANモード。同じネットワークのiPhoneから接続し、SDK 57対応のExpo Goまたは開発ビルドを使用する。

PC内だけで起動を確認する場合:

```powershell
npm.cmd run start -- --localhost --port 8081
```

このWindows環境ではnpm.ps1経由の追加引数が正しく渡らない事例があったため、追加引数を渡す場合はnpm.cmdを使う。

| スクリプト | 役割 |
| --- | --- |
| start | Expo/Metro開発サーバー |
| android / ios / web | 開発サーバーと各プラットフォーム向け起動 |
| lint / typecheck | ESLint / TypeScriptの静的検証 |
| deps:check / doctor | SDK推奨依存照合 / 固定版expo-doctorによる診断 |
| bundle:ios | dist/iosへiOS向けJS・アセット・Hermesバンドルを生成 |

bundle:iosの出力はgitignore対象。iOS向けJSの生成はネイティブコンパイル・署名・IPA生成・実機確認を含まない。android/iosスクリプトも製品ビルドを生成しない。

### 通知を検証するビルド

2026-10-22に`expo-notifications`のローカル通知と、iPhone標準の時刻入力に使う`@react-native-community/datetimepicker` 9.1.0を追加した。既存の開発ビルドには追加モジュールが含まれないため、ネイティブの開発ビルドを再ビルドしてiPhoneへ入れ直す。Metroの再起動や`bundle:ios`だけではネイティブモジュールを追加できない。SDK 57対応のExpo Goでの確認は開発補助とし、完成判定は再ビルドしたiPhone用ビルドで行う。

今回は端末内で毎日予約する通知であり、リモートプッシュのサーバー、プッシュトークン登録、APNsの配信認証情報を必要としない。通知許可は初回起動時に要求し、拒否済みの場合はメニューからiOSの設定を開く。機内モード・ロック・アプリ終了中・前景での通知、設定変更後の予約更新と重複防止は[通知の手動手順](manual-acceptance-checklist.md#daily-notifications)に従って確認する。現在の保存形式はデフォルト時間を加えたv12。既存データの移行と保存失敗の確認には、実利用とは別の専用検証端末・データを使用し、[メニュー設定の手順](manual-acceptance-checklist.md#menu-folder-settings)も確認する。

## 過去の検証と残課題

2026-10-14にlockからのクリーンインストール、開発サーバーのHTTP応答、iOS開発バンドル配信を確認した。2026-10-17はExpo 57.0.30・Router 57.0.28へ更新後、lint・型・deps:check・doctor 21/21・npm ls・iOS Hermes exportが成功。更新後のlockからのクリーンインストールは未実施。[環境・コマンド・結果](verification/bgm-2026-10-17.md)を参照する。これらは過去の結果であり、新しい変更の検証を代替しない。

2026-10-14の互換範囲内のaudit修正後も29件（High 18、Moderate 11）が残り、10/17のインストール出力でも同件数。主な起点はbraces、decode-uri-component、node-forge、uuid。SDK 57に合わない強制更新や診断の抑制は行っていない。SDK 57対応の上流修正版が出た際に依存診断とバンドルを再確認する。

## 手動検証と配布

[完成基準A01〜A11](completion-criteria.md)と[手動チェックリスト](manual-acceptance-checklist.md)を使用する。自動テストは追加・復元しない。機種、iOS、ビルド、手順、期待結果、実際の結果、実施日を記録する。PC診断や保存層の補助確認をiPhone実機の合格へ置き換えない。

WindowsではXcodeによるiOSローカル製品ビルド・シミュレーター確認を実施できない。実際の最低OS・ネイティブ権限・署名・IPA・実機起動は製品ビルドで確認する。Apple配布アカウント、アプリ識別子、ビルド方式、TestFlightのテスター範囲は未確定。EASビルド・TestFlightアップロードは未実施であり、配布準備は完成基準A09に従って進める。

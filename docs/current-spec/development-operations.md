# 開発運用手順

2026-10-17追記: 工程4後半でExpo 57.0.30・Router 57.0.28へ推奨パッチを適用し、package/lock/ローカルを同期。lint・型・deps:check・doctor 21/21・npm ls・iOS Hermes exportが成功。音声設定は録音/背景を明示的に無効化し、introspectで仮想設定を確認。実際のネイティブ成果物・製品バイナリ・iPhone回帰は未検証。自動テストは追加・復元していない。[最新の環境・コマンド・結果・制約](../verification/bgm-2026-10-17.md)、[BGM設定編集/将来接続](../bgm-settings.md)。以下の10/14の版・結果は当時の記録。

更新日・検証日: 2026-10-14（日本時間）

## 判定と参照元

Expo SDK 57を維持して、今回依頼された開発環境の整備は完了した。最終lockからの依存再現、lint、型チェック、expo-doctor、SDK依存照合、開発サーバーの応答、iOS向けバンドル生成を確認した。npm auditの残る指摘は後述する。

アプリの完成判定は[完成基準](../completion-criteria.md)を使う。既存READMEとα・β・リリース版要件は完成基準に使用しない。この記録はA10の開発環境部分の確認であり、iPhone実機での手動検証を含むA10全体、仮素材による機能完成、正式素材による最終完成の合格を意味しない。

[AGENTS.md](../../AGENTS.md)に従い、変更前に[SDK 54の指定ドキュメント](https://docs.expo.dev/versions/v54.0.0/)を読んだ。依存の判断には[SDK 57公式ドキュメント](https://docs.expo.dev/versions/v57.0.0/)と、SDK 57のExpo CLIの診断を使用した。SDK 57の公式表はReact Native 0.86、React 19.2.3、Node最低22.13.x、iOS最低16.4、Xcode最低26.4を示す。SDK 54への変更は行っていない。

## 確認した環境

| 項目 | 実際の環境 |
| --- | --- |
| OS / シェル | Windows NT 10.0.26300.0、x64 / PowerShell 7.6.6 |
| Node / npm | 22.15.0 / 10.9.2 |
| Node実行ファイル | C:\Program Files\nodejs\node.exe |
| Expo SDK / Expo | 57 / 57.0.28 |
| React Native / React / React DOM | 0.86.3 / 19.2.3 / 19.2.3 |
| TypeScript / ESLint / eslint-config-expo | 6.0.3 / 9.39.5 / 57.0.2 |
| expo-doctor / eslint-plugin-react-hooks | 1.20.4 / 7.1.1 |
| @types/node / @types/react | 22.15.35 / 19.2.18 |

Node/npmの検証済み使用版は[package.json](../../package.json)のengines・packageManagerと[.nvmrc](../../.nvmrc)に記録した。[.npmrc](../../.npmrc)のengine-strict=trueで異なる版のインストールを失敗させる。.nvmrcだけでWindowsのNodeが自動切替されるわけではない。先にNode 22.15.0とnpm 10.9.2を用意し、版と実行ファイルを確認する。別の版を採用する時は設定を更新して依存再現・診断・バンドルを再確認する。

## 不一致と修正

作業前はpackage.jsonとlockの直接依存宣言は一致していた。一方、ローカルのTypeScriptは5.9.3、eslint-config-expoは10.0.0、@types/reactは19.1.17、@types/nodeは26.1.2でlockと異なった。expo-modules-coreの直下package.jsonもなく、npm ls --depth=0はexit 1でinvalid・unmet・extraneousを報告した。削除済みテスト関連の不要なローカル依存も残っていた。

1. npm ci --no-audit --no-fundで既存lockから再構築し、古いローカル依存を解消した。
2. npm install --save-dev --save-exact expo-doctor@1.20.4 @types/node@22.15.35 --no-audit --no-fundで診断ツールを固定し、Node型定義を使用する22.15系へ合わせた。
3. オンラインのexpo install --checkは14パッケージのパッチ更新を要求し、expo-doctorはexpo-modules-coreの直接インストールも指摘した。アプリソースに直接参照がないことを確認して直接依存から削除し、npx expo install --fixでSDK 57内の推奨版へ更新した。expo-modules-core 57.0.22はExpoの間接依存として保持される。
4. npm audit fix --no-fundで依存宣言の互換範囲内を修正した。--forceや依存の除外・診断無効化・overridesは使用していない。
5. 推奨パッチ版を依存宣言にも揃え、npm install --package-lock-only --no-audit --no-fundでlockを同期した。最終lockから再度npm ci --no-audit --no-fundを実行し、exit 0（848 packages）を確認した。

最終的な直接依存は宣言範囲・lockのルート宣言・lockの解決版・ローカル版を照合して不一致0件。npm ls --depth=0もexit 0でinvalid・unmet・extraneousなし。全解決版は[package-lock.json](../../package-lock.json)を参照する。

| 更新したExpoパッケージ | 最終lock・ローカルの版 |
| --- | --- |
| expo | 57.0.28 |
| expo-asset | 57.0.19 |
| expo-audio | 57.0.5 |
| expo-constants | 57.0.21 |
| expo-font | 57.0.4 |
| expo-haptics | 57.0.3 |
| expo-image | 57.0.5 |
| expo-linking | 57.0.12 |
| expo-router | 57.0.26 |
| expo-splash-screen | 57.0.10 |
| expo-symbols | 57.0.3 |
| expo-system-ui | 57.0.4 |
| expo-web-browser | 57.0.3 |

アプリの機能・画面・保存スキーマ・ストーリーは変更していない。lint設定や既存ソースのルール抑制コメントも変更していない。従来の5件の「Hooksルールが存在しない」エラーは、正しいESLint設定とHooksプラグインの復元で解消した。

## 依存を再現する手順

リポジトリのルートで実行する。

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

期待するNode/npmは22.15.0/10.9.2。通常の再現にはnpm ciを使う。既存node_modulesを再構築し、package.jsonとlockが不一致なら失敗し、lockを更新しない。[npm 10公式手順](https://docs.npmjs.com/cli/v10/commands/npm-ci/)。今回のクリーンインストールは--no-audit --no-fund付きで実施し、auditは別途実行した。

依存を意図的に変更する時はSDK 57の版指定ドキュメントを参照し、Expo対応パッケージはnpx expo install <package>を使う。package.jsonとpackage-lock.jsonを一緒にレビューし、上記の確認を繰り返す。expo-doctorもローカルdevDependencyに固定し、npm run doctorは都度最新版をダウンロードしない。

deps:checkとdoctorの全診断にはExpo APIやReact Native Directoryへのネット接続が必要。インストールにはnpmレジストリとキャッシュへの書き込み、起動にはDevToolsキャッシュへの書き込み、バンドルにはHermesコンパイラの実行と一時ファイルの書き込みが必要になる。

## 起動とバンドル生成

```powershell
npm run start
```

通常の起動はLANモード。今回、ポート8081でサーバーを起動し、HTTP応答とiOS開発用バンドルの配信を確認した。端末接続・アプリ起動は未検証。実機接続には同じネットワーク、Windowsの接続許可、SDK 57対応のExpo Goまたは開発ビルドの確認が別途必要になる。

PC内だけで起動を確認する場合:

```powershell
npm.cmd run start -- --localhost --port 8081
```

このPowerShell環境ではnpm.ps1経由の追加引数が正しく渡らず、expo start 8081となって初回は失敗した。追加オプションを渡すWindowsコマンドではnpm.cmdを使う。localhostモードではhttp://localhost:8081が応答し、127.0.0.1への直接接続は拒否された。通常のLAN起動では127.0.0.1とmanifest内の配信URLの両方が応答した。

```powershell
npm run bundle:ios
```

expo export --platform ios --output-dir dist/iosを実行する。1510モジュール、43アセット、約3.3 MBのHermes .hbcとmetadata.jsonを生成した。出力先は既存のgitignore対象でコミットしない。バンドル生成はネイティブのコンパイル・署名・IPA生成・実機動作の確認ではない。[Expo CLI公式のexport・compileの説明](https://docs.expo.dev/more/expo-cli/#building)。

| スクリプト | 役割 |
| --- | --- |
| start | Metro/Expo開発サーバー |
| android / ios / web | 開発サーバー起動と各プラットフォーム向け起動 |
| lint | ExpoのESLint |
| typecheck | ローカルTypeScriptのtsc --noEmit |
| doctor | 固定したexpo-doctor |
| deps:check | SDK推奨依存の照合 |
| bundle:ios | iOS向けJS・アセット・Hermesバンドルの生成 |
| reset-project | テンプレート初期化用の破壊的操作。開発準備には使わない |

android/iosは製品ビルドを生成するコマンドではない。reset-projectはルートのapp/components/hooks/constants/scriptsを移動または削除し、テンプレートを生成する。端末内保存データのリセットではなく、今回実行していない。

## 検証結果

以下は最終lockをクリーンインストールした環境での結果。

| コマンド・確認 | 結果 |
| --- | --- |
| npm ci --no-audit --no-fund | exit 0、848 packages。最終lockから再現成功 |
| npm ls --depth=0 | exit 0、不正・欠損・余剰直接依存なし |
| 直接依存の宣言・lock・ローカル照合 | 不一致0件 |
| npm run deps:check | exit 0、Dependencies are up to date |
| npm run lint | exit 0、エラー・警告なし |
| npm run typecheck | exit 0、TypeScript 6.0.3で成功 |
| npm run doctor | exit 0、21/21 checks passed、No issues detected |
| npm run start | ポート8081で起動、確認後Ctrl+Cで停止 |
| GET http://127.0.0.1:8081/status | HTTP 200、packager-status:running |
| GET /（expo-platform: ios、accept: application/expo+json） | HTTP 200、SDK 57.0.0のmanifest |
| manifestのlaunchAsset.urlへのGET | HTTP 200、iOS開発用バンドル7,492,896 bytes |
| npm run bundle:ios | exit 0、Hermesバンドル・43アセット・metadata生成 |
| npm audit fix --no-fund後のaudit結果 | 29件（High 18、Moderate 11）、未解消 |
| iPhone操作 / iOS製品ビルド / TestFlight | 未検証・未実施 |

HTTP確認にはNodeのfetchを使用した。/status、上記ヘッダー付きの/、返されたlaunchAsset.urlの順にリクエストし、ステータスとバンドルのバイト数を確認した。

### 制限環境での失敗と再実行

Codexの制限環境ではnpmレジストリ/Expo APIへの通信やnpmキャッシュへの書き込みが失敗した。expo-doctorはその状態では4チェック失敗し、ネット接続を許可した再実行で実際の依存問題2件を切り分け、修正後は全21チェック成功となった。

開発サーバーは最初、dotslashのDevToolsキャッシュ作成に失敗してfallbackを使った。同じ起動を許可された権限でやり直すとそのエラーは出なかった。バンドル生成も最初はhermesc.exe: permission deniedでexit 1。同じnpm run bundle:iosを許可された権限で再実行して成功した。Hermesを無効化して成功扱いにしたものではない。

実行環境が設定するNO_COLORとFORCE_COLORの競合警告がMetroから出たが、生成とHTTP配信は成功した。インストールではuuid 7.0.3とESLint 9.39.5の非推奨警告も残っている。

## 残る依存の課題

SDK推奨依存とexpo-doctorは合格しているが、npm auditは指摘0件ではない。更新前は32件（Critical 1、High 19、Moderate 12）。互換範囲内の修正でshell-quoteを1.12.0、brace-expansionを1.1.21/5.0.12、momentを2.31.0へ更新し、29件（Critical 0、High 18、Moderate 11）へ減った。

残る主な起点はbraces、decode-uri-component、node-forge、uuid。Expo CLI/Metro、Expo Router、ネイティブ設定処理などの依存経路にも伝播している。auditが提示した強制修正にはExpo 44、Expo Router 58等への変更が含まれ、SDK 57維持条件に合わない。互換性未確認の強制変更や指摘の抑制は行っていない。今後SDK 57対応の上流修正版を確認し、依存診断とバンドルを再検証する。ESLintの非推奨警告も、SDK 57の設定との互換性を確認した更新が残る課題。

## 手動検証と完成判定

自動テストは追加・復元していない。testスクリプトも追加していない。CIは今回の作業対象に含めていない。

機能の手動検証は[手動受け入れチェックリスト](../manual-acceptance-checklist.md)と[完成基準A01〜A10](../completion-criteria.md)に従う。iPhone機種、iOS版、検証ビルド、手順、期待結果、実際の結果、実施日を記録する。保存失敗・破損・移行、ロック/他アプリへの移動と復帰、計測・報酬、購入、BGMなどの操作は今回実施していない。Web/Androidの操作・バンドルも未検証で、完成判定対象はiPhoneのみ。

Windows上ではXcodeを使うiOSのローカル製品ビルド・シミュレーター確認を実施できない。署名・IPA・製品ビルドの最低OS設定・ネイティブ権限・実機起動は未検証。配布設定やアカウント操作は行っておらず、EASビルド、TestFlightへのアップロード、公開も行っていない。

今回の環境整備成功を、仮素材での機能完成、正式素材での最終完成、TestFlightからのインストール成功に置き換えない。


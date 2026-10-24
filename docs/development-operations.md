# 開発運用手順

更新日: 2026-10-24（日本時間）。対象環境はWindows、完成判定対象はiPhone。

## 環境の再現

Node **22.15.0** / npm **10.9.2** / Expo SDK **58**を使う。指定は[package.json](../package.json)・[.nvmrc](../.nvmrc)・[.npmrc](../.npmrc)、解決版は[package-lock.json](../package-lock.json)を参照する。Windowsでは`.nvmrc`だけでNodeは自動切替されない。

```powershell
node --version
npm.cmd --version
Get-Command node,npm
npm.cmd ci
npm.cmd ls --depth=0
npm.cmd run start
```

通常はLANモード。同じネットワークのiPhoneからSDK対応のExpo Goまたは開発ビルドで接続する。PC内だけの確認は`npm.cmd run start -- --localhost --port 8081`。この環境ではnpm.ps1経由の追加引数が正しく渡らない事例があるため、追加引数を渡す際は`npm.cmd`を使う。

依存を変更する前に[Expo SDK 58の版指定ドキュメント](https://docs.expo.dev/versions/v58.0.0/)を読み、Expoパッケージは`npx expo install`で導入する。宣言とlockを一緒に更新し、SDKに合わない強制更新や診断抑制は行わない。過去の依存監査で残った指摘の解消は未確認。古い件数を現状とみなさず、依存更新時に再監査する。

## 確認コマンド

| コマンド | 用途 |
| --- | --- |
| `npm.cmd run lint` | ESLint |
| `npm.cmd run typecheck` | TypeScriptの型チェック |
| `npm.cmd run deps:check` | SDK推奨依存との照合 |
| `npm.cmd run doctor` | Expo環境診断 |
| `npm.cmd run bundle:ios` | iOS用JS・アセット・Hermesバンドルを`dist/ios`へ生成 |
| `npm.cmd run android` / `ios` / `web` | 各プラットフォーム向けの開発サーバー起動 |

コード変更時はlint・型チェックを行い、依存・設定・アセット・import構成への影響に応じて依存診断・バンドル生成も行う。文書だけの変更では参照先と内容の整合性を確認する。自動テストは追加・復元しない。

`deps:check`・`doctor`の全診断にはExpo APIやReact Native Directoryへの通信が必要。インストールにはnpmレジストリとキャッシュへの書き込み、バンドルにはHermesコンパイラーの実行と一時ファイルへの書き込みが必要になる。失敗は今回の変更・既存指摘・実行環境のどれによるものかを区別する。最新の確認結果と未解決事項は[手動チェックリスト](manual-acceptance-checklist.md)に記録する。

## iPhone向けビルド

`expo-notifications`、`@react-native-community/datetimepicker`、`@react-native-community/slider`を追加する前の開発ビルドは、ネイティブを再ビルドして端末へ入れ直す。Metro再起動・JS Reload・`bundle:ios`だけでは追加ネイティブモジュールは組み込まれない。

`dist/ios`はgitignore対象。バンドル生成はネイティブコンパイル・署名・IPA生成・実機検証を含まない。WindowsではXcodeによるiOS製品ビルド・シミュレーター検証は行えない。Expo Goでの確認は補助とし、受け入れはiPhone用ビルドで行う。

通知は端末内の毎日予約で、リモートプッシュサーバー・プッシュトークン・APNs配信認証は不要。通知許可・時刻変更・重複予約の確認は[通知手順](manual-acceptance-checklist.md#daily-notifications)、BGM・効果音は[音量手順](manual-acceptance-checklist.md#bgm-volume)を使う。

## 変更時と配布前の確認

- 変更前に既存差分と呼び出し元・保存／移行・ルートとの連携を調べ、保存済みデータと識別IDを維持する。ファイルベースのルートを通常のimport検索だけで未使用と判断しない。
- [完成基準A01〜A11](completion-criteria.md)と[手動チェックリスト](manual-acceptance-checklist.md)で回帰を確認する。保存失敗・移行には実利用とは別の専用検証データを使う。
- 機種・iOS・ビルド・実施日・手順・期待結果・実際の結果を残す。過去のPC結果や限定的なユーザー報告を、変更後のiPhoneの合格へ置き換えない。
- 正式素材・Figma反映とiPhone回帰は未完了。Apple配布アカウント、アプリ識別子、ビルド方式、TestFlightのテスター範囲は未確定で、EASビルド・TestFlightアップロードは未実施。最低OS・権限・署名・IPA起動も製品ビルドで確認する。

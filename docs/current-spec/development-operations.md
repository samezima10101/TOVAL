# 開発運用手順

## 現在の前提と環境差分

**事実**: [AGENTS.md](../../AGENTS.md)はコードを書く前にExpo SDK 54の版指定ドキュメントを読むよう指示し、[CLAUDE.md](../../CLAUDE.md)もAGENTSを参照する。今回、指定された[Expo SDK 54公式ドキュメント](https://docs.expo.dev/versions/v54.0.0/)を確認した。アプリコードは書いていない。

**事実**: READMEはSDK 54向けと書いているが、package/lockはSDK 57系。SDK 54の公式表はReact Native 0.81、React 19.1.0を対象とするため、現在の組合せをSDK 54の環境として扱えない。根拠: [公式のSDK 54版](https://docs.expo.dev/versions/v54.0.0/)、[package.json](../../package.json)、[package-lock.json](../../package-lock.json)。

| 項目 | package.json宣言 | lock | 調査時のローカル |
| --- | --- | --- | --- |
| Expo | ^57.0.17 | 57.0.20 | 57.0.20 |
| React Native | 0.86.3 | 0.86.3 | 0.86.3 |
| React | 19.2.3 | 19.2.3 | 19.2.3 |
| Expo Router | ~57.0.19 | 57.0.19 | 57.0.19 |
| TypeScript | ~6.0.3 | 6.0.3 | **5.9.3** |
| eslint-config-expo | ~57.0.2 | 57.0.2 | **10.0.0** |
| @types/react | ~19.2.10 | 19.2.18 | **19.1.17** |
| @types/node | ^26.5.0 | 26.5.0 | **26.1.2** |
| expo-modules-core | ~57.0.16 | 57.0.16 | 直下のpackage.jsonなし |

**事実**: 調査時Nodeは22.15.0、npmは10.9.2。Node/npmを固定するengines、packageManager、.nvmrc等の追跡設定はない。React Nativeのローカルpackage.jsonにはNode要件があるが、プロジェクト全体の整合は未検証。

**要確認**: SDK 57を維持するか、SDK 54を基準にするか。READMEの最低OS情報はSDK 54用なので、現在の配布対象の根拠として使わない。依存整備後に、採用したSDKの公式情報と実機で対象OS・Expo Go/開発ビルドを確定する。

## 起動コマンド

以下は[package.json](../../package.json)に実在するスクリプト。今回、サーバー起動・端末操作は実行していない。

```powershell
npm install
npm run start
```

READMEにある初期手順。既存のロックから環境を再現したい場合、**提案**として`npm ci`を使う。既存node_modulesを作り直し、package/lockの不一致があれば失敗し、ロック自体は変更しない。今回は依存を変更しない方針のため実行していない。[npm 10公式のnpm ci](https://docs.npmjs.com/cli/v10/commands/npm-ci/)。

| コマンド | スクリプト内容 | 目的 |
| --- | --- | --- |
| `npm run start` | expo start | Metro/Expo開発サーバー |
| `npm run android` | expo start --android | 開発サーバー起動とAndroid向け起動 |
| `npm run ios` | expo start --ios | 開発サーバー起動とiOS向け起動 |
| `npm run web` | expo start --web | Web開発起動 |
| `npm run lint` | expo lint | ESLint |
| `npm run reset-project` | node ./scripts/reset-project.js | アプリのソースをテンプレートへ戻す操作 |

**事実**: android/iosスクリプトは製品バイナリを作るbuildコマンドではない。WindowsでのiOSシミュレーター手順、実機接続方法、Expo Goの対応版はリポジトリ内で具体化されていない。Webは設定上`output=static`だが、公開先とビルド検証はない。根拠: [package](../../package.json)、[app.json](../../app.json)、[README](../../README.md)。

**事実**: `.env.example`は0バイトで、アプリソースに環境変数参照はない。業務機能を起動するためのAPIキーはコード上見つからない。ローカル`.env`の内容は未調査。

### reset-projectの用途

**事実**: [reset-project.js](../../scripts/reset-project.js)はルートの`app/components/hooks/constants/scripts`を、確認入力に応じてapp-exampleへ移すか削除し、新しいapp/index.tsxと_layout.tsxを生成する。現在の`src/`は対象に含まれない。端末内データのリセットや通常の開発準備コマンドではない。今回実行していない。

## 検証コマンドと今回の結果

READMEが案内するコマンド:

```powershell
npm run lint
npx tsc --noEmit
npx expo-doctor
```

| 検証 | 今回の結果 | 解釈 |
| --- | --- | --- |
| npm run lint | exit 1、5エラー | 存在しないReact Hooksルールの指定。現在のローカル環境ではlint不合格 |
| ローカルtsc --noEmit | exit 0 | 型チェック成功。ただし宣言の6.0.3ではなくローカル5.9.3で実施 |
| 直接ESLint | exit 1、同じ5エラー | `node node_modules/eslint/bin/eslint.js app src scripts eslint.config.js`で確認 |
| expo-doctor | 未実施 | 依存・SDK・ネイティブ設定の適合は未判定 |
| アプリ操作/製品ビルド | 未実施 | 画面表示、OSイベント、配布は合格判定なし |

実際の型チェックコマンドは`node node_modules/typescript/bin/tsc --noEmit`。依存ダウンロードを行わずローカル実装を明示した。

lintの内訳:

| ファイル | 見つからないルール |
| --- | --- |
| [TaskNameModal](../../src/components/home/TaskNameModal.tsx) | react-hooks/set-state-in-effect |
| [useTimerSetup](../../src/hooks/useTimerSetup.ts) | react-hooks/set-state-in-effect |
| [useStoryReader](../../src/hooks/useStoryReader.ts) | react-hooks/set-state-in-effect |
| [AppStateProvider](../../src/state/AppStateProvider.tsx) | react-hooks/set-state-in-effect |
| [useScreenBgm](../../src/hooks/useScreenBgm.ts) | react-hooks/immutability |

**推測**: ローカルeslint-config-expoとHooksプラグインの古い組合せがルール未定義に関係している。lock通りの再構築後に再判定する必要がある。ルール無効化コメントを削除するだけで正しい環境になるとは判断しない。

## テストとCI

**事実**: 現在、testスクリプト、テストファイル、Jest/Vitest等の直接テスト依存はない。直近の`dbde882`（`chore: remove test suite`）でドメイン、Repository、Provider、各画面・フックのテスト群が削除され、HEADの`319a6ae`でマージされている。追跡ファイルにGitHub Actions等のCI設定もない。根拠: [package.json](../../package.json)、Git履歴（`git show --stat dbde882`）、追跡ファイル一覧。

**要確認**: 自動テスト削除の意図。今回復元・追加はしていない。過去テストはGit履歴で参照できるが、現行挙動との一致を確認せずそのまま復元すべきとは限らない。

## 開発の作業フロー

リポジトリで決められたブランチ運用・レビュー規約・リリース規約は確認できない。以下は今回の棚卸しを使うための**改善提案**。

1. [未解決事項](open-questions.md)から対象機能の受け入れ条件を決定する。
2. 採用SDKと依存を整備し、AGENTSの版指定ドキュメントを読んだうえで実装する。
3. UIはapp/components/hooks、業務条件はdomain、共有変更はProvider、永続形式はRepositoryで確認する。
4. 永続項目の変更時はschemaVersion・移行・旧データ保持の検証をセットで扱う。
5. lint・型チェック・必要な回帰確認を実施し、変更機能の端末チェック結果を記録する。
6. 現状仕様と要件差分を更新してレビューし、配布手順が確定している場合に配布へ進む。

## 手動回帰確認の観点

すべて**未実施の確認項目**。現在の仕様を基準に、変更対象と重要度に応じて実施する。

| 分野 | 操作 | 確認する結果 |
| --- | --- | --- |
| 初回・タスク | 初回入力、空白、編集、再起動 | 必須入力、trim、名前保持、履歴を引継ぐ現行挙動 |
| 時間設定 | 0分、25分、最大値、既存セッション | 範囲、再開優先、重複セッションなし |
| 計測 | 期限前後、延長、ホーム、ロック、他アプリ、分割画面、黒画面 | 区間計測、停止/再開、黒画面の意図、秒数 |
| 強制終了・失敗 | 実行中の強制終了、停止保存/完了保存失敗 | 未確定区間の扱い、誤報酬、エラー通知、再試行 |
| 完了 | 終了連打、日記入力/空白/戻る/保存 | 二重報酬なし、入力中停止、再開、ログ1件 |
| 日付 | 0時跨ぎ、日記保存の跨ぎ、時計/タイムゾーン変更 | 完了日、日次解放、表示更新 |
| 解放 | 同日2回、別日3回、全話後も完了 | 1日最大1話、3話後もNT/ログ継続 |
| 会話 | 文字送り中タップ、初回選択、途中閉じる、再開、別分岐購入 | 全文/次行、既読、無料/60 NT、再生位置非保持 |
| ショップ | 101、2話既読後102/103、入荷告知、残高不足、二重購入、退店、サイドから戻る | 条件、単一課金、告知保持、正しい遷移 |
| ログ | 同日複数、空日記、0分、前後日/月境界 | グループ、切捨て表示、日付移動 |
| 移行 | v1/v3/v4/v5/v6/v7、欠損、JSON破損、未対応形式 | 保持項目、移行保存、回復方針 |
| BGM/Web | 消音、背景、遷移、ブラウザ自動再生・Alert | 採用プラットフォームの音と操作 |

## ビルド・リリース

**事実**: npmのbuild/deployスクリプト、`eas.json`、EAS projectId、Android package、iOS bundleIdentifier、ストア提出設定、更新配信設定、CI配布定義は追跡ファイルに見つからない。app.jsonの表示バージョンは1.0.0で、Android versionCode/iOS buildNumberの明示設定もない。署名・配布アカウント・外部での配布状況は本リポジトリから確定できない。根拠: [package](../../package.json)、[app.json](../../app.json)、[gitignore](../../.gitignore)、追跡ファイル一覧。

現時点で「この手順で製品版を出せる」と保証できるフローはない。次は**整備案**であり、既存の運用実績ではない。

1. iOS/Android/Webの公開対象と、Expo Goでの検証か開発/製品ビルドかを決める。
2. 採用SDK・OS要件・依存を確定し、正しい環境で検証を通す。
3. EAS等のビルド方式、アプリ識別子、アカウント、署名、版番号規則を設定する。
4. 生成されるネイティブ権限とBGM設定を確認し、対象実機で受け入れ確認する。
5. テスト配布・正式公開・審査資料・保存データ保護の手順を記録する。
6. 失敗時の再配布/ロールバックと、スキーマ互換の扱いを決める。

READMEに書かれた開発起動を、製品ビルドやストア公開の完了手順と混同しない。

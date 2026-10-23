# AI向け開発ガイド

## Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## プロジェクト概要

My-Juneは、1件のタスクに集中するタイマーと、完了に応じて解放される会話を組み合わせたオフラインアプリ。Expo SDK 57を使用し、今回の完成判定対象はiPhone。

タスク登録・改名、タイマーの中断・再開、NT報酬、日記とカレンダーログ、メイン14話各2分岐、サイド会話3件の購入・再生、BGMオン/オフを実装している。正式素材・Figmaデザインの反映、iPhoneでの回帰検証、TestFlight配布は未完了。実装済みと受け入れ合格を区別する。最新の状態は完成基準と検証記録で確認する。

## 開発

Node 22.15.0 / npm 10.9.2を使用する。

```bash
npm ci
npm run start
```

```bash
npm run lint
npm run typecheck
npm run deps:check
npm run doctor
npm run bundle:ios
```

環境の再現、Windowsで追加引数を渡す際のnpm.cmdの使用、起動方法、各コマンドの役割、配布の未整備項目は[開発運用手順](docs/development-operations.md)を参照する。

## 実装の参照先

| 場所 | 内容 |
| --- | --- |
| `app/` | Expo Routerの画面と共通レイアウト |
| `src/components/`・`src/hooks/` | UI部品、計測・会話・BGMのフック |
| `src/domain/` | 時間計算、完了・報酬、日記、会話・購入の判定 |
| `src/state/AppStateProvider.tsx` | 共有状態、保存キュー、保存成功後の状態反映 |
| `src/storage/appStateRepository.ts` | AsyncStorageへの保存、検証、移行、破損保全 |
| `src/content/stories/`・`src/content/shop.ts` | メイン各話、サイド会話、店員の本文 |
| `src/config/` | 会話の価格・入荷条件、BGMの割り当て・共通音量 |

## ドキュメント

| 文書 | 用途 |
| --- | --- |
| [完成基準](docs/completion-criteria.md) | 今回の仕様、対象範囲、合格条件、残作業 |
| [手動チェックリスト](docs/manual-acceptance-checklist.md) | iPhoneでの確認手順、検証用データ、実施結果 |
| [会話設定](docs/conversation-settings.md) | 本文・価格・サイド会話の入荷条件の編集 |
| [BGM設定](docs/bgm-settings.md) | 音源・画面割り当て・再生設定の編集 |
| [フォント設定](docs/font-settings.md) | UI-v3の書体・ウェイト、同梱・読み込み・適用箇所 |
| [フォルダ型テキスト枠](docs/file-textbox.md) | インデックスの比率を保つ共通背景、サイズ・本文余白の指定 |
| [キーボード編集](docs/keyboard-editor.md) | 入力欄・✕／OKバー・キーボード余白の共通部品と再利用 |
| [データ仕様](docs/data-integrations.md) | 保存項目、更新順序、旧形式の移行、破損保全 |
| [開発運用手順](docs/development-operations.md) | 環境の再現、診断、起動、バンドル生成 |
| [BGM検証記録](docs/verification/bgm-2026-10-17.md) | PC診断と実機未確認事項、無音報告の訂正履歴 |

README.mdは人間のレビュー向けのプロジェクト紹介に使用する。AI向けの指示・開発用の文書一覧はこのファイルにまとめる。仕様・完成判定は完成基準へ、確認結果はチェックリスト・検証記録へ記載する。

会話本文は[src/content/stories](src/content/stories/)の各話ファイルを直接編集する。本文・価格・条件の変更時は保存済み権利の識別IDを維持し、詳細は会話設定とデータ仕様を確認する。検証は完成基準A10に従い、自動テストは追加・復元せず、静的診断と手動チェックリストを用いる。実施していない確認を合格として記録しない。

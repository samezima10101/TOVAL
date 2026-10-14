# 全体概要

## 目的と想定ユーザー

**事実**: My-Juneは、1件の名前付きタスクに集中するタイマーと、完了による会話解放・NT獲得を組み合わせたアプリ。進捗と日記を端末内へ保存する。ログイン、サーバー同期、複数タスク管理の実装はない。根拠: [ホーム](../../app/index.tsx)、[完了処理](../../src/domain/completion.ts)、[状態型](../../src/domain/common/types.ts)、[保存処理](../../src/storage/appStateRepository.ts)。

**推測**: 勉強や日々の作業を、キャラクターの会話を楽しみながら継続したい個人が想定ユーザー。対象年齢、利用場面、成果指標はコードから確定できない。

**要確認**: 習慣化、集中時間の記録、物語体験のどれを最優先するか。現在の「完了」は成果の達成確認ではなく、設定時間を満たして保存したことを意味する。

## 現在できること

以下はすべてコードで確認できた事実。端末上の動作確認は別途必要。

| 分野 | 現状 | 根拠 |
| --- | --- | --- |
| タスク | 1件。初回入力必須、後から名前を編集。今日の完了状態と累計回数を表示 | [ホーム](../../app/index.tsx)、[入力モーダル](../../src/components/home/TaskNameModal.tsx) |
| タイマー | 初期値25分、0分〜23時間55分、5分・1時間ずつ調整。予定終了後も延長を計測 | [設定](../../src/hooks/useTimerSetup.ts)、[計測](../../src/domain/timer.ts) |
| 中断・再開 | アプリactiveかつタイマー画面focusedの場合に計測。セッションを保存して再開 | [Provider](../../src/state/AppStateProvider.tsx)、[タイマーフック](../../src/hooks/useTimerLogic.ts) |
| 完了・報酬 | 正常終了ごとに累計回数+1、実集中秒数をNTへ加算。同日の初回完了のみ次の1話を解放 | [完了処理](../../src/domain/completion.ts) |
| 日記・ログ | 終了時に任意の日記を入力し、完了ごとの集中時間をカレンダーから閲覧 | [日記](../../src/components/timer/DiaryModal.tsx)、[ログ](../../app/log.tsx) |
| メイン会話 | 全3話。文字送り、途中タップで全文表示、第1話に2分岐。初回選択は無料、別分岐は60 NT | [本文](../../src/domain/storyData.ts)、[読取フック](../../src/hooks/useStoryReader.ts)、[Provider](../../src/state/AppStateProvider.tsx) |
| メモリー | 解放したメイン会話を再生。タイトル・話数・解放日を表示 | [メモリー](../../app/memory.tsx) |
| ショップ | 店員の挨拶・退店会話、サイド会話3件を各60 NTで購入・再生。うち2件は第2話の読了後に入荷 | [ショップ](../../app/shop.tsx)、[商品](../../src/content/shop.ts)、[入荷条件](../../src/domain/sideStory.ts) |
| BGM | 全7ルートに同一ローカル音源を割当、音量0.3、ループ。消音スイッチ下での再生設定あり | [BGM定義](../../src/constants/bgm.ts)、[再生](../../src/hooks/useScreenBgm.ts) |
| 省電力表示 | タイマー上の黒画面モーダル。タップで復帰し、画面フォーカスを維持して計測を続ける | [タイマー画面](../../app/timer.tsx) |

## 構成と責務

| 場所 | 責務 |
| --- | --- |
| [app](../../app/) | Expo Routerの7画面と共通レイアウト |
| [src/components](../../src/components/) | 入力・日記・ログなどのモーダル、会話・カード・ボタンの表示 |
| [src/hooks](../../src/hooks/) | タイマーの画面ライフサイクル、設定、文字送り、BGM |
| [src/domain](../../src/domain/) | 日付、時間計算、完了条件、ストーリーと入荷判定 |
| [src/content/shop.ts](../../src/content/shop.ts) | サイド会話、店員会話、価格の静的定義 |
| [AppStateProvider](../../src/state/AppStateProvider.tsx) | 共有状態、状態変更の直列化、保存後の画面反映 |
| [appStateRepository](../../src/storage/appStateRepository.ts) | AsyncStorageの単一JSON、入力検証、旧形式の移行 |
| [assets](../../assets/) | 立ち絵4枚、タイマー背景、BGM、アプリアイコン等 |

**事実**: アプリの永続状態はProviderで共有。表示の一時状態（設定モーダル、文字送り位置、日記下書き、ショップの会話段階など）は各画面・フックに保持し、永続化しない。

## 実装と既存文書の差分

| 項目 | 既存記述 | 現状の事実 | 根拠 |
| --- | --- | --- | --- |
| Expo | README/AGENTSはSDK 54を前提 | package.jsonは`^57.0.17`、lockとローカルは57.0.20 | [README](../../README.md)、[AGENTS](../../AGENTS.md)、[package](../../package.json)、[lock](../../package-lock.json) |
| ログ | READMEはモックのみ・永続状態未接続 | `diaryLogs`の実記録を表示、完了時に保存 | [ログ](../../app/log.tsx)、[完了](../../src/domain/completion.ts) |
| ショップ | READMEは立入禁止のプレースホルダー。β/リリース要件にも「実装なし」 | 入荷・購入・NT消費・再生・店員会話を実装 | [ショップ](../../app/shop.tsx)、[Provider](../../src/state/AppStateProvider.tsx) |
| 文字送り・分岐 | READMEでは残課題 | 53ms/文字、第1話の2分岐、追加分岐60 NTを実装 | [読取フック](../../src/hooks/useStoryReader.ts)、[本文](../../src/domain/storyData.ts) |
| 最小時間 | αは0分可、β/リリースは5分以上 | 現在も0分可。デバッグ専用の環境制限なし | [設定モーダル](../../src/components/home/TimerSetupModal.tsx)、[Provider](../../src/state/AppStateProvider.tsx) |
| 完了リセット | αは翌日0時。β/リリースは0時か24時間後が未決 | ローカル日付と`lastCompletionDate`を描画時に比較。24時間方式ではない | [ホーム](../../app/index.tsx)、[日付](../../src/domain/common/date.ts) |
| 話数 | α3話、β14話、リリース60話 | メイン3話、サイド3件。第2・3話に分岐なし | [本文](../../src/domain/storyData.ts)、[商品](../../src/content/shop.ts) |
| ユーザー名 | 要件に名前とヘッダー表示あり | 保存項目はあるが初期値空。入力・更新・表示UIなし | [型](../../src/domain/common/types.ts)、[保存](../../src/storage/appStateRepository.ts)、[レイアウト](../../app/_layout.tsx) |
| ログの時刻 | β要件は「タイマー起動時間」 | 保存・表示するのは終了ボタンを押した時刻。開始時刻やタスク名はログに残らない | [タイマーフック](../../src/hooks/useTimerLogic.ts)、[完了](../../src/domain/completion.ts)、[ログ表示](../../src/components/log/LogModal.tsx) |
| リリース機能 | 休憩・BGM/環境音/背景の設定と購入・会話オート | 固定BGM/背景のみ。休憩・設定/購入・会話オートは未実装 | [タイマー](../../app/timer.tsx)、[BGM](../../src/constants/bgm.ts)、[読取フック](../../src/hooks/useStoryReader.ts) |

**要確認**: α・β・リリースのどれが現在の受け入れ基準か。「β未完了」は妥当でも、どの未実装が必要かは計画の決定が必要。[未解決事項](open-questions.md)で整理する。

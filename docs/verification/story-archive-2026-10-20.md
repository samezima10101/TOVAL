# ショップ・メモリー一覧の検証記録

実施日: 2026-10-20（日本時間）。対象: A06・A07・M36。

## 実装範囲

ユーザーの提供画像と「番号で章を選び、左リストで章内の話を選ぶ」という追加回答に従い、`StoryArchive`に左の縦リスト、右上の3列の章グリッド、右下の詳細・購入／再生カードをまとめた。ショップは銀色、メモリーは紫系。短い画面では全体を縦にスクロールし、長い章内リストは左側でもスクロールする。

章設定は`src/config/storyArchive.ts`へ分離。現在のメイン14話とサイド3件は各画面のChapter 1へ置き、Chapter 2〜8は空の準備中とした。正式な章分けは未受領。番号は章内の表示順であり、保存済み話ID・購入IDは変更していない。価格・入荷・購入・保存失敗・再生・退店の既存処理を接続しているが、変更後の操作回帰は未実施。

番号の実体は`assets/numbers/`にあった。提供ファイル名と字形の対応は次のとおり。元ファイルは編集していない。

| 表示 | 提供ファイル |
| --- | --- |
| 01 | `shop_chapter_07.svg` |
| 02 | `shop_chapter_02.svg` |
| 03 | `shop_chapter_03.svg` |
| 04 | `shop_chapter_05.svg` |
| 05 | `shop_chapter_06.svg` |
| 06 | `shop_chapter_09.svg` |
| 07 | `shop_chapter_01.svg` |
| 08 | `shop_chapter_04.svg` |

提供SVGのパスを再利用して09〜14と詳細カード用の輪郭版01〜14を追加し、PCで一覧画像に描画して数字・欠け・線を目視確認した。09の9は6の字形を180度回転して補完。端末でのデコード・細い線の表示は未確認。

実装前に[Expo SDK 57の版指定資料](https://docs.expo.dev/versions/v57.0.0/)と[Image](https://docs.expo.dev/versions/v57.0.0/sdk/image/)・[LinearGradient](https://docs.expo.dev/versions/v57.0.0/sdk/linear-gradient/)を確認した。アプリの依存・保存スキーマは変更していない。自動テストは追加・復元していない。

## PC診断

環境: Windows、Node 22.15.0 / npm 10.9.2、Expo ~57.0.30、React Native 0.86.3。

| 確認 | 結果 |
| --- | --- |
| `npm.cmd run lint` | 成功 |
| `npm.cmd run typecheck` | 成功 |
| `npm.cmd run deps:check` | 成功。推奨依存と一致 |
| `npm.cmd run doctor` | 21/21成功 |
| `npm.cmd run bundle:ios` | 成功。Hermes JS・同梱SVGを`dist/ios`へ出力 |
| `git diff --check` | 成功 |
| 番号素材01〜14・輪郭版のPC描画 | 実施。アプリ画面の表示確認ではない |
| アプリ画面のブラウザー確認 | 未実施。接続可能なブラウザーがないため |
| iPhoneの表示・購入・再生・退出・VoiceOver | 未実施 |

初回の型診断でReact Native 0.86の`StyleSheet.absoluteFillObject`削除を検出し、`StyleSheet.absoluteFill`へ修正した。制限付き実行ではExpo API通信とHermes実行が拒否されたため、許可付きで再実行し、依存診断・Doctor・iOS exportの成功を確認した。

## 未完了

正式な章分け、紹介文の正式な要約、iPhoneでのレイアウト・SVG表示・章切り替え・長い一覧・文字拡大・購入／再生／退店の回帰確認は未完了。[M36の手動手順](../manual-acceptance-checklist.md#story-archive)で確認し、PC診断だけでA06/A07全体の合格とはしない。iOS exportはネイティブビルド・署名・TestFlight配布を含まない。

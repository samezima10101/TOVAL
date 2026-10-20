# PrimaryButtonの六角形デザイン・検証記録

実施日: 2026-10-20（日本時間）。ユーザー提供のタイマー画面にある「スタート」を参考に、指定のhex_button.svgを使って共通PrimaryButtonを変更した。

## 変更内容

- `src/components/common/PrimaryButton.tsx`: 背景に既存の`assets/images/hex_button.svg`をexpo-imageで表示。SVGは変更せず、画像をタップ・読み上げ対象から外す。角丸背景・影を削除し、標準幅222・最小高さ65、中央配置、白い太字・字間2に変更。親幅を超えない最大幅と長文の折り返しを設定する。長文や文字サイズ拡大で高さが増える場合は画像も表示領域に合わせて伸縮する。
- loading中はラベルのレイアウトを残して透明化し、中央へインジケーターを重ねる。disabled／loading時の操作抑止・半透明化・アクセシビリティ状態を維持する。
- ホームの開始とタイマーの終了ボタンの全幅指定を削除し、共通の標準幅を使う。不要になったタイマーのfinishButtonスタイルも削除した。

ボタンのラベル・イベント・保存・計測・会話処理・依存は変更していない。自動テストは追加・復元していない。[Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/)と[expo-image](https://docs.expo.dev/versions/v57.0.0/sdk/image/)の版指定資料を実装前に確認した。

## 検証結果

環境: Windows、Node v22.15.0 / npm 10.9.2。作業開始時のgit statusはクリーンだった。

| 確認 | 結果 |
| --- | --- |
| `npm.cmd run lint` | exit 0、エラー・警告なし |
| `npm.cmd run typecheck` | exit 0 |
| `npm.cmd run bundle:ios` | Hermesの実行権限を付けてexit 0。1566 modules・55 assetsのiOS Hermesバンドルを`dist/ios`へ生成し、hex_button.svgの同梱を一覧で確認 |
| `git diff --check` | exit 0 |
| 差分・参照確認 | PrimaryButtonとホーム／タイマーの幅指定、仕様・チェックリスト・本記録のみ変更。削除したfinishButtonスタイルの参照なし。hex_button.svg自体は変更なし |
| deps:check / doctor | 今回は未実施。依存・設定の変更なし |
| UI・iPhone実機・製品ビルド | 未実施。UI確認用のブラウザー／アプリ一覧は空で、プレビューを操作できなかった |

画像の同梱と型・バンドル解決を確認した。実際のボタンの描画、折り返しと処理中の表示切替を確認済みとはしていない。

## 残る手動確認

[共通PrimaryButtonの確認手順](../manual-acceptance-checklist.md#primary-button)をiPhoneで実施する。特に長文・文字サイズ拡大・狭い画面・保存中のサイズ維持・再試行ボタンの配置を確認する。PC診断・バンドル生成の成功を実機の受け入れ合格にはしない。

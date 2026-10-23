# キーボード編集の共通部品

更新日: 2026-10-23（日本時間）。ログ詳細で利用。メニュー画面への適用は今後の画面変更時に行う。

`src/components/common/KeyboardEditor.tsx`に表示・入力設定をまとめる。下書き・入力検証・保存・エラー処理・キャンセルの意味は利用する画面で管理する。

- `useKeyboardEditor()`はキーボード位置を監視し、`toolbarBottom`と`contentBottomInset`を返す。全画面Modal内で使い、編集中は親の下余白へ`contentBottomInset`を確保する。キーボードを閉じてもSafe Area上に操作バーを残す。
- `KeyboardEditorInput`は自動フォーカス・複数行・入力欄内部のスクロールを共通化する。通常は親に高さを与え、入力欄へ`flex: 1`の領域を確保する。メモ位置で行数に応じて伸ばす場合は`autoGrow`を指定する。入力欄と同じ幅・書体・行高・余白を持つ非表示のTextを`onTextLayout`で測り、折り返し・改行に合わせて最小46から`maxInputHeight`まで高さを増やす。末尾の空行も測るため、計測専用の文字列にゼロ幅文字を付ける（保存する本文には加えない）。TextInput自身のcontentSize通知は高さ計算に使用しない。上限を超えると入力欄内部のスクロールへ切り替える。外側のScrollViewと併用する場合は、その実際の表示高から上限を決める。ログでは標準文字で3行分の94を上限の下限とする。フォーカス・入力欄のレイアウト変更・キーボード表示後に入力欄を見える位置へスクロールする。折り返し・改行・選択位置の変更はネイティブ入力欄のカーソル追従を使い、日本語変換中に選択位置を上書きしない。単一行は`multiline={false}`で指定できる。
- `KeyboardEditorToolbar`は左の✕、右のOK、任意の中央`status`を表示する。`bottom`に`toolbarBottom`、保存中に`busy`、保存可否に`saveDisabled`を渡す。`onCancel`・`onSave`と読み上げ用の`cancelLabel`・`saveLabel`を画面側で指定する。保存中の二重実行防止は保存処理側でも行う。

ログではエピソード・集中時間・開始時刻・他のメモを維持し、選んだメモの本文だけを`autoGrow`の入力欄へ置き換える。MEMO:はその上に残す。文字数は操作バー中央へ置き、保存エラーは対象入力欄の下に表示する。保存失敗では下書きを保持し、入力欄へ再フォーカスする。保存成功またはキャンセルで`Keyboard.dismiss()`を呼び、閲覧用一覧へ戻る。

ログの外側のスクロールは、入力欄とScrollView表示領域を`measureInWindow`で同じ座標系で測り、現在のスクロール位置に隠れている分だけ加減して移動する。既に見えていれば動かさない。`scrollResponderScrollNativeHandleToKeyboard`は内部計算が画面全体のScrollViewを前提とするため、フォルダ内では使用しない。フォーカス・入力欄／表示領域のレイアウト変更・内容高の変更・キーボード表示完了後に再計測し、直前の古い計測は破棄する。

メニューのユーザー名などへ使う場合も、保存処理は既存の設定更新を呼ぶ。日記保存用の識別子や文字数上限を共通部品へ持ち込まない。今回、メニュー自体の表示・操作は変更していない。

SDK 57 / React Native 0.86を使用。[TextInput](https://reactnative.dev/docs/0.86/textinput#scrollenabled)・[Keyboard](https://reactnative.dev/docs/0.86/keyboard)を参照。新しい依存は追加しない。実機でのカーソル追従・日本語変換・予測候補・長文の途中編集・文字拡大は未検証。[手動確認](manual-acceptance-checklist.md#calendar-log-design)で確認する。

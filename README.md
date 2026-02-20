# Page Image Saver（Chrome拡張 / Manifest V3）

現在開いているWebページ内の画像URLを収集し、ローカルへ保存するChrome拡張です。

## 対応機能

- `img` タグの `src` を取得
- lazy load 属性 `data-src`, `data-original` を取得
- CSS `background-image` のURLを取得
- 重複URLを除外
- ポップアップの「画像を保存」ボタンで一括保存
- `chrome.downloads` APIでダウンロード
- 保存先ファイル名は `images/` 配下

## ファイル構成

- `manifest.json`（拡張機能の権限・読み込み設定を定義）
- `popup.html`（ポップアップUIの構造と見た目を定義）
- `popup.js`（保存ボタン押下時の制御とダウンロード処理を実行）
- `content.js`（対象ページから画像URLを収集してpopupへ返却）

## セットアップ手順

1. Chromeで `chrome://extensions/` を開く
2. 右上の「デベロッパーモード」をONにする
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. 本フォルダ（`20260220_image-save_chrome`）を選択

## 使い方

1. 画像を保存したいページを開く
2. 拡張アイコンをクリック
3. 「画像を保存」ボタンを押す
4. ダウンロードが開始され、`images/` フォルダ名で保存される

## 補足

- サイト側の制約（認証やCORS、期限付きURLなど）により、一部画像が保存できない場合があります。
- その場合はポップアップの結果で失敗件数が表示されます。

# manifest.json 対応表（コメント代替）

このファイルは `manifest.json` に直接コメントを書けないため、
キーの意図を3層（概要・インライン説明・要素解説）で整理した対応表です。

## ● manifest_version（マニフェスト仕様バージョン）

| JSON Path | 値（例） | インライン説明 |
|---|---|---|
| `$.manifest_version` | `3` | Manifest V3 として拡張機能の仕様を定義する |

- manifest_version: 拡張機能マニフェストの仕様バージョンを示す必須キー
- 3: Service Worker ベースの拡張仕様（Manifest V3）を利用する値

## ● name / version / description（拡張機能の基本情報）

| JSON Path | 値（例） | インライン説明 |
|---|---|---|
| `$.name` | `Page Image Saver` | 拡張機能の表示名を定義する |
| `$.version` | `1.0.0` | リリース管理に使うバージョン番号を定義する |
| `$.description` | `現在開いているページ内の画像URLを収集して保存します。` | 機能説明文を定義する |

- name: 拡張機能一覧や詳細画面に表示される名称
- version: 更新配布時のバージョン比較に使われる値
- description: ユーザーに提示する拡張機能の概要説明

## ● permissions（必要権限の定義）

| JSON Path | 値（例） | インライン説明 |
|---|---|---|
| `$.permissions[0]` | `activeTab` | アクティブタブへの一時アクセスを許可する |
| `$.permissions[1]` | `scripting` | タブへのスクリプト注入機能を許可する |
| `$.permissions[2]` | `downloads` | ダウンロード機能の利用を許可する |

- permissions: 拡張機能が利用するAPI権限を列挙する配列
- activeTab: ユーザー操作中のタブに限定したアクセス権限
- scripting: `chrome.scripting.executeScript` を利用するための権限
- downloads: `chrome.downloads.download` を実行するための権限

## ● action（ツールバーUIの設定）

| JSON Path | 値（例） | インライン説明 |
|---|---|---|
| `$.action.default_popup` | `popup.html` | クリック時に開くポップアップ画面を指定する |
| `$.action.default_title` | `画像保存` | ツールチップ表示用タイトルを指定する |

- action: ブラウザツールバーの拡張機能UI設定をまとめるオブジェクト
- default_popup: ユーザー操作時に表示するHTMLファイル
- default_title: アイコンホバー時に表示される補助テキスト

## ● content_scripts（自動注入スクリプト設定）

| JSON Path | 値（例） | インライン説明 |
|---|---|---|
| `$.content_scripts[0].matches[0]` | `<all_urls>` | すべてのURLを注入対象として指定する |
| `$.content_scripts[0].js[0]` | `content.js` | 注入するスクリプトファイル名を指定する |
| `$.content_scripts[0].run_at` | `document_idle` | DOM構築後のタイミングで実行する |

- content_scripts: ページに自動注入するスクリプト条件を定義する配列
- matches: どのURLパターンを対象にするかを定義
- js: 注入されるJavaScriptファイルの一覧
- run_at: スクリプト実行タイミング（`document_idle` は読み込み後の安定タイミング）

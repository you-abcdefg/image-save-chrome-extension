// ●ポップアップで使うDOM要素を取得する
const saveBtn = document.getElementById("saveBtn"); // 画像保存を開始するボタン要素を取得
// saveBtn: 画像保存処理を開始するボタン要素
const statusEl = document.getElementById("status"); // 実行結果を表示する領域を取得
// statusEl: 実行状況や結果を表示する要素

// ●ステータスメッセージを表示する
function setStatus(message) {
  statusEl.textContent = message; // ステータス表示文字列を更新
  // statusEl.textContent: 画面へ表示するメッセージ本体
}

// ●拡張機能が実行可能なURLか判定する
function isSupportedPageUrl(url) {
  if (!url) { // URL未取得は対象外
    // if: URLが未定義または空かを判定する条件分岐
    return false; // 実行不可として返す
    // return: 未対応URL判定の結果を返す
  }
  return /^(https?:|file:)/.test(url); // 許可スキームに一致するか判定
  // return: 実行可否の真偽値を返す
}

// ●URLから保存用ファイル名を作る
function makeFileName(url, index) {
  try {
    // try: URL解析失敗時にフォールバックするための処理ブロック
    const parsed = new URL(url); // URLオブジェクトへ変換
    // parsed: 分解済みURL情報を保持する変数
    const rawName = parsed.pathname.split("/").pop() || "image"; // パス末尾を候補名として取得
    // rawName: パス末尾の元ファイル名候補

    const cleanName = rawName.split("?")[0].split("#")[0]; // クエリとハッシュを除去
    // cleanName: 表示用に整形したファイル名
    const hasExt = /\.[a-zA-Z0-9]{2,5}$/.test(cleanName); // 拡張子有無を判定
    // hasExt: ファイル名末尾に拡張子が存在するかの真偽値

    const fallbackName = `image_${String(index + 1).padStart(3, "0")}.jpg`; // 代替ファイル名を生成
    // fallbackName: 拡張子不明時に使う連番ファイル名
    const fileName = hasExt ? cleanName : fallbackName; // 最終ファイル名を選択
    // fileName: ダウンロードに使用する確定ファイル名

    return fileName; // 生成したファイル名を返す
    // return: 保存用ファイル名を返却する
  } catch {
    // catch: URL解析失敗時のフォールバック処理ブロック
    return `image_${String(index + 1).padStart(3, "0")}.jpg`; // 失敗時も保存可能な名前を返す
    // return: 代替ファイル名を返却する
  }
}

// ●現在のアクティブタブを取得する
async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true }); // 現在ウィンドウのアクティブタブを検索
  // tabs: 条件一致したタブ一覧を保持する配列
  return tabs[0]; // 先頭タブを返す
  // return: 現在アクティブなタブ情報を返却する
}

// ●content scriptへ画像取得要求を送信する
async function requestImagesFromTab(tabId) {
  try {
    // try: 送信失敗時に自動注入リトライへ分岐する処理ブロック
    return await chrome.tabs.sendMessage(tabId, { action: "GET_IMAGES" }); // content scriptへ取得要求を送る
    // return: content script からの応答オブジェクトを返却する
  } catch (error) {
    // catch: メッセージ送信失敗時の例外処理ブロック
    const message = error?.message || ""; // エラーメッセージを安全に取り出す
    // message: 例外メッセージ文字列を保持する変数

    if (message.includes("Receiving end does not exist")) { // 受信側未接続エラーを判定
      // if: content script 未接続エラーかを判定する条件分岐
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ["content.js"]
      }); // content script を対象タブへ注入
      // executeScript: 指定スクリプトをタブへ動的注入するAPI

      return await chrome.tabs.sendMessage(tabId, { action: "GET_IMAGES" }); // 注入後に再送信
      // return: 再試行した取得結果を返却する
    }

    throw error; // 想定外エラーは呼び出し元へ再送出
    // throw: 上位で統一的にエラー処理させる
  }
}

// ●保存ボタン押下でページ内画像を一括ダウンロードする
saveBtn.addEventListener("click", async () => {
  saveBtn.disabled = true; // 二重実行を防ぐためボタンを無効化
  // saveBtn.disabled: ユーザー操作可否を制御する状態値
  setStatus("画像URLを収集中..."); // 処理開始メッセージを表示
  // setStatus: ポップアップ内の状態表示を更新する関数

  try {
    // try: 一連の保存処理で発生する例外を捕捉する処理ブロック
    const tab = await getActiveTab(); // アクティブタブ情報を取得
    // tab: 現在の対象タブ情報
    const tabId = tab?.id; // タブIDを取り出す
    // tabId: Chrome API呼び出しに使う対象タブID

    if (!tabId) { // タブID未取得なら処理継続不可
      // if: タブIDが有効かどうかを判定する条件分岐
      throw new Error("アクティブタブが取得できませんでした。"); // 明示的に例外を投げる
      // throw: 処理不能エラーを上位処理へ通知する
    }

    if (!isSupportedPageUrl(tab.url)) { // 実行可能URLか判定
      // if: 対応スキームのURLかを判定する条件分岐
      setStatus("このページでは実行できません。\nhttp/https のページでお試しください。"); // 実行不可理由を表示
      // setStatus: 実行不可時の案内メッセージを表示する
      saveBtn.disabled = false; // 早期終了前にボタンを再有効化
      // saveBtn.disabled: 操作可能状態へ戻す
      return; // このケースの処理を終了
      // return: 以降の保存処理を中断する
    }

    const response = await requestImagesFromTab(tabId); // content scriptから画像一覧を取得
    // response: content script 応答データを保持する変数
    const imageUrls = response?.imageUrls || []; // 取得結果を配列として受け取る
    // imageUrls: 保存対象の画像URL配列

    if (imageUrls.length === 0) { // 取得件数0件なら終了
      // if: 保存対象が存在するかどうかを判定する条件分岐
      setStatus("画像が見つかりませんでした。"); // 検出なしメッセージを表示
      // setStatus: 画像未検出時の結果表示を更新する
      saveBtn.disabled = false; // 早期終了前にボタンを再有効化
      // saveBtn.disabled: 操作可能状態へ戻す
      return; // 処理を終了
      // return: ダウンロード処理へ進まず終了する
    }

    setStatus(`${imageUrls.length}件の画像を保存中...`); // 進捗メッセージを表示
    // setStatus: 保存件数を含む進捗表示を更新する

    let successCount = 0; // 成功件数カウンタを初期化
    // successCount: ダウンロード成功件数を保持する変数
    let failCount = 0; // 失敗件数カウンタを初期化
    // failCount: ダウンロード失敗件数を保持する変数

    for (let i = 0; i < imageUrls.length; i++) { // 配列を順番に処理
      // for: 画像URLを先頭から末尾まで反復するループ
      const url = imageUrls[i]; // 現在対象のURLを取り出す
      // url: 現在処理中の1件分画像URL
      const fileName = makeFileName(url, i); // 保存ファイル名を生成
      // fileName: 現在URLに対応する保存ファイル名

      try {
        // try: 個別ダウンロード失敗時も次件へ進むための処理ブロック
        await chrome.downloads.download({
          url,
          filename: `images/${fileName}`,
          conflictAction: "uniquify",
          saveAs: false
        }); // 画像を images/ 配下へ保存
        // downloads.download: ダウンロードを開始するChrome API
        successCount++; // 成功件数を加算
        // successCount: 成功カウンタを1増やす
      } catch (error) {
        // catch: 個別ダウンロード失敗時の例外処理ブロック
        console.error("ダウンロード失敗:", url, error); // 失敗詳細をコンソールへ出力
        // console.error: エラー情報を開発者向けに記録する
        failCount++; // 失敗件数を加算
        // failCount: 失敗カウンタを1増やす
      }
    }

    setStatus(
      `保存完了\n成功: ${successCount}件\n失敗: ${failCount}件\n保存先: images/`
    ); // 最終結果を表示
    // setStatus: 成功/失敗件数と保存先をユーザーへ通知する
  } catch (error) {
    // catch: 予期しない失敗を最終的に処理する例外ブロック
    console.error(error); // 例外内容をコンソールへ出力
    // console.error: デバッグ用に詳細エラーを記録する
    setStatus(`エラー: ${error.message}`); // エラーメッセージをUIへ表示
    // setStatus: 例外発生時の通知メッセージを表示する
  } finally {
    // finally: 成否に関係なく必ず実行される後処理ブロック
    saveBtn.disabled = false; // ボタンを再有効化
    // saveBtn.disabled: 次回実行できる状態に戻す
  }
});

// ●画像URLを保存向けに絶対URLへ正規化する
function toAbsoluteUrl(url) {
  if (!url) { // URL未指定は無効値として扱う
    // if: URLが未設定かどうかを判定する条件分岐
    return null; // 無効URLとして処理対象から除外する
    // return: 無効値 null を返して処理を終了する
  }

  const trimmed = url.trim(); // 前後空白を除去した文字列を作成
  // trimmed: 前後空白を除去したURL文字列を保持する変数
  if (!trimmed) { // 空文字になったURLは除外する
    // if: 空文字URLかどうかを判定する条件分岐
    return null; // 空URLは保存対象にしない
    // return: 無効値 null を返して処理を終了する
  }

  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) { // data/blob URLはそのまま使用
    // if: data URL / blob URL かどうかを判定する条件分岐
    return trimmed; // 既に利用可能な形式として返却
    // return: 正規化不要のURL文字列を返す
  }

  try {
    // try: URL生成で例外が出る可能性がある処理を実行する
    return new URL(trimmed, document.baseURI).href; // 相対URLを絶対URL化して返す
    // return: 絶対URL文字列を返す
  } catch {
    // catch: URL生成失敗時のフォールバック処理
    return null; // 不正URLは除外する
    // return: 無効値 null を返す
  }
}

// ●background-image 文字列から画像URLを抽出する
function extractBackgroundImageUrls(backgroundImageValue) {
  const urls = []; // 抽出したURLを蓄積する配列を初期化
  // urls: background-image から抽出したURL一覧を保持する配列

  if (!backgroundImageValue || backgroundImageValue === "none") { // 背景画像指定なしは早期終了
    // if: 値未設定または none かどうかを判定する条件分岐
    return urls; // 空配列を返す
    // return: 抽出結果なしとして空配列を返す
  }

  const regex = /url\((['"]?)(.*?)\1\)/g; // url(...) 形式を抽出する正規表現
  // regex: background-image からURLを取り出すパターン
  let match; // 正規表現一致結果の受け皿
  // match: regex 実行ごとの一致結果を保持する変数

  while ((match = regex.exec(backgroundImageValue)) !== null) { // 一致が続く限り抽出を繰り返す
    // while: 正規表現一致中に繰り返し処理するループ
    const rawUrl = match[2]; // キャプチャした生URL文字列を取得
    // rawUrl: background-image から取り出した元URL文字列
    const absoluteUrl = toAbsoluteUrl(rawUrl); // 保存用に正規化する
    // absoluteUrl: 正規化後URLを保持する変数
    if (absoluteUrl) { // 正規化に成功したものだけ採用
      // if: 有効なURLかどうかを判定する条件分岐
      urls.push(absoluteUrl); // 結果配列へ追加
      // push: 配列末尾へ要素を追加するメソッド
    }
  }

  return urls; // 抽出結果を呼び出し元へ返す
  // return: URL配列を返す
}

// ●ページ全体から画像URLを重複排除して収集する
function collectImageUrls() {
  const urlSet = new Set(); // 重複排除のためSetで管理
  // urlSet: 重複を除いてURLを蓄積する集合

  const imgElements = document.querySelectorAll("img"); // img要素をすべて取得
  // imgElements: ページ内の全img要素ノード一覧
  imgElements.forEach((img) => {
    // forEach: 各img要素ごとに候補URLを評価する繰り返し
    const candidates = [
      img.getAttribute("src"),
      img.getAttribute("data-src"),
      img.getAttribute("data-original"),
      img.currentSrc
    ]; // 実装差分を吸収する候補属性リスト
    // candidates: 画像URL候補の属性値配列

    candidates.forEach((candidate) => {
      // forEach: 各候補URLを順番に処理する繰り返し
      const absoluteUrl = toAbsoluteUrl(candidate); // 候補URLを正規化
      // absoluteUrl: 正規化後URLを保持する変数
      if (absoluteUrl) { // 有効URLのみ登録
        // if: 正規化成功したかを判定する条件分岐
        urlSet.add(absoluteUrl); // Setへ追加（重複は自動排除）
        // add: Setへ要素を追加するメソッド
      }
    });
  });

  const allElements = document.querySelectorAll("*"); // 全要素を取得
  // allElements: ページ内の全DOM要素ノード一覧
  allElements.forEach((el) => {
    // forEach: 各要素の背景画像を評価する繰り返し
    const computedStyle = window.getComputedStyle(el); // 計算後スタイルを取得
    // computedStyle: 要素に適用された最終CSSスタイル情報
    const bgValue = computedStyle.backgroundImage; // background-image の値を取得
    // bgValue: background-image プロパティの文字列表現
    const bgUrls = extractBackgroundImageUrls(bgValue); // 背景画像URLを抽出
    // bgUrls: 1要素から抽出した背景画像URL配列

    bgUrls.forEach((url) => urlSet.add(url)); // 抽出URLをSetへ追加
    // forEach: 背景画像URLを重複排除集合へ登録する繰り返し
  });

  return Array.from(urlSet); // Setを配列へ変換して返す
  // return: 収集済みの重複なし画像URL配列を返す
}

// ●popup からの画像取得要求に応答する
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.action === "GET_IMAGES") { // 画像取得要求メッセージか判定
    // if: action が GET_IMAGES かどうかを判定する条件分岐
    const imageUrls = collectImageUrls(); // 現在ページから画像URLを収集
    // imageUrls: 収集した画像URL配列
    sendResponse({ imageUrls }); // 収集結果をpopup側へ返却
    // sendResponse: 送信元へレスポンスを返すChrome拡張API
  }

  return false; // 同期応答のため非同期ポート保持はしない
  // return: リスナーが同期応答で完了したことを通知する
});

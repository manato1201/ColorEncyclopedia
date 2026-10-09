/**
 * ライト/ダークの保存キーと、描画前に <html data-theme> を決める初期化スクリプト。
 * layout.tsx(Server Component)と ThemeFromColorProvider(Client Component)の両方から参照するため、
 * "use client" を含まない中立のモジュールに置く(Client Componentの非コンポーネントexportは
 * Server Componentから直接使えないため)。
 */
export const THEME_MODE_STORAGE_KEY = "ce:theme-mode";

/**
 * 保存済みの選択 → 端末の prefers-color-scheme の順で決め、描画前に data-theme を付ける。
 * これを描画前(beforeInteractive)に実行することで、ダーク設定の端末でライトが一瞬見える
 * ちらつきを防ぐ。localStorageが使えない環境でも例外で止まらないようtry/catchで囲む。
 */
export const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem(${JSON.stringify(
  THEME_MODE_STORAGE_KEY,
)});var m=s==="light"||s==="dark"?s:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.dataset.theme=m;}catch(e){}})();`;

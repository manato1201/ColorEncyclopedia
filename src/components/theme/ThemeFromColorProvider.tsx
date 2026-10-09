"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import {
  deriveThemeFromColor,
  type DerivedTheme,
  type ThemeMode,
} from "@/lib/theme/deriveThemeFromColor";
import { THEME_MODE_STORAGE_KEY } from "@/lib/theme/theme-mode";

const DEFAULT_HEX = "#5B21B6"; // ブランドのバイオレット。初回ロード時の既定テーマ色(globals.cssの--color-accent-primaryと同値)。

type ThemeContextValue = {
  selectedHex: string;
  setSelectedHex: (hex: string) => void;
  theme: DerivedTheme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * 現在のモードの真実は <html data-theme> 属性(初期化スクリプトが描画前に設定する)。
 * Reactの状態として二重に持たず、属性を購読する(setStateのeffect内呼び出しも不要になる)。
 */
function subscribeToMode(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

function getModeSnapshot(): ThemeMode {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function getModeServerSnapshot(): ThemeMode {
  return "light";
}

/**
 * 選択した色に応じてサイト全体のテーマ(--theme-primary等のCSS custom properties)を反映するプロバイダ。
 * ColorEncyclopedia独自機能(ColorEncyclopedia_DESIGN.md Phase 4)。RootLayoutでアプリ全体を包む。
 * ライト/ダークの切替も扱い、モードごとの地色に対してWCAG AAを満たすようテーマを導出する。
 */
export function ThemeFromColorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedHex, setSelectedHex] = useState(DEFAULT_HEX);
  const mode = useSyncExternalStore(
    subscribeToMode,
    getModeSnapshot,
    getModeServerSnapshot,
  );
  const theme = useMemo(
    () => deriveThemeFromColor(selectedHex, mode),
    [selectedHex, mode],
  );

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--theme-primary", theme.primary);
    root.style.setProperty("--theme-accent", theme.accent);
  }, [theme]);

  const setMode = useCallback((next: ThemeMode) => {
    document.documentElement.dataset.theme = next;
    try {
      window.localStorage.setItem(THEME_MODE_STORAGE_KEY, next);
    } catch {
      // 保存できない環境(プライベートモード等)では、このセッション中だけ有効にする
    }
  }, []);

  const value = useMemo(
    () => ({ selectedHex, setSelectedHex, theme, mode, setMode }),
    [selectedHex, theme, mode, setMode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useThemeFromColor(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error(
      "useThemeFromColor must be used within ThemeFromColorProvider",
    );
  }
  return ctx;
}

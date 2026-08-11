"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  deriveThemeFromColor,
  type DerivedTheme,
} from "@/lib/theme/deriveThemeFromColor";

const DEFAULT_HEX = "#EB6238"; // 朱色。初回ロード時の既定テーマ色。

type ThemeContextValue = {
  selectedHex: string;
  setSelectedHex: (hex: string) => void;
  theme: DerivedTheme;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * 選択した色に応じてサイト全体のテーマ(--theme-primary等のCSS custom properties)を反映するプロバイダ。
 * ColorEncyclopedia独自機能(ColorEncyclopedia_DESIGN.md Phase 4)。RootLayoutでアプリ全体を包む。
 */
export function ThemeFromColorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedHex, setSelectedHex] = useState(DEFAULT_HEX);
  const theme = useMemo(() => deriveThemeFromColor(selectedHex), [selectedHex]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--theme-primary", theme.primary);
    root.style.setProperty("--theme-accent", theme.accent);
    root.style.setProperty("--theme-bg-tint", theme.bgTint);
    root.style.setProperty("--theme-text-on", theme.textOn);
  }, [theme]);

  const setHex = useCallback((hex: string) => setSelectedHex(hex), []);

  const value = useMemo(
    () => ({ selectedHex, setSelectedHex: setHex, theme }),
    [selectedHex, setHex, theme],
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

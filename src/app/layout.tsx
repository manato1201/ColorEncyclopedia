import type { Metadata } from "next";
import Script from "next/script";
import { Zen_Kaku_Gothic_New } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/hud/AppShell";
import { ThemeFromColorProvider } from "@/components/theme/ThemeFromColorProvider";
import { THEME_INIT_SCRIPT } from "@/lib/theme/theme-mode";

// OFF+BRANDスタイルリファレンスの「単一の幾何学サンセリフ書体のみを使う」原則に合わせ、
// 見出し・本文・ラベルすべてをこの1書体(400/700の2ウェイトのみ)でまかなう。
const zenKakuGothicNew = Zen_Kaku_Gothic_New({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-display-raw",
});

export const metadata: Metadata = {
  title: "色彩図鑑 | ColorEncyclopedia",
  description:
    "色彩・図形理論を数値データ化し、カタログ・詳細・可視化の3層で見せるインタラクティブ図鑑。色彩検定対策と配色理論の学習を、選択した色に応じて変化するテーマとともに提供する。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // data-theme は描画前の初期化スクリプトが付けるため、サーバー出力との属性差はsuppressHydrationWarningで許容する
    <html lang="ja" className={zenKakuGothicNew.variable} suppressHydrationWarning>
      <body>
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        <ThemeFromColorProvider>
          <AppShell>{children}</AppShell>
        </ThemeFromColorProvider>
      </body>
    </html>
  );
}

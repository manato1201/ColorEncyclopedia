import type { Metadata } from "next";
import {
  Zen_Kaku_Gothic_New,
  Space_Grotesk,
  Noto_Sans_JP,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/hud/AppShell";
import { ThemeFromColorProvider } from "@/components/theme/ThemeFromColorProvider";

const zenKakuGothicNew = Zen_Kaku_Gothic_New({
  weight: ["500", "700", "900"],
  subsets: ["latin"],
  variable: "--font-display-raw",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display-en-raw",
});

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-body-raw",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-raw",
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
    <html
      lang="ja"
      className={`${zenKakuGothicNew.variable} ${spaceGrotesk.variable} ${notoSansJP.variable} ${jetBrainsMono.variable}`}
    >
      <body>
        <ThemeFromColorProvider>
          <AppShell>{children}</AppShell>
        </ThemeFromColorProvider>
      </body>
    </html>
  );
}

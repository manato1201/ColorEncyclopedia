// サイトのマーク(「C」+ 口の中のスウォッチ(紫))。icon.svg と同じ図形を、ImageResponse(apple-icon・PWA・OGP)でも使う。
// 図形を変えるときは icon.svg も同じにする(DESIGN.md「アイコン」)。

export const MARK_COLORS = { tile: "#1d1d1d", ink: "#e5e4e0", accent: "#a78bfa" } as const;

/**
 * 32x32 の格子で描いたマーク。`rx` はタイルの角丸。
 * `inset` は、全面を塗るアイコン(iOS・maskable)で、マークを内側へ縮める割合(0〜0.3)。
 */
export function MarkSvg({
  size,
  rx = 7,
  inset = 0,
  colors = MARK_COLORS,
}: {
  size: number;
  rx?: number;
  inset?: number;
  colors?: { tile: string; ink: string; accent: string };
}) {
  const s = 1 - inset * 2;
  const t = 16 * (1 - s);
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx={rx} fill={colors.tile} />
      <g transform={`translate(${t} ${t}) scale(${s})`}>
        <path d="M22.2 10.9A8 8 0 1 0 22.2 21.1" fill="none" stroke={colors.ink} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="25" cy="16" r="2.5" fill={colors.accent} />
      </g>
    </svg>
  );
}

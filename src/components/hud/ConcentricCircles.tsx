type ConcentricCirclesProps = {
  className?: string;
};

/** OFF+BRANDの「同心円オーナメント」。装飾のみで、彩色・アニメーションを持たない。 */
export function ConcentricCircles({ className }: ConcentricCirclesProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 600 600"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="300"
        cy="300"
        r="120"
        fill="none"
        stroke="var(--color-ash)"
        strokeWidth="1"
      />
      <circle
        cx="300"
        cy="300"
        r="220"
        fill="none"
        stroke="var(--color-ash)"
        strokeWidth="1"
      />
      <circle
        cx="300"
        cy="300"
        r="300"
        fill="none"
        stroke="var(--color-ash)"
        strokeWidth="1"
      />
    </svg>
  );
}

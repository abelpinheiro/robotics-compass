const fmt = (n: number) => (Math.abs(n) < 1e-9 ? 0 : n).toFixed(2);

/** A bracketed numeric matrix, token-styled, for viz readouts. */
export function MatrixDisplay({
  rows,
  ariaLabel,
  highlightCol,
  highlightColor,
}: {
  rows: number[][];
  ariaLabel?: string;
  /** Emphasize the top-3 rows of this column (e.g. the TCP position). */
  highlightCol?: number;
  highlightColor?: string;
}) {
  const cols = rows[0]?.length ?? 0;
  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className="inline-flex items-stretch gap-1.5 font-mono text-sm tabular-nums text-foreground"
    >
      <span
        aria-hidden="true"
        className="w-1.5 rounded-l-sm border-y border-l border-foreground/40"
      />
      <div
        className="grid gap-x-3 gap-y-0.5 py-1"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {rows.flatMap((row, i) =>
          row.map((v, j) => {
            const hl = highlightCol !== undefined && j === highlightCol && i < 3;
            return (
              <span
                key={`${i}-${j}`}
                className={`text-right tabular-nums ${hl ? "font-bold" : ""}`}
                style={hl ? { color: highlightColor } : undefined}
              >
                {fmt(v)}
              </span>
            );
          }),
        )}
      </div>
      <span
        aria-hidden="true"
        className="w-1.5 rounded-r-sm border-y border-r border-foreground/40"
      />
    </div>
  );
}

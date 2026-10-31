/**
 * Craig's transform notation ^{from}_{to}T (e.g. ⁰₁T, ³_TT): the transform that
 * describes frame {to} relative to frame {from}. Rendered with inline
 * super/subscripts because Unicode has no subscript for frame names like T.
 */
export function TransformLabel({ from, to }: { from: string; to: string }) {
  return (
    <span className="whitespace-nowrap">
      <sup>{from}</sup>
      <sub>{to}</sub>T
    </span>
  );
}

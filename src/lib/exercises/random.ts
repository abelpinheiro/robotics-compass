// Deterministic randomness for exercise variants: the same exercise id and
// variant index always give the same parameters, shuffles and sample points.

/** mulberry32: small deterministic PRNG returning floats in [0, 1). */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a hash of a string, for turning an exercise id into a seed. */
export function hashString(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export interface Rng {
  /** float in [0, 1) */
  next(): number;
  /** integer in [lo, hi], inclusive */
  int(lo: number, hi: number): number;
  /** float in [lo, hi), rounded to `decimals` when given */
  uniform(lo: number, hi: number, decimals?: number): number;
  /** one element of a non-empty list */
  pick<T>(items: readonly T[]): T;
  /** a shuffled copy (Fisher–Yates) */
  shuffle<T>(items: readonly T[]): T[];
}

export function createRng(seed: number): Rng {
  const next = mulberry32(seed);
  const rng: Rng = {
    next,
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    uniform: (lo, hi, decimals) => {
      const v = lo + (hi - lo) * next();
      return decimals === undefined ? v : Number(v.toFixed(decimals));
    },
    pick: (items) => items[Math.floor(next() * items.length)],
    shuffle: (items) => {
      const out = [...items];
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
  };
  return rng;
}

/** The RNG of one variant of one exercise. */
export function variantRng(exerciseId: string, variant: number): Rng {
  return createRng(hashString(exerciseId) ^ Math.imul(variant + 1, 0x9e3779b1));
}

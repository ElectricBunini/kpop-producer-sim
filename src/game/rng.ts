export type Rng = {
  seed: number;
  next: () => number; // [0,1)
  int: (min: number, max: number) => number; // inclusive
  pick: <T>(arr: T[]) => T;
  shuffle: <T>(arr: T[]) => T[];
};

// Mulberry32: small, fast, deterministic PRNG.
export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const int = (min: number, max: number) => {
    const lo = Math.ceil(min);
    const hi = Math.floor(max);
    return Math.floor(next() * (hi - lo + 1)) + lo;
  };

  const pick = <T,>(arr: T[]) => arr[int(0, arr.length - 1)];

  const shuffle = <T,>(arr: T[]) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = int(0, i);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  return { seed, next, int, pick, shuffle };
}

export function randomSeed(): number {
  // Use crypto when possible; fallback to time.
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0]!;
  }
  return (Date.now() ^ (Math.random() * 2 ** 32)) >>> 0;
}


/** 可固定种子的 RNG（mulberry32）。支持 ?seed=xxx。 */
export class RNG {
  private s: number;
  constructor(seed: number = Date.now() >>> 0) { this.s = (seed >>> 0) || 1; }
  next(): number {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  int(n: number): number { return Math.floor(this.next() * n); }
  chance(p: number): boolean { return this.next() < p; }
  pick<T>(a: T[]): T { return a[this.int(a.length)]; }
  range(lo: number, hi: number): number { return lo + this.next() * (hi - lo); }
  state(): number { return this.s; }
  setState(s: number): void { this.s = s >>> 0; }
}
export function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
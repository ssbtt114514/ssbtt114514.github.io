import { K, isFluid } from './types';

/**
 * 扁平一维数组场景：idx = x + y*W + z*W*D。
 * 并行类型数组存储：种类/本体色/染色掩码/染色色/属性。
 */
export class Grid {
  W: number; D: number; H: number; WD: number; N: number;
  kind: Uint8Array; color: Int8Array; dye: Uint8Array; dyeColor: Int8Array; attr: Uint8Array;
  breaches = new Set<number>();       // 框壁破口（边界格）
  fluidActive = new Set<number>();    // 流体活跃集合（CA 节流）
  version = 0;                        // 渲染脏标记

  constructor(W: number, D: number, H: number) {
    this.W = W; this.D = D; this.H = H; this.WD = W * D; this.N = W * D * H;
    this.kind = new Uint8Array(this.N);
    this.color = new Int8Array(this.N).fill(-1);
    this.dye = new Uint8Array(this.N);
    this.dyeColor = new Int8Array(this.N).fill(-1);
    this.attr = new Uint8Array(this.N);
  }
  idx(x: number, y: number, z: number): number { return x + y * this.W + z * this.WD; }
  xyz(i: number): [number, number, number] {
    const z = (i / this.WD) | 0, r = i % this.WD, y = (r / this.W) | 0, x = r % this.W;
    return [x, y, z];
  }
  inB(x: number, y: number, z: number): boolean {
    return x >= 0 && y >= 0 && z >= 0 && x < this.W && y < this.D && z < this.H;
  }
  clearCell(i: number): void {
    this.kind[i] = K.EMPTY; this.color[i] = -1; this.dye[i] = 0;
    this.dyeColor[i] = -1; this.attr[i] = 0;
    this.fluidActive.delete(i); this.version++;
  }
  setCell(x: number, y: number, z: number, k: number, c = -1): number {
    const i = this.idx(x, y, z);
    this.kind[i] = k; this.color[i] = c; this.version++;
    return i;
  }
  /** 染色面颜色优先，其次本体色 */
  faceColor(i: number, face: number): number {
    return (this.dye[i] & (1 << face)) ? this.dyeColor[i] : this.color[i];
  }
  serialize(): any {
    const rle = (a: ArrayLike<number>) => {
      const out: number[] = [];
      for (let i = 0; i < a.length;) {
        const v = a[i]; let n = 1;
        while (i + n < a.length && a[i + n] === v && n < 65535) n++;
        out.push(v, n); i += n;
      }
      return out;
    };
    return {
      W: this.W, D: this.D, H: this.H,
      kind: rle(this.kind), color: rle(this.color), dye: rle(this.dye),
      dyeColor: rle(this.dyeColor), attr: rle(this.attr),
      breaches: [...this.breaches], fluid: [...this.fluidActive]
    };
  }
  static deserialize(o: any): Grid {
    const g = new Grid(o.W, o.D, o.H);
    const unrle = (arr: number[], dst: { [i: number]: number }) => {
      let p = 0;
      for (let i = 0; i < arr.length; i += 2) for (let k = 0; k < arr[i + 1]; k++) dst[p++] = arr[i];
    };
    unrle(o.kind, g.kind); unrle(o.color, g.color); unrle(o.dye, g.dye);
    unrle(o.dyeColor, g.dyeColor); unrle(o.attr, g.attr);
    g.breaches = new Set(o.breaches || []);
    g.fluidActive = new Set(o.fluid || []);
    g.version++;
    return g;
  }
}
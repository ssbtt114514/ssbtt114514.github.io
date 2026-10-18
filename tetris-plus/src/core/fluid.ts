import { Grid } from './grid';
import { RNG } from './rng';
import { K, isFluid } from './types';

/** 面索引：从邻居指向当前格的方向（用于染色） */
const NBR: [number, number, number, number][] = [
  [1, 0, 0, 1], [-1, 0, 0, 0], [0, 1, 0, 3], [0, -1, 0, 2], [0, 0, 1, 5], [0, 0, -1, 4]
];

/**
 * 流体元胞自动机（§2.3）：向下、遇阻侧向扩散；岩浆+水接触→凝结。
 * 仅处理活跃集合（100ms/tick），禁止全场景扫描。
 */
export class FluidSim {
  constructor(public g: Grid, public rng: RNG) {}

  private neighbors(i: number): number[] {
    const g = this.g, [x, y, z] = g.xyz(i), out: number[] = [];
    for (const [dx, dy, dz] of NBR) {
      if (g.inB(x + dx, y + dy, z + dz)) out.push(g.idx(x + dx, y + dy, z + dz));
    }
    return out;
  }
  private touch(i: number, kind: number): number {
    for (const n of this.neighbors(i)) if (this.g.kind[n] === kind) return n;
    return -1;
  }
  private moveFluid(from: number, to: number) {
    const g = this.g;
    g.kind[to] = g.kind[from]; g.dyeColor[to] = g.dyeColor[from]; g.color[to] = g.color[from];
    g.clearCell(from);
    g.fluidActive.add(to);
    for (const n of this.neighbors(from)) if (isFluid(g.kind[n])) g.fluidActive.add(n);
    for (const n of this.neighbors(to)) if (isFluid(g.kind[n])) g.fluidActive.add(n);
  }
  private dyeAround(i: number) {
    const g = this.g, dc = g.dyeColor[i];
    if (dc < 0) return;
    const [x, y, z] = g.xyz(i);
    for (const [dx, dy, dz, face] of NBR) {
      if (!g.inB(x + dx, y + dy, z + dz)) continue;
      const ni = g.idx(x + dx, y + dy, z + dz);
      const k = g.kind[ni];
      if (k === K.SOLID || k === K.STONE) {
        g.dye[ni] |= 1 << face;       // 只染接触面（§5.5）
        g.dyeColor[ni] = dc;
      }
    }
  }
  /** 指定列 z0 以上流体全部唤醒（消除/爆炸后调用） */
  activateColumn(x: number, y: number, z0: number) {
    for (let z = Math.max(0, z0); z < this.g.H; z++) {
      const i = this.g.idx(x, y, z);
      if (isFluid(this.g.kind[i])) this.g.fluidActive.add(i);
    }
  }
  tick() {
    const g = this.g;
    const list = [...g.fluidActive];
    g.fluidActive.clear();
    for (const i of list) {
      const k = g.kind[i];
      if (!isFluid(k)) continue;
      const [x, y, z] = g.xyz(i);
      // 岩浆+水接触 → 凝结：岩浆→石头，水被消耗
      if (k === K.WATER) {
        const li = this.touch(i, K.LAVA);
        if (li >= 0) { g.kind[li] = K.STONE; g.color[li] = -1; g.clearCell(i); g.version++; continue; }
      } else {
        const wi = this.touch(i, K.WATER);
        if (wi >= 0) { g.clearCell(wi); g.kind[i] = K.STONE; g.color[i] = -1; g.fluidActive.delete(i); g.version++; continue; }
      }
      if (g.dyeColor[i] >= 0) this.dyeAround(i);
      // 向下
      if (z > 0) {
        const bi = i - g.WD;
        if (g.kind[bi] === K.EMPTY) { this.moveFluid(i, bi); continue; }
      }
      // 侧向扩散（随机序避免方向偏置）
      const dirs: [number, number][] = g.D > 1 ? [[1, 0], [-1, 0], [0, 1], [0, -1]] : [[1, 0], [-1, 0]];
      for (let t = dirs.length - 1; t > 0; t--) { const j = this.rng.int(t + 1); [dirs[t], dirs[j]] = [dirs[j], dirs[t]]; }
      for (const [dx, dy] of dirs) {
        const nx = x + dx, ny = y + dy;
        if (g.inB(nx, ny, z)) {
          const ni = g.idx(nx, ny, z);
          if (g.kind[ni] === K.EMPTY) { this.moveFluid(i, ni); break; }
        } else if (g.breaches.has(i)) { g.clearCell(i); break; } // 从破口流出
      }
      // 静止则休眠（不再入队）
    }
  }
}
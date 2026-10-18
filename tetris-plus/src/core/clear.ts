import { Grid } from './grid';
import { K, isFluid } from './types';
import { SCORE } from '../config';

export interface ClearResult { cells: number[]; points: number; notes: string[]; }

/** 某单元格集合内的颜色种类数（本体色 + 染色色；流体/石头无色不计） */
function colorCount(g: Grid, idxs: number[]): number {
  const s = new Set<number>();
  for (const i of idxs) {
    if (g.color[i] >= 0) s.add(g.color[i]);
    if (g.dye[i] && g.dyeColor[i] >= 0) s.add(g.dyeColor[i]);
  }
  return s.size;
}

interface Cube { x: number; y: number; z: number; n: number; }
/** 魔方检测（§2.2）：n 阶(2~6)，6 面单色且互不相同，允许空心。仅扫描最近锁定邻域保证 ≤10ms。 */
function findRubiks(g: Grid, focus?: number[]): Cube[] {
  const maxN = Math.min(g.W, g.D, g.H, 6);
  let x0 = 0, y0 = 0, z0 = 0, x1 = g.W - 1, y1 = g.D - 1, z1 = g.H - 1;
  if (focus && focus.length) {
    x0 = g.W; y0 = g.D; z0 = g.H; x1 = y1 = z1 = 0;
    for (const i of focus) {
      const [x, y, z] = g.xyz(i);
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); z0 = Math.min(z0, z);
      x1 = Math.max(x1, x); y1 = Math.max(y1, y); z1 = Math.max(z1, z);
    }
    x0 = Math.max(0, x0 - maxN); y0 = Math.max(0, y0 - maxN); z0 = Math.max(0, z0 - maxN);
    x1 = Math.min(g.W - 1, x1 + maxN); y1 = Math.min(g.D - 1, y1 + maxN); z1 = Math.min(g.H - 1, z1 + maxN);
  }
  const faceOk = (cells: [number, number, number][], face: number): number => {
    let col = -1;
    for (const [x, y, z] of cells) {
      const i = g.idx(x, y, z);
      const k = g.kind[i];
      if (k !== K.SOLID && k !== K.STONE) return -1; // 流体不参与魔方
      const fc = g.faceColor(i, face);
      if (fc < 0) return -1;
      if (col < 0) col = fc; else if (fc !== col) return -1;
    }
    return col;
  };
  const res: Cube[] = [];
  const usedZ = new Set<number>();
  for (let n = maxN; n >= 2; n--) {
    for (let z = z0; z + n - 1 <= z1; z++)
      for (let y = y0; y + n - 1 <= y1; y++)
        for (let x = x0; x + n - 1 <= x1; x++) {
          let clash = false;
          for (let k = 0; k < n; k++) if (usedZ.has(z + k)) { clash = true; break; }
          if (clash) continue;
          const cells = (f: (u: number, v: number) => [number, number, number]) => {
            const a: [number, number, number][] = [];
            for (let u = 0; u < n; u++) for (let v = 0; v < n; v++) a.push(f(u, v));
            return a;
          };
          const cols = [
            faceOk(cells((u, v) => [x + u, y + v, z]), 5),
            faceOk(cells((u, v) => [x + u, y + v, z + n - 1]), 4),
            faceOk(cells((u, v) => [x, y + u, z + v]), 1),
            faceOk(cells((u, v) => [x + n - 1, y + u, z + v]), 0),
            faceOk(cells((u, v) => [x + u, y, z + v]), 3),
            faceOk(cells((u, v) => [x + u, y + n - 1, z + v]), 2)
          ];
          if (cols.every(c => c >= 0) && new Set(cols).size === 6) {
            res.push({ x, y, z, n });
            for (let k = 0; k < n; k++) usedZ.add(z + k);
          }
        }
  }
  return res;
}

/**
 * 消除判定（锁定时调用）：
 * 1D:满列+20 / 2D:满行+50 / 3D:排+100、层+500 / 阶段4+:颜色≤4消除+500、魔方每层+500。
 */
export function detectClears(g: Grid, dim: number, stage: number, focus?: number[]): ClearResult {
  const cells = new Set<number>();
  let points = 0; const notes: string[] = [];
  const add = (i: number) => cells.add(i);

  if (dim === 1) {
    for (let x = 0; x < g.W; x++) {
      let full = true;
      for (let z = 0; z < g.H; z++) if (g.kind[g.idx(x, 0, z)] === K.EMPTY) { full = false; break; }
      if (full) { for (let z = 0; z < g.H; z++) add(g.idx(x, 0, z)); points += SCORE.col1; notes.push('整列消除'); }
    }
    return { cells: [...cells], points, notes };
  }
  if (dim === 2) {
    for (let z = 0; z < g.H; z++) {
      let full = true;
      for (let x = 0; x < g.W; x++) if (g.kind[g.idx(x, 0, z)] === K.EMPTY) { full = false; break; }
      if (full) { for (let x = 0; x < g.W; x++) add(g.idx(x, 0, z)); points += SCORE.row2; notes.push('满行消除'); }
    }
    return { cells: [...cells], points, notes };
  }

  // 3D：层 > 排/列
  const layerDone: boolean[] = new Array(g.H).fill(false);
  for (let z = 0; z < g.H; z++) {
    let full = true;
    for (let i = z * g.WD; i < (z + 1) * g.WD; i++) if (g.kind[i] === K.EMPTY) { full = false; break; }
    if (!full) continue;
    layerDone[z] = true;
    for (let i = z * g.WD; i < (z + 1) * g.WD; i++) add(i);
    points += SCORE.layer3; notes.push('整层消除');
    if (stage >= 4) {
      const idxs: number[] = [];
      for (let i = z * g.WD; i < (z + 1) * g.WD; i++) idxs.push(i);
      if (colorCount(g, idxs) <= 4) { points += SCORE.colorClear; notes.push('颜色消除(层)'); }
    }
  }
  for (let z = 0; z < g.H; z++) {
    if (layerDone[z]) continue;
    for (let y = 0; y < g.D; y++) { // 沿 x 的整排
      let full = true;
      for (let x = 0; x < g.W; x++) if (g.kind[g.idx(x, y, z)] === K.EMPTY) { full = false; break; }
      if (full) { for (let x = 0; x < g.W; x++) add(g.idx(x, y, z)); points += SCORE.line3; notes.push('整排消除'); }
    }
    for (let x = 0; x < g.W; x++) { // 沿 y 的整列
      let full = true;
      for (let y = 0; y < g.D; y++) if (g.kind[g.idx(x, y, z)] === K.EMPTY) { full = false; break; }
      if (full) { for (let y = 0; y < g.D; y++) add(g.idx(x, y, z)); points += SCORE.line3; notes.push('整列消除'); }
    }
  }
  if (stage >= 4) {
    // 竖直列颜色消除（1×1×H 全满且颜色 ≤4）
    for (let y = 0; y < g.D; y++) for (let x = 0; x < g.W; x++) {
      let full = true;
      for (let z = 0; z < g.H; z++) if (g.kind[g.idx(x, y, z)] === K.EMPTY) { full = false; break; }
      if (!full) continue;
      const idxs: number[] = [];
      for (let z = 0; z < g.H; z++) idxs.push(g.idx(x, y, z));
      if (colorCount(g, idxs) <= 4) {
        for (const i of idxs) add(i);
        points += SCORE.colorClear; notes.push('颜色消除(列)');
      }
    }
    // 魔方：消除其占据的全部 z 层（整场截面），每层 +500
    for (const c of findRubiks(g, focus)) {
      for (let k = 0; k < c.n; k++) {
        const z = c.z + k;
        for (let i = z * g.WD; i < (z + 1) * g.WD; i++) if (g.kind[i] !== K.EMPTY) add(i);
        points += SCORE.rubikLayer;
      }
      notes.push(`魔方消除(${c.n}阶)`);
    }
  }
  return { cells: [...cells], points, notes };
}
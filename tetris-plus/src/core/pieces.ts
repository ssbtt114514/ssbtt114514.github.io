import { Grid } from './grid';
import { RNG } from './rng';
import { K } from './types';
import type { GameCfg } from '../config';
import { COLORS6 } from '../config';

export type Cell = [number, number, number];
export interface Piece {
  cells: Cell[]; x: number; y: number; z: number;
  color: number; kind: number; grav: boolean; gas: number; dye: boolean; bomb: boolean;
}

const seg = (n: number): Cell[] => Array.from({ length: n }, (_, i) => [i, 0, 0] as Cell);
/** 2D 七块（x-z 平面，y=0） */
export const SHAPES2: Cell[][] = [
  [[0, 0, 0], [1, 0, 0], [2, 0, 0], [3, 0, 0]],
  [[0, 0, 0], [1, 0, 0], [0, 0, 1], [1, 0, 1]],
  [[0, 0, 0], [1, 0, 0], [2, 0, 0], [1, 0, 1]],
  [[0, 0, 0], [0, 0, 1], [0, 0, 2], [1, 0, 0]],
  [[1, 0, 0], [1, 0, 1], [1, 0, 2], [0, 0, 0]],
  [[1, 0, 0], [2, 0, 0], [0, 0, 1], [1, 0, 1]],
  [[0, 0, 0], [1, 0, 0], [1, 0, 1], [2, 0, 1]]
];
/** 3D 四格骨牌（含真三维形状） */
export const SHAPES3: Cell[][] = [
  ...SHAPES2,
  [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]],          // 三脚架
  [[0, 0, 0], [0, 0, 1], [0, 0, 2], [0, 1, 0]],          // 立 L
  [[0, 0, 0], [1, 0, 0], [1, 1, 0], [1, 1, 1]]           // 三维折线
];

/** 绕轴旋转：0=绕z 1=绕x 2=绕y（右手系，z 向上） */
export function rotateCells(cells: Cell[], axis: 0 | 1 | 2): Cell[] {
  const out = cells.map(([x, y, z]) => {
    if (axis === 0) return [-y, x, z] as Cell;
    if (axis === 1) return [x, -z, y] as Cell;
    return [z, y, -x] as Cell;
  });
  const mn: Cell = [Infinity, Infinity, Infinity];
  for (const c of out) for (let k = 0; k < 3; k++) mn[k] = Math.min(mn[k], c[k]);
  return out.map(c => [c[0] - mn[0], c[1] - mn[1], c[2] - mn[2]] as Cell);
}
export function boundsOf(cells: Cell[]) {
  const b = { w: 0, d: 0, h: 0 };
  for (const [x, y, z] of cells) { b.w = Math.max(b.w, x + 1); b.d = Math.max(b.d, y + 1); b.h = Math.max(b.h, z + 1); }
  return b;
}
export function fits(g: Grid, cells: Cell[], ox: number, oy: number, oz: number): boolean {
  for (const [cx, cy, cz] of cells) {
    const x = ox + cx, y = oy + cy, z = oz + cz;
    if (!g.inB(x, y, z) || g.kind[g.idx(x, y, z)] !== K.EMPTY) return false;
  }
  return true;
}
/** 按维度/阶段/自定义属性生成方块 */
export function makePiece(dim: number, stage: number, rng: RNG, cfg: GameCfg): Piece {
  let cells: Cell[];
  if (dim === 1) cells = seg(1 + rng.int(4));
  else if (dim === 2) cells = rng.pick(SHAPES2).map(c => [...c] as Cell);
  else cells = rng.pick(SHAPES3).map(c => [...c] as Cell);
  const p: Piece = {
    cells, x: 0, y: 0, z: 0,
    color: stage >= 4 ? rng.int(6) : -1,
    kind: K.SOLID, grav: false, gas: 0, dye: false, bomb: false
  };
  const a = cfg.attrs;
  if (rng.chance(a.liquid)) p.kind = rng.chance(0.5) ? K.WATER : K.LAVA;
  if (rng.chance(a.dye)) { p.kind = K.WATER; p.dye = true; if (p.color < 0) p.color = rng.int(6); }
  if (rng.chance(a.grav)) p.grav = true;
  if (rng.chance(a.gas)) p.gas = 1 + rng.int(3);
  return p;
}
export function spawnPos(g: Grid, p: Piece, gdir: -1 | 1) {
  const b = boundsOf(p.cells);
  p.x = Math.max(0, Math.min(g.W - b.w, Math.floor((g.W - b.w) / 2)));
  p.y = Math.max(0, Math.min(g.D - b.d, Math.floor((g.D - b.d) / 2)));
  p.z = gdir === -1 ? g.H - b.h : 1;
}
export function pieceColorHex(p: Piece): number {
  return p.color >= 0 ? COLORS6[p.color] : 0x9db4d0;
}
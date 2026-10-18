import { Grid } from './grid';
import { K, GRAV, gasLevel, withGas } from './types';

function moveCell(g: Grid, x: number, y: number, z: number, nx: number, ny: number, nz: number) {
  const a = g.idx(x, y, z), b = g.idx(nx, ny, nz);
  g.kind[b] = g.kind[a]; g.color[b] = g.color[a]; g.dye[b] = g.dye[a];
  g.dyeColor[b] = g.dyeColor[a]; g.attr[b] = g.attr[a];
  if (g.kind[b] === K.WATER || g.kind[b] === K.LAVA) { g.fluidActive.delete(a); g.fluidActive.add(b); }
  g.clearCell(a);
}

/**
 * 重力结算 + 气体行为。
 * dir=-1 正常下落；dir=1 反重力（全场〔重力〕块向天花板落，气体暂停 §5.4）。
 * 破口格：〔重力〕块落至破口格即坠出消失（§5.8）。
 */
export function settle(g: Grid, dir: -1 | 1, allowGas: boolean): boolean {
  let movedAny = false;
  for (let pass = 0; pass < 60; pass++) {
    let moved = false;
    // —— 重力坠落（按方向顺序遍历，一次落到底）——
    for (let z = dir === -1 ? 0 : g.H - 1; dir === -1 ? z < g.H : z >= 0; z += dir) {
      for (let y = 0; y < g.D; y++) for (let x = 0; x < g.W; x++) {
        const i = g.idx(x, y, z);
        if (g.kind[i] === K.EMPTY || !(g.attr[i] & GRAV)) continue;
        let nz = z;
        while (nz + dir >= 0 && nz + dir < g.H && g.kind[g.idx(x, y, nz + dir)] === K.EMPTY) nz += dir;
        if (nz !== z) { moveCell(g, x, y, z, x, y, nz); moved = true; }
        const ri = g.idx(x, y, nz);
        if (g.breaches.has(ri)) { g.clearCell(ri); moved = true; } // 坠出破口
      }
    }
    // —— 气体：顶起上方 N 块 / 自身上浮 ——
    if (allowGas) {
      for (let z = 0; z < g.H; z++) for (let y = 0; y < g.D; y++) for (let x = 0; x < g.W; x++) {
        const i = g.idx(x, y, z);
        const L = gasLevel(g.attr[i]);
        if (!L || g.kind[i] === K.EMPTY) continue;
        let c = 0;
        while (c < L && z + 1 + c < g.H && g.kind[g.idx(x, y, z + 1 + c)] !== K.EMPTY) c++;
        if (c > 0) {
          if (z + 1 + c < g.H && g.kind[g.idx(x, y, z + 1 + c)] === K.EMPTY) {
            for (let k = c; k >= 1; k--) {
              moveCell(g, x, y, z + k, x, y, z + k + 1);
              g.attr[g.idx(x, y, z + k + 1)] |= GRAV; // 被顶起者获〔重力〕
            }
            moved = true;
          }
        } else if (z + 1 < g.H && g.kind[g.idx(x, y, z + 1)] === K.EMPTY) {
          moveCell(g, x, y, z, x, y, z + 1); moved = true; // 上方无方块→上浮
        }
      }
    }
    if (!moved) break;
    movedAny = true;
  }
  if (movedAny) g.version++;
  return movedAny;
}
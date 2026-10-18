import { Grid } from './grid';
import { K, isFluid } from './types';
import type { ItemId } from './types';

/**
 * 摧毁一格：普通块消失；岩浆块→变为流动的岩浆液体（§2.3/§5.7）。
 * 返回是否真正移除了方块。
 */
function destroy(g: Grid, i: number): boolean {
  const k = g.kind[i];
  if (k === K.EMPTY) return false;
  if (k === K.LAVA) { g.fluidActive.add(i); g.version++; return true; } // 转为活跃液体
  g.clearCell(i);
  return true;
}

export function applyItem(
  g: Grid, id: ItemId, t: { x: number; y: number; z: number },
  o?: { axis?: number; size?: number }
): { destroyed: number; breaches: number } {
  let destroyed = 0, breaches = 0;
  const inB = (x: number, y: number, z: number) => g.inB(x, y, z);
  const boom = (x: number, y: number, z: number) => { if (inB(x, y, z) && destroy(g, g.idx(x, y, z))) destroyed++; };

  if (id === 'tnt') { // 切比雪夫距离 ≤2
    for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) for (let dz = -2; dz <= 2; dz++)
      boom(t.x + dx, t.y + dy, t.z + dz);
  } else if (id === 'cross') { // 六面相邻 6 格
    for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]])
      boom(t.x + dx, t.y + dy, t.z + dz);
  } else if (id === 'line') { // 一整排（至框壁），默认 X 轴；axis: 0=x 1=y 2=z
    const ax = o?.axis ?? 0;
    if (ax === 0) for (let x = 0; x < g.W; x++) boom(x, t.y, t.z);
    else if (ax === 1) for (let y = 0; y < g.D; y++) boom(t.x, y, t.z);
    else for (let z = 0; z < g.H; z++) boom(t.x, t.y, z);
  } else if (id === 'sponge') { // 吸掉指定层全部水
    for (let y = 0; y < g.D; y++) for (let x = 0; x < g.W; x++) {
      const i = g.idx(x, y, t.z);
      if (g.kind[i] === K.WATER) { g.clearCell(i); destroyed++; }
    }
  } else if (id === 'bucket') { // 回收任意一格岩浆/水
    if (inB(t.x, t.y, t.z)) {
      const i = g.idx(t.x, t.y, t.z);
      if (isFluid(g.kind[i])) { g.clearCell(i); destroyed++; }
    }
  } else if (id === 'wall') { // 框壁炸洞 3³/5³，破口开放（§5.8）
    const r = o?.size === 5 ? 2 : 1;
    for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) for (let dz = -r; dz <= r; dz++) {
      const x = t.x + dx, y = t.y + dy, z = t.z + dz;
      if (!inB(x, y, z)) continue;
      const i = g.idx(x, y, z);
      destroy(g, i) && destroyed++;
      if (x === 0 || x === g.W - 1 || y === 0 || y === g.D - 1) {
        if (!g.breaches.has(i)) { g.breaches.add(i); breaches++; }
      }
    }
  }
  g.version++;
  return { destroyed, breaches };
}
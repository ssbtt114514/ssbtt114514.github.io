import { describe, it, expect } from 'vitest';
import { Grid } from '../src/core/grid';
import { FluidSim } from '../src/core/fluid';
import { RNG } from '../src/core/rng';
import { K } from '../src/core/types';
import { applyItem } from '../src/core/items';

const mk = (W = 6, D = 1, H = 8) => {
  const g = new Grid(W, D, H);
  const f = new FluidSim(g, new RNG(7));
  return { g, f };
};
describe('流体 CA', () => {
  it('水下落至底', () => {
    const { g, f } = mk();
    const i = g.setCell(3, 0, 6, K.WATER); g.fluidActive.add(i);
    for (let k = 0; k < 10; k++) f.tick();
    expect(g.kind[g.idx(3, 0, 0)]).toBe(K.WATER);
  });
  it('遇阻侧向扩散', () => {
    const { g, f } = mk();
    g.setCell(3, 0, 0, K.SOLID);
    const i = g.setCell(3, 0, 1, K.WATER); g.fluidActive.add(i);
    for (let k = 0; k < 10; k++) f.tick();
    const moved = g.kind[g.idx(2, 0, 0)] === K.WATER || g.kind[g.idx(4, 0, 0)] === K.WATER;
    expect(moved).toBe(true);
  });
  it('岩浆+水接触 → 凝结为石头，水消失', () => {
    const { g, f } = mk();
    const l = g.setCell(2, 0, 0, K.LAVA); g.fluidActive.add(l);
    const w = g.setCell(3, 0, 0, K.WATER); g.fluidActive.add(w);
    f.tick();
    expect(g.kind[g.idx(2, 0, 0)]).toBe(K.STONE);
    expect(g.kind[g.idx(3, 0, 0)]).toBe(K.EMPTY);
  });
  it('被爆炸摧毁的岩浆 → 变为活跃岩浆液体', () => {
    const { g } = mk(10, 10, 10);
    // 先用凝结制造石头旁的岩浆场景：这里直接验证 TNT 对岩浆格不删除而再活化
    const l = g.setCell(5, 5, 5, K.LAVA);
    g.fluidActive.delete(l);
    applyItem(g, 'tnt', { x: 5, y: 5, z: 5 });
    expect(g.kind[l]).toBe(K.LAVA);
    expect(g.fluidActive.has(l)).toBe(true);
  });
  it('普通方块被炸直接消失', () => {
    const { g } = mk(10, 10, 10);
    const i = g.setCell(5, 5, 5, K.SOLID);
    applyItem(g, 'tnt', { x: 5, y: 5, z: 5 });
    expect(g.kind[i]).toBe(K.EMPTY);
  });
});
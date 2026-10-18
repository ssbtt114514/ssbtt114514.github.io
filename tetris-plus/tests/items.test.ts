import { describe, it, expect } from 'vitest';
import { Grid } from '../src/core/grid';
import { applyItem } from '../src/core/items';
import { K } from '../src/core/types';

const fill = (W = 10, D = 10, H = 10) => {
  const g = new Grid(W, D, H);
  for (let i = 0; i < g.N; i++) g.kind[i] = K.SOLID;
  return g;
};
describe('三种 TNT 爆炸形状', () => {
  it('TNT：切比雪夫≤2 → 5×5×5=125', () => {
    const g = fill();
    const r = applyItem(g, 'tnt', { x: 5, y: 5, z: 5 });
    expect(r.destroyed).toBe(125);
  });
  it('十字 TNT：恰好 6 个面相邻', () => {
    const g = fill();
    const r = applyItem(g, 'cross', { x: 5, y: 5, z: 5 });
    expect(r.destroyed).toBe(6);
    expect(g.kind[g.idx(5, 5, 5)]).toBe(K.SOLID); // 中心不炸
  });
  it('一字 TNT：整排至框壁', () => {
    const g = fill();
    const r = applyItem(g, 'line', { x: 3, y: 4, z: 2 }, { axis: 0 });
    expect(r.destroyed).toBe(10);
    for (let x = 0; x < 10; x++) expect(g.kind[g.idx(x, 4, 2)]).toBe(K.EMPTY);
  });
});
describe('墙壁炸弹', () => {
  it('3×3×3 洞：内部摧毁 + 边界破口', () => {
    const g = fill();
    const r = applyItem(g, 'wall', { x: 0, y: 5, z: 5 }, { size: 3 });
    expect(r.destroyed).toBeGreaterThan(10);
    expect(r.breaches).toBeGreaterThan(0);
    expect(g.breaches.size).toBeGreaterThan(0);
  });
  it('5×5×5 更大', () => {
    const g = fill();
    const r3 = applyItem(g, 'wall', { x: 0, y: 5, z: 5 }, { size: 3 });
    const g2 = fill();
    const r5 = applyItem(g2, 'wall', { x: 0, y: 5, z: 5 }, { size: 5 });
    expect(r5.destroyed).toBeGreaterThan(r3.destroyed);
  });
});
describe('海绵与排水桶', () => {
  it('海绵只吸指定层的水，不动石头/岩浆', () => {
    const g = new Grid(5, 1, 5);
    g.setCell(0, 0, 2, K.WATER); g.setCell(1, 0, 2, K.WATER);
    g.setCell(2, 0, 2, K.LAVA); g.setCell(3, 0, 2, K.STONE);
    g.setCell(4, 0, 3, K.WATER);
    applyItem(g, 'sponge', { x: 0, y: 0, z: 2 });
    expect(g.kind[g.idx(0, 0, 2)]).toBe(K.EMPTY);
    expect(g.kind[g.idx(2, 0, 2)]).toBe(K.LAVA);   // 不吸岩浆（§5.6）
    expect(g.kind[g.idx(3, 0, 2)]).toBe(K.STONE);
    expect(g.kind[g.idx(4, 0, 3)]).toBe(K.WATER);  // 其他层不受影响
  });
  it('排水桶回收任意一格岩浆/水', () => {
    const g = new Grid(5, 1, 5);
    const a = g.setCell(1, 0, 1, K.LAVA);
    applyItem(g, 'bucket', { x: 1, y: 0, z: 1 });
    expect(g.kind[a]).toBe(K.EMPTY);
  });
});
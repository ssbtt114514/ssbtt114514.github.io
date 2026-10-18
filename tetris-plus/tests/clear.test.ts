import { describe, it, expect } from 'vitest';
import { Grid } from '../src/core/grid';
import { detectClears } from '../src/core/clear';
import { K } from '../src/core/types';

describe('阶段阈值与基础消除', () => {
  it('1D 满列 +20', () => {
    const g = new Grid(6, 1, 12);
    for (let z = 0; z < 12; z++) g.setCell(2, 0, z, K.SOLID);
    const r = detectClears(g, 1, 1);
    expect(r.points).toBe(20); expect(r.cells.length).toBe(12);
  });
  it('2D 满行 +50', () => {
    const g = new Grid(10, 1, 20);
    for (let x = 0; x < 10; x++) g.setCell(x, 0, 3, K.SOLID);
    const r = detectClears(g, 2, 2);
    expect(r.points).toBe(50);
  });
  it('3D 整排 +100；整层 +500；同帧累加', () => {
    const g = new Grid(10, 10, 20);
    for (let x = 0; x < 10; x++) g.setCell(x, 4, 0, K.SOLID);   // 排 +100
    for (let x = 0; x < 10; x++) for (let y = 0; y < 10; y++) g.setCell(x, y, 1, K.SOLID); // 层 +500
    const r = detectClears(g, 3, 3);
    expect(r.points).toBe(600);
  });
});
describe('阶段四：颜色', () => {
  const mkLayer = (colors: number[]) => {
    const g = new Grid(10, 10, 20);
    let ci = 0;
    for (let x = 0; x < 10; x++) for (let y = 0; y < 10; y++) {
      g.setCell(x, y, 0, K.SOLID, colors[ci++ % colors.length]);
    }
    return g;
  };
  it('整层且颜色 ≤4：+500 层 + +500 颜色', () => {
    const r = detectClears(mkLayer([0, 1, 2, 3]), 3, 4);
    expect(r.points).toBe(1000);
  });
  it('整层但颜色 =5：仅 +500 层', () => {
    const r = detectClears(mkLayer([0, 1, 2, 3, 4]), 3, 4);
    expect(r.points).toBe(500);
  });
  it('竖直满列 ≤4 色 +500', () => {
    const g = new Grid(10, 10, 20);
    for (let z = 0; z < 20; z++) g.setCell(3, 3, z, K.SOLID, z % 2);
    const r = detectClears(g, 3, 4);
    expect(r.points).toBe(500);
    expect(r.cells.length).toBe(20);
  });
});
describe('魔方检测', () => {
  // 给 n 阶空心/实心立方体表面按 6 面不同颜色染色
  function buildCube(g: Grid, x0: number, y0: number, z0: number, n: number, distinct = true) {
    const faceCols = [0, 1, 2, 3, 4, distinct ? 5 : 1]; // 末项重复→负例
    const paint = (x: number, y: number, z: number) => {
      const i = g.idx(x, y, z);
      if (g.kind[i] === K.EMPTY) g.setCell(x, y, z, K.SOLID);
    };
    for (let u = 0; u < n; u++) for (let v = 0; v < n; v++) {
      paint(x0 + u, y0 + v, z0); g.dye[g.idx(x0 + u, y0 + v, z0)] |= 1 << 5; g.dyeColor[g.idx(x0 + u, y0 + v, z0)] = faceCols[0];
      paint(x0 + u, y0 + v, z0 + n - 1); g.dye[g.idx(x0 + u, y0 + v, z0 + n - 1)] |= 1 << 4; g.dyeColor[g.idx(x0 + u, y0 + v, z0 + n - 1)] = faceCols[1];
      paint(x0, y0 + u, z0 + v); g.dye[g.idx(x0, y0 + u, z0 + v)] |= 1 << 1; g.dyeColor[g.idx(x0, y0 + u, z0 + v)] = faceCols[2];
      paint(x0 + n - 1, y0 + u, z0 + v); g.dye[g.idx(x0 + n - 1, y0 + u, z0 + v)] |= 1 << 0; g.dyeColor[g.idx(x0 + n - 1, y0 + u, z0 + v)] = faceCols[3];
      paint(x0 + u, y0, z0 + v); g.dye[g.idx(x0 + u, y0, z0 + v)] |= 1 << 3; g.dyeColor[g.idx(x0 + u, y0, z0 + v)] = faceCols[4];
      paint(x0 + u, y0 + n - 1, z0 + v); g.dye[g.idx(x0 + u, y0 + n - 1, z0 + v)] |= 1 << 2; g.dyeColor[g.idx(x0 + u, y0 + n - 1, z0 + v)] = faceCols[5];
    }
  }
  it('2 阶正例：消除其占据的 2 个 z 层，每层 +500', () => {
    const g = new Grid(10, 10, 20);
    buildCube(g, 2, 2, 3, 2);
    const r = detectClears(g, 3, 4, [g.idx(2, 2, 3)]);
    expect(r.points).toBe(1000);
    // 层内所有格被清除
    for (let i = 3 * g.WD; i < 5 * g.WD; i++) expect(r.cells.includes(i)).toBe(true);
  });
  it('3 阶空心正例（内部掏空）', () => {
    const g = new Grid(10, 10, 20);
    buildCube(g, 1, 1, 2, 3);
    for (let x = 2; x <= 2; x++) for (let y = 2; y <= 2; y++) { // 掏空内部
      const i = g.idx(x, y, 3); g.clearCell(i);
    }
    const r = detectClears(g, 3, 4, [g.idx(1, 1, 2)]);
    expect(r.points).toBe(1500);
  });
  it('负例：两面同色 → 不识别', () => {
    const g = new Grid(10, 10, 20);
    buildCube(g, 2, 2, 3, 2, false);
    const r = detectClears(g, 3, 4, [g.idx(2, 2, 3)]);
    expect(r.notes.some(n => n.includes('魔方'))).toBe(false);
  });
});
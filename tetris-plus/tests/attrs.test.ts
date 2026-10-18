import { describe, it, expect } from 'vitest';
import { Grid } from '../src/core/grid';
import { settle } from '../src/core/attrs';
import { K, GRAV, gasLevel, withGas } from '../src/core/types';

describe('重力结算', () => {
  it('〔重力〕块失支撑落底', () => {
    const g = new Grid(5, 1, 8);
    const i = g.setCell(2, 0, 5, K.SOLID); g.attr[i] = GRAV;
    settle(g, -1, false);
    expect(g.kind[g.idx(2, 0, 0)]).toBe(K.SOLID);
    expect(g.kind[g.idx(2, 0, 5)]).toBe(K.EMPTY);
  });
  it('无〔重力〕块保持悬空（经典行为）', () => {
    const g = new Grid(5, 1, 8);
    g.setCell(2, 0, 5, K.SOLID);
    settle(g, -1, false);
    expect(g.kind[g.idx(2, 0, 5)]).toBe(K.SOLID);
  });
  it('反重力：落向天花板', () => {
    const g = new Grid(5, 1, 8);
    const i = g.setCell(2, 0, 2, K.SOLID); g.attr[i] = GRAV;
    settle(g, 1, false);
    expect(g.kind[g.idx(2, 0, 7)]).toBe(K.SOLID);
  });
  it('破口坠出', () => {
    const g = new Grid(5, 1, 8);
    const bi = g.idx(0, 0, 0);
    g.breaches.add(bi);
    const i = g.setCell(0, 0, 4, K.SOLID); g.attr[i] = GRAV;
    settle(g, -1, false);
    expect(g.kind[bi]).toBe(K.EMPTY); // 已坠出消失
  });
});

describe('气体', () => {
  it('2 级气体顶起上方 2 块并赋〔重力〕', () => {
    const g = new Grid(3, 1, 8);
    let i = g.setCell(1, 0, 0, K.SOLID); g.attr[i] = withGas(0, 2);
    g.setCell(1, 0, 1, K.SOLID); g.setCell(1, 0, 2, K.SOLID);
    settle(g, -1, true);
    expect(g.kind[g.idx(1, 0, 2)]).toBe(K.SOLID);
    expect(g.kind[g.idx(1, 0, 3)]).toBe(K.SOLID);
    expect(g.attr[g.idx(1, 0, 3)] & GRAV).toBe(GRAV);
    expect(gasLevel(g.attr[g.idx(1, 0, 0)])).toBe(2);
  });
  it('上方无方块时气体上浮至顶', () => {
    const g = new Grid(3, 1, 8);
    const i = g.setCell(1, 0, 0, K.SOLID); g.attr[i] = withGas(0, 1);
    settle(g, -1, true);
    expect(g.kind[g.idx(1, 0, 7)]).toBe(K.SOLID);
  });
});
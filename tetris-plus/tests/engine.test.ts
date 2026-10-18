import { describe, it, expect } from 'vitest';
import { Game } from '../src/core/engine';
import { defaultCfg, clampCfg, stageForScore, DIFFS } from '../src/config';
import { K } from '../src/core/types';
import { saveGame, loadGame } from '../src/core/save';
import { collapse } from '../src/core/events';

const mk = (diff = 'normal') => {
  const g = new Game(defaultCfg(), 42, diff);
  g.start();
  return g;
};
describe('计分与阶段阈值', () => {
  it('阈值映射', () => {
    expect(stageForScore(0)).toBe(1);
    expect(stageForScore(99)).toBe(1);
    expect(stageForScore(100)).toBe(2);
    expect(stageForScore(800)).toBe(3);
    expect(stageForScore(10000)).toBe(4);
    expect(stageForScore(50000)).toBe(5);
  });
  it('阶段随分数自动推进且场地迁移保留方块', () => {
    const g = mk();
    g.grid.setCell(0, 0, 0, K.SOLID, 3);
    g.score = 100; g.checkStageUp();
    expect(g.stage).toBe(2);
    expect(g.grid.W).toBe(10);
    let found = false;
    for (let i = 0; i < g.grid.N; i++) if (g.grid.color[i] === 3) found = true;
    expect(found).toBe(true);
  });
});
describe('红线判负', () => {
  it('顶行被占 → checkRedLine 为真', () => {
    const g = mk();
    const H = g.grid.H;
    g.grid.setCell(1, 0, H - 1, K.SOLID);
    expect(g.checkRedLine()).toBe(true);
  });
  it('顶行清空 → 安全', () => {
    const g = mk();
    expect(g.checkRedLine()).toBe(false);
  });
});
describe('难度：暂停限制与掉率', () => {
  it('极难不可暂停（Esc 仅菜单，游戏继续）', () => {
    const g = mk('extreme');
    const r = g.tryPause();
    expect(r.paused).toBe(false);
    expect(g.paused).toBe(false);
  });
  it('简单可暂停', () => {
    const g = mk('easy');
    expect(g.tryPause().paused).toBe(true);
  });
  it('掉率统计：1000 次掷骰，p=0.3，误差 ±5%', () => {
    const g = mk('normal');
    let hit = 0;
    for (let i = 0; i < 1000; i++) if (g.rng.chance(0.3)) hit++;
    expect(hit).toBeGreaterThanOrEqual(285);
    expect(hit).toBeLessThanOrEqual(315);
  });
  it('0 掉率下道具永远无法入库，道具键无效', () => {
    const g = mk('extreme'); // drop=0
    for (let z = 0; z < g.grid.H - 2; z++) g.grid.setCell(0, 0, z, K.SOLID);
    g.score += 50;
    g.resolveBoard(true);
    expect(Object.values(g.inv).every(v => v === 0)).toBe(true);
    expect(g.useItem(0)).toBe(false);
  });
});
describe('存档/读档一致性（§5.10）', () => {
  it('场地/分数/库存/事件状态完整往返', () => {
    const g = mk();
    g.grid.setCell(3, 0, 0, K.SOLID, 2);
    g.score = 321; g.inv.tnt = 2; g.inv.bucket = 1;
    const s = saveGame(g);
    const g2 = loadGame(s)!;
    expect(g2).toBeTruthy();
    expect(g2.score).toBe(321);
    expect(g2.inv.tnt).toBe(2);
    expect(g2.inv.bucket).toBe(1);
    expect(g2.grid.kind[g2.grid.idx(3, 0, 0)]).toBe(K.SOLID);
    expect(g2.grid.color[g2.grid.idx(3, 0, 0)]).toBe(2);
    expect(Array.from(g2.grid.kind)).toEqual(Array.from(g.grid.kind));
  });
});
describe('自定义配置 JSON 回显', () => {
  it('clampCfg(JSON.parse(JSON.stringify(x))) 幂等', () => {
    const c = clampCfg({ custom: true, W: 12, D: 12, H: 24, dim: 3, speed: 1.2, drop: 0.25, attrs: { gas: 0.5 }, weights: { rain: 3 } });
    const c2 = clampCfg(JSON.parse(JSON.stringify(c)));
    expect(JSON.stringify(c2)).toBe(JSON.stringify(c));
  });
  it('尺寸越界被夹取', () => {
    const c = clampCfg({ W: 1000, D: 0, H: 999, dim: 3 });
    expect(c.W).toBe(100); expect(c.D).toBe(5); expect(c.H).toBe(50);
  });
});
describe('集成冒烟：每档难度自动随机打一局', () => {
  for (const d of Object.keys(DIFFS)) {
    it(`难度 ${d} 完整一局无崩溃`, () => {
      const g = new Game(defaultCfg(), 7, d);
      g.start();
      for (let i = 0; i < 800 && g.state === 'play'; i++) {
        if (g.rng.chance(0.5)) g.move(g.rng.int(2) ? 1 : -1, 0);
        if (g.rng.chance(0.3)) g.rotate(g.dim === 3 ? 0 : 2);
        if (g.rng.chance(0.4)) g.hardDrop();
        g.frame(0.9); // 大步长推进
      }
      expect(['play', 'over']).toContain(g.state);
      expect(g.score).toBeGreaterThanOrEqual(0);
    });
  }
});
describe('边界：反重力与塌方同帧触发', () => {
  it('无崩溃且状态合法', () => {
    const g = new Game(defaultCfg(), 99, 'normal');
    g.start();
    g.gdir = 1;
    for (let i = 0; i < g.grid.N; i++) if (g.grid.kind[i] !== K.EMPTY) g.grid.attr[i] |= 1;
    collapse(g);
    g.frame(0.016);
    expect(['play', 'over']).toContain(g.state);
  });
});
describe('最小场地 5×5×5', () => {
  it('可正常开局与消除', () => {
    const cfg = clampCfg({ custom: true, W: 5, D: 5, H: 5, dim: 3 });
    const g = new Game(cfg, 5, 'normal');
    g.start();
    expect(g.piece).toBeTruthy();
    g.hardDrop();
    expect(['play', 'over']).toContain(g.state);
  });
});
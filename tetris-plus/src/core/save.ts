import { Game } from './engine';
import { Grid } from './grid';
import { clampCfg } from '../config';
import type { ItemId } from './types';

/** 存档（§5.10）：场地/分数/库存/事件状态，读档无缝续玩 */
export function saveGame(g: Game): string {
  return JSON.stringify({
    v: 1, cfg: g.cfg, diff: g.diffId, seedState: g.rng.state(),
    score: g.score, stage: g.stage, dim: g.dim, gdir: g.gdir,
    inv: g.inv, state: g.state,
    grid: g.grid.serialize(),
    events: g.events.serialize(),
    piece: g.piece, next: g.next, bombs: g.bombs
  });
}
export function loadGame(s: string): Game | null {
  try {
    const o = JSON.parse(s);
    if (o.v !== 1) return null;
    const cfg = clampCfg(o.cfg);
    const g = new Game(cfg, 1, o.diff);
    g.rng.setState(o.seedState);
    g.score = o.score; g.stage = o.stage; g.dim = o.dim; g.gdir = o.gdir;
    g.inv = o.inv; g.state = o.state === 'over' ? 'over' : 'play';
    g.grid = Grid.deserialize(o.grid);
    g.fluid.g = g.grid;
    g.events.restore(o.events, g);
    g.piece = o.piece; g.next = o.next; g.bombs = o.bombs || [];
    if (!g.piece && g.state === 'play') g.spawn();
    return g;
  } catch { return null; }
}
export const SAVE_KEY = 'tetris-plus-save';
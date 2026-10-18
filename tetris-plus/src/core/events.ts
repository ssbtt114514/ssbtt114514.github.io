import type { Game } from './engine';
import { K, GRAV } from './types';
import { settle } from './attrs';
import type { EventId } from './types';
import { EVENT_NAMES } from '../config';

/** 随机事件调度器（§2.7）：同一时刻至多一个持续性事件（裁定 #14） */
export class EventSys {
  active: { id: EventId; t: number } | null = null;
  private bombT = 0; private rainAcc = 0;

  update(dt: number, g: Game) {
    if (!this.active) return;
    const a = this.active;
    a.t -= dt;
    if (a.id === 'bombrain') {
      this.bombT -= dt;
      if (this.bombT <= 0) { this.bombT = 1.0; g.spawnBomb(); }
    } else if (a.id === 'rain') {
      this.rainAcc += g.cfg.rainRate * dt;
      while (this.rainAcc >= 1) { this.rainAcc -= 1; g.spawnRainDrop(); }
    }
    if (a.t <= 0) this.end(g);
  }

  tryTrigger(g: Game) {
    if (this.active || !g.cfg.eventsEnabled) return;
    const w = g.cfg.weights;
    const ids = (Object.keys(w) as EventId[]).filter(k => w[k] > 0);
    if (!ids.length) return;
    if (!g.rng.chance(g.cfg.perLock)) return;
    const total = ids.reduce((s, k) => s + w[k], 0);
    let r = g.rng.next() * total; let pick: EventId = ids[0];
    for (const k of ids) { r -= w[k]; if (r <= 0) { pick = k; break; } }
    if (pick === 'collapse') { collapse(g); g.banner('⚠ 事件：塌方！'); return; }
    let t = 0;
    if (pick === 'antigrav') {
      t = g.rng.range(30, 120);
      g.gdir = 1;
      for (let i = 0; i < g.grid.N; i++) if (g.grid.kind[i] !== K.EMPTY) g.grid.attr[i] |= GRAV;
      settle(g.grid, 1, false);
    } else if (pick === 'bombrain') { t = g.rng.range(10, 60); this.bombT = 0.5; }
    else { t = g.cfg.rainDuration; this.rainAcc = 0; }
    this.active = { id: pick, t };
    g.banner(`⚠ 事件：${EVENT_NAMES[pick]}！`);
    g.sfxEvent();
  }

  end(g: Game) {
    if (!this.active) return;
    if (this.active.id === 'antigrav') { g.gdir = -1; settle(g.grid, -1, true); }
    this.active = null;
    g.banner('事件结束');
  }
  serialize() { return this.active ? { id: this.active.id, t: this.active.t } : null; }
  restore(o: { id: EventId; t: number } | null, g: Game) {
    this.active = o ? { ...o } : null;
    if (o?.id === 'antigrav') g.gdir = 1;
  }
}

/** 塌方（瞬间）：50% 框内随机失稳 / 50% 框壁塌出 3×3×3 缺口 */
export function collapse(g: Game) {
  const grid = g.grid, rng = g.rng;
  if (rng.chance(0.5)) {
    const cand: number[] = [];
    const stride = Math.max(1, Math.floor(grid.N / 4000));
    for (let i = 0; i < grid.N; i += stride) if (grid.kind[i] !== K.EMPTY) cand.push(i);
    for (let k = 0; k < 8 && cand.length; k++) {
      const i = cand[rng.int(cand.length)];
      const [x, y, z] = grid.xyz(i);
      grid.clearCell(i);
      for (let zz = z + 1; zz < grid.H; zz++) grid.attr[grid.idx(x, y, zz)] |= GRAV;
    }
  } else {
    const face = rng.int(4);
    const cx = face < 2 ? (face === 0 ? 0 : grid.W - 1) : 1 + rng.int(Math.max(1, grid.W - 2));
    const cy = face >= 2 ? (face === 2 ? 0 : grid.D - 1) : 1 + rng.int(Math.max(1, grid.D - 2));
    const cz = 1 + rng.int(Math.max(1, grid.H - 2));
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
      const x = cx + dx, y = cy + dy, z = cz + dz;
      if (!grid.inB(x, y, z)) continue;
      const i = grid.idx(x, y, z);
      grid.clearCell(i);
      if (x === 0 || x === grid.W - 1 || y === 0 || y === grid.D - 1) grid.breaches.add(i);
    }
  }
  settle(grid, g.gdir, g.gdir === -1);
}
import { Grid } from './grid';
import { RNG } from './rng';
import { K, GRAV, isFluid } from './types';
import type { ItemId } from './types';
import { Piece, makePiece, rotateCells, fits, spawnPos, boundsOf } from './pieces';
import { detectClears } from './clear';
import { settle } from './attrs';
import { FluidSim } from './fluid';
import { applyItem } from './items';
import { EventSys } from './events';
import {
  GameCfg, DIFFS, FIELD, BASE_MS, FLUID_MS, SOFT_FACTOR,
  stageForScore, ITEM_IDS, ITEM_NAMES
} from '../config';

export interface Aim { x: number; y: number; z: number; }

/**
 * 游戏核心状态机（纯逻辑，可脱离渲染单独单测 —— §3.2）。
 * 主循环严格按 §1：
 * [玩家操作] → [方块运动(重力/软降)] → [碰撞?] → [锁定] → [消除判定]
 * → [计分/事件/掷骰] → [红线判定] → 下一帧。
 */
export class Game {
  cfg: GameCfg; diffId: string; rng: RNG;
  grid: Grid; fluid: FluidSim; events = new EventSys();
  dim: 1 | 2 | 3; stage = 1; score = 0;
  piece: Piece | null = null; next: Piece | null = null;
  inv: Record<ItemId, number> = { tnt: 0, cross: 0, line: 0, sponge: 0, bucket: 0, wall: 0 };
  state: 'menu' | 'play' | 'over' = 'menu';
  paused = false; menuOpen = false;
  gdir: -1 | 1 = -1;                 // 反重力时 = 1
  aim: Aim | null = null;            // 道具瞄准格（鼠标悬停 / 移动端🎯）
  bombs: { x: number; y: number; z: number; t: number }[] = []; // 炸弹雨实体
  overReason = '';
  softDrop = false;
  private gravT = 0; private fluidT = 0;
  private lastLocked: number[] = [];
  private lastTotal = 0;
  // UI 钩子（由 main.ts 注入）
  onBanner: (s: string) => void = () => {};
  onOver: () => void = () => {};
  sfxEvent: () => void = () => {};

  constructor(cfg: GameCfg, seed: number, diffId = 'normal') {
    this.cfg = cfg; this.diffId = diffId;
    this.rng = new RNG(seed);
    this.dim = cfg.custom ? cfg.dim : 1;
    const f = cfg.custom ? { W: cfg.W, D: cfg.D, H: cfg.H } : FIELD[1];
    this.grid = new Grid(f.W, f.D, f.H);
    this.fluid = new FluidSim(this.grid, this.rng);
    for (const id of ITEM_IDS) this.inv[id] = cfg.startItems[id];
  }

  get diff() { return DIFFS[this.diffId] ?? DIFFS.normal; }
  get canPause() { return this.cfg.custom ? this.cfg.pause : this.diff.pause; }
  get dropRate() { return this.cfg.custom ? this.cfg.drop : this.diff.drop; }
  get speed() { return this.cfg.custom ? this.cfg.speed : this.diff.speed; }
  banner(s: string) { this.onBanner(s); }

  start() {
    this.state = 'play';
    this.next = makePiece(this.dim, this.stage, this.rng, this.cfg);
    this.spawn();
  }

  /* ================= 主循环 ================= */
  frame(dt: number) {
    if (this.state !== 'play' || this.paused) return;
    this.events.update(dt, this);
    // 流体 100ms/tick（活跃集合节流，§3.4）
    this.fluidT += dt * 1000;
    while (this.fluidT >= FLUID_MS) { this.fluidT -= FLUID_MS; this.fluid.tick(); }
    // 炸弹雨实体：下落，触底/撞块即按 TNT 爆炸（§5.3）
    for (let i = this.bombs.length - 1; i >= 0; i--) {
      const b = this.bombs[i];
      b.t += dt;
      while (b.t > 0.4) {
        b.t -= 0.4;
        b.z -= 1;
        if (b.z < 0) { // 落地即炸
          this.bombs.splice(i, 1);
          applyItem(this.grid, 'tnt', { x: b.x, y: b.y, z: 0 });
          this.afterBoardChange();
          break;
        }
        if (this.grid.kind[this.grid.idx(b.x, b.y, b.z)] !== K.EMPTY) { // 撞块即炸
          this.bombs.splice(i, 1);
          applyItem(this.grid, 'tnt', { x: b.x, y: b.y, z: Math.min(this.grid.H - 1, b.z + 1) });
          this.afterBoardChange();
          break;
        }
      }
    }
    // 重力（难度/自定义速度倍率 + 软降）
    const interval = (BASE_MS / this.speed) * (this.softDrop ? SOFT_FACTOR : 1);
    this.gravT += dt * 1000;
    while (this.gravT >= interval) {
      this.gravT -= interval;
      if (!this.stepDown()) { this.lockPiece(); break; }
    }
  }

  /* ================= 玩家操作 ================= */
  private cellsOk(p: Piece, ox = 0, oy = 0, oz = 0) {
    return fits(this.grid, p.cells, p.x + ox, p.y + oy, p.z + oz);
  }
  move(dx: number, dy: number): boolean {
    const p = this.piece;
    if (!p || this.state !== 'play' || this.paused) return false;
    if (this.dim < 3 && dy !== 0) return false; // 1D/2D 无深度轴
    if (this.cellsOk(p, dx, dy, 0)) { p.x += dx; p.y += dy; return true; }
    return false;
  }
  rotate(axis: 0 | 1 | 2): boolean {
    const p = this.piece;
    if (!p || this.state !== 'play' || this.paused) return false;
    const nc = rotateCells(p.cells, axis);
    // 墙踢：6 个偏移（§ 裁定 #28）
    for (const [ox, oy, oz] of [[0, 0, 0], [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1]]) {
      if (fits(this.grid, nc, p.x + ox, p.y + oy, p.z + oz)) {
        p.cells = nc; p.x += ox; p.y += oy; p.z += oz;
        return true;
      }
    }
    return false;
  }
  stepDown(): boolean {
    const p = this.piece;
    if (!p) return false;
    const dz = this.gdir === -1 ? -1 : 1;
    if (this.cellsOk(p, 0, 0, dz)) { p.z += dz; return true; }
    return false;
  }
  hardDrop() {
    if (!this.piece || this.state !== 'play' || this.paused) return;
    while (this.stepDown()) { /* 落到底 */ }
    this.lockPiece();
  }
  /** 移动端手势/虚拟键：软降一格（M9） */
  nudgeDown(): boolean {
    if (this.state !== 'play' || this.paused) return false;
    return this.stepDown();
  }

  /* ================= 锁定 → 消除 → 计分 → 红线 ================= */
  lockPiece() {
    const p = this.piece;
    if (!p) return;
    this.piece = null;
    if (p.bomb) { // 炸弹雨：落定即炸，不入堆叠
      applyItem(this.grid, 'tnt', { x: p.x, y: p.y, z: p.z });
      this.afterBoardChange();
      if (this.state === 'play') this.spawn();
      return;
    }
    const locked: number[] = [];
    for (const [cx, cy, cz] of p.cells) {
      const x = p.x + cx, y = p.y + cy, z = p.z + cz;
      const i = this.grid.setCell(x, y, z, p.kind, p.kind === K.SOLID && this.stage >= 4 ? p.color : -1);
      if (p.dye) this.grid.dyeColor[i] = p.color;       // 染色流体
      if (p.grav) this.grid.attr[i] |= GRAV;            // 〔重力〕
      if (p.gas) this.grid.attr[i] = (this.grid.attr[i] & ~6) | ((p.gas & 3) << 1); // 气体等级
      if (isFluid(p.kind)) this.grid.fluidActive.add(i);
      locked.push(i);
    }
    this.lastLocked = locked;
    this.resolveBoard(true);
    // 红线判定（在消除之后，§1 顺序）
    if (this.checkRedLine()) { this.gameOver('堆叠超过红线'); return; }
    this.checkStageUp();
    this.events.tryTrigger(this);
    this.spawn();
  }

  /**
   * 沉降 + 消除循环（同帧多重消除得分累加，§5.1）。
   * fromLock=true（方块锁定引发）才掷骰掉道具（裁定 #38）。
   */
  resolveBoard(fromLock: boolean) {
    this.lastTotal = 0;
    for (let k = 0; k < 6; k++) {
      const moved = settle(this.grid, this.gdir, this.gdir === -1);
      const r = detectClears(this.grid, this.dim, this.stage, k === 0 ? this.lastLocked : undefined);
      if (!r.cells.length && !moved) break;
      if (!r.cells.length) continue;
      const cols = new Set<string>();
      for (const i of r.cells) {
        const [x, y, z] = this.grid.xyz(i);
        this.grid.clearCell(i);
        cols.add(x + ',' + y + ',' + z);
      }
      for (const c of cols) { // 唤醒被消除格上方的流体
        const [x, y, z] = c.split(',').map(Number);
        this.fluid.activateColumn(x, y, z);
      }
      this.score += r.points; this.lastTotal += r.points;
      const notes = [...new Set(r.notes)];
      this.banner(`${notes.join('、')} +${r.points}`);
      this.lastLocked = [];
    }
    if (fromLock && this.lastTotal > 0 && this.rng.chance(this.dropRate)) {
      const id = ITEM_IDS[this.rng.int(ITEM_IDS.length)];
      this.inv[id]++;
      this.banner(`🎁 获得道具：${ITEM_NAMES[id]}`);
    }
  }
  /** 道具/事件/炸弹引发的盘面变化：结算但不掷骰 */
  private afterBoardChange() {
    this.resolveBoard(false);
    if (this.state === 'play' && this.checkRedLine()) this.gameOver('堆叠超过红线');
  }

  /** 红线 = 顶行；反重力期间暂停判负（裁定 #11） */
  checkRedLine(): boolean {
    if (this.gdir === 1) return false;
    const g = this.grid;
    for (let i = (g.H - 1) * g.WD; i < g.H * g.WD; i++) if (g.kind[i] !== K.EMPTY) return true;
    return false;
  }

  checkStageUp() {
    const ns = stageForScore(this.score);
    while (this.stage < ns) {
      this.stage++;
      const names = ['', '一维', '二维经典', '三维立体', '颜色系统', '流体系统'];
      this.banner(`🎉 阶段 ${this.stage} 解锁：${names[this.stage]}`);
      if (!this.cfg.custom) this.resizeForStage();
    }
    if (!this.cfg.custom) this.dim = (Math.min(this.stage, 3) as 1 | 2 | 3);
  }

  /** 阶段切换：场地迁移，已堆方块保留（§2.1 / §5.9） */
  private resizeForStage() {
    const f = FIELD[Math.min(this.stage, 3)];
    const old = this.grid;
    if (old.W === f.W && old.D === f.D && old.H === f.H) return;
    const ng = new Grid(f.W, f.D, f.H);
    const ox = Math.max(0, Math.floor((f.W - old.W) / 2));
    const oy = Math.max(0, Math.floor((f.D - old.D) / 2));
    for (let i = 0; i < old.N; i++) {
      if (old.kind[i] === K.EMPTY) continue;
      const [x, y, z] = old.xyz(i);
      if (!ng.inB(x + ox, y + oy, z)) continue;
      const ni = ng.idx(x + ox, y + oy, z);
      ng.kind[ni] = old.kind[i]; ng.color[ni] = old.color[i]; ng.dye[ni] = old.dye[i];
      ng.dyeColor[ni] = old.dyeColor[i]; ng.attr[ni] = old.attr[i];
      if (isFluid(old.kind[i])) ng.fluidActive.add(ni);
    }
    ng.version++;
    this.grid = ng;
    this.fluid = new FluidSim(ng, this.rng);
  }

  spawn() {
    this.piece = this.next ?? makePiece(this.dim, this.stage, this.rng, this.cfg);
    this.next = makePiece(this.dim, this.stage, this.rng, this.cfg);
    spawnPos(this.grid, this.piece, this.gdir);
    if (!fits(this.grid, this.piece.cells, this.piece.x, this.piece.y, this.piece.z)) {
      this.gameOver('生成位置被占');
      return;
    }
    this.gravT = 0;
  }
  spawnBomb() {
    const x = this.rng.int(this.grid.W), y = this.rng.int(this.grid.D), z = this.grid.H - 1;
    if (this.grid.kind[this.grid.idx(x, y, z)] !== K.EMPTY) return; // 生成位被占则跳过
    this.bombs.push({ x, y, z, t: 0 });
  }
  spawnRainDrop() {
    const g = this.grid;
    const x = this.rng.int(g.W), y = this.rng.int(g.D), z = g.H - 1;
    const i = g.idx(x, y, z);
    if (g.kind[i] === K.EMPTY) { g.setCell(x, y, z, K.WATER); g.fluidActive.add(i); }
  }

  /* ================= 道具（1–6） ================= */
  useItem(slot: number, o?: { axis?: number; size?: number }): boolean {
    if (this.state !== 'play' || this.paused) return false;
    const id = ITEM_IDS[slot];
    if (!id || this.inv[id] <= 0) { this.banner('（无此道具）'); return false; }
    const t = this.aim ?? this.fallbackAim();
    applyItem(this.grid, id, t, o);
    this.inv[id]--;
    this.afterBoardChange();
    if (this.state === 'play') this.checkStageUp();
    return true;
  }
  private fallbackAim(): Aim {
    const p = this.piece;
    if (p) {
      const b = boundsOf(p.cells);
      return {
        x: Math.min(this.grid.W - 1, p.x + (b.w >> 1)),
        y: Math.min(this.grid.D - 1, p.y + (b.d >> 1)),
        z: Math.max(0, p.z - 1)
      };
    }
    return { x: this.grid.W >> 1, y: this.grid.D >> 1, z: 0 };
  }

  /* ================= 暂停 / 结束 ================= */
  /** 不可暂停难度（难/极难）：仅呼出菜单，游戏继续（§2.4） */
  tryPause(): { paused: boolean } {
    if (!this.canPause) { this.menuOpen = true; return { paused: false }; }
    this.paused = !this.paused;
    return { paused: this.paused };
  }
  gameOver(reason: string) {
    if (this.state === 'over') return;
    this.state = 'over'; this.overReason = reason;
    this.onOver();
  }
}
import type { EventId, ItemId } from './core/types';

/** ===== §2 锁定数值（禁止修改） ===== */
export const STAGE_T = [0, 100, 800, 10000, 50000];                 // 2.1 解锁分
export const FIELD: Record<number, { W: number; D: number; H: number }> = {
  1: { W: 6, D: 1, H: 12 }, 2: { W: 10, D: 1, H: 20 }, 3: { W: 10, D: 10, H: 20 }
};
export const SCORE = { col1: 20, row2: 50, line3: 100, layer3: 500, colorClear: 500, rubikLayer: 500 };
export const DIFFS: Record<string, { name: string; speed: number; drop: number; pause: boolean }> = {
  easy:    { name: '简单', speed: 0.5, drop: 0.4, pause: true },
  normal:  { name: '正常', speed: 1.0, drop: 0.3, pause: true },
  hard:    { name: '较难', speed: 1.2, drop: 0.3, pause: true },
  expert:  { name: '难',   speed: 1.5, drop: 0.2, pause: false },
  extreme: { name: '极难', speed: 2.0, drop: 0.0, pause: false }
};
export const COLORS6 = [0xffffff, 0xffe135, 0xff8c1a, 0x3fbf4a, 0xe63946, 0x3a86ff]; // 白黄橙绿红蓝
export const COLOR_NAMES = ['白', '黄', '橙', '绿', '红', '蓝'];

/** ===== 可调参数（集中于此） ===== */
export const BASE_MS = 800;        // 1.0x 基础下落间隔
export const FLUID_MS = 100;       // 流体 CA tick
export const SOFT_FACTOR = 0.1;    // 软降加速系数
export const MAX_RENDER = 150000;  // 渲染实例上限（逻辑不受限）
export const RED_LINE_Z = 1;       // 红线 = 顶行（见 ASSUMPTIONS #3）

export const ITEM_IDS: ItemId[] = ['tnt', 'cross', 'line', 'sponge', 'bucket', 'wall'];
export const ITEM_NAMES: Record<ItemId, string> = {
  tnt: 'TNT', cross: '十字TNT', line: '一字TNT', sponge: '海绵', bucket: '排水桶', wall: '墙壁炸弹'
};
export const EVENT_NAMES: Record<EventId, string> = {
  antigrav: '反重力', bombrain: '炸弹雨', rain: '雨天', collapse: '塌方'
};

export interface GameCfg {
  custom: boolean;
  W: number; D: number; H: number; dim: 1 | 2 | 3;
  speed: number; drop: number; pause: boolean;
  eventsEnabled: boolean; perLock: number;
  weights: Record<EventId, number>;
  rainRate: number; rainDuration: number;
  attrs: { grav: number; gas: number; liquid: number; dye: number };
  startItems: Record<ItemId, number>;
}

export function defaultCfg(): GameCfg {
  return {
    custom: false, W: 6, D: 1, H: 12, dim: 1,
    speed: 1, drop: 0.3, pause: true,
    eventsEnabled: true, perLock: 0.03,
    weights: { antigrav: 1, bombrain: 1, rain: 1, collapse: 1 },
    rainRate: 0.2, rainDuration: 30,
    attrs: { grav: 0, gas: 0, liquid: 0, dye: 0 },
    startItems: { tnt: 0, cross: 0, line: 0, sponge: 0, bucket: 0, wall: 0 }
  };
}
/** 自定义参数校验（2.8 尺寸范围 5×5×5 ~ 100×100×50） */
export function clampCfg(c: any): GameCfg {
  const d = defaultCfg();
  const num = (v: any, lo: number, hi: number, fb: number) =>
    Number.isFinite(+v) ? Math.min(hi, Math.max(lo, +v)) : fb;
  d.custom = !!c?.custom;
  d.W = Math.round(num(c?.W, 5, 100, 6));
  d.D = Math.round(num(c?.D, 5, 100, 5));
  d.H = Math.round(num(c?.H, 5, 50, 12));
  d.dim = ([1, 2, 3].includes(+c?.dim) ? +c.dim : 1) as 1 | 2 | 3;
  if (d.dim === 1) d.D = 1;
  if (d.dim === 2) d.D = 1;
  d.speed = num(c?.speed, 0.1, 10, 1);
  d.drop = num(c?.drop, 0, 1, 0.3);
  d.pause = c?.pause !== false;
  d.eventsEnabled = c?.eventsEnabled !== false;
  d.perLock = num(c?.perLock, 0, 1, 0.03);
  for (const k of ['antigrav', 'bombrain', 'rain', 'collapse'] as EventId[])
    d.weights[k] = num(c?.weights?.[k], 0, 100, 1);
  d.rainRate = num(c?.rainRate, 0, 10, 0.2);
  d.rainDuration = num(c?.rainDuration, 1, 600, 30);
  for (const k of ['grav', 'gas', 'liquid', 'dye'] as const)
    d.attrs[k] = num(c?.attrs?.[k], 0, 1, 0);
  for (const id of ITEM_IDS) d.startItems[id] = Math.round(num(c?.startItems?.[id], 0, 99, 0));
  return d;
}
export function stageForScore(s: number): number {
  let st = 1;
  for (let i = 0; i < STAGE_T.length; i++) if (s >= STAGE_T[i]) st = i + 1;
  return st;
}
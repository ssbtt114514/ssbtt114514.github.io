/** 方块种类 */
export const K = { EMPTY: 0, SOLID: 1, WATER: 2, LAVA: 3, STONE: 4 } as const;
export type ItemId = 'tnt' | 'cross' | 'line' | 'sponge' | 'bucket' | 'wall';
export type EventId = 'antigrav' | 'bombrain' | 'rain' | 'collapse';
/** attr 位标记：bit0=〔重力〕；bit1-2=气体等级(0~3) */
export const GRAV = 1;
export const gasLevel = (a: number) => (a >> 1) & 3;
export const withGas = (a: number, l: number) => (a & ~6) | ((l & 3) << 1);
/** 面索引：0:+x 1:-x 2:+y 3:-y 4:+z 5:-z（与 dye 位掩码一致） */
export function isFluid(k: number): boolean { return k === K.WATER || k === K.LAVA; }
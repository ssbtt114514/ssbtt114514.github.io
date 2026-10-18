import type { Game } from '../core/engine';
import { ITEM_IDS, ITEM_NAMES, EVENT_NAMES, COLOR_NAMES } from '../config';
import type { ItemId } from '../core/types';

const $ = (id: string) => document.getElementById(id)!;
const STAGE_NAME = ['', '一维', '二维经典', '三维立体', '颜色系统', '流体系统'];

export class Hud {
  private bannerTimer = 0;
  constructor() { this.refreshInv({} as Record<ItemId, number>); }
  banner(text: string, ms = 2200) {
    const b = $('banner');
    b.textContent = text; b.style.opacity = '1';
    clearTimeout(this.bannerTimer);
    this.bannerTimer = setTimeout(() => (b.style.opacity = '0'), ms) as any;
  }
  refreshInv(inv: Record<ItemId, number>) {
    $('hud-inv').innerHTML = ITEM_IDS.map((id, i) =>
      `<div class="inv-row"><span><kbd>${i + 1}</kbd> ${ITEM_NAMES[id]}</span><b>×${inv?.[id] ?? 0}</b></div>`).join('');
  }
  drawNext(g: Game) {
    const el = $('next');
    const p = g.next;
    if (!p) { el.innerHTML = ''; return; }
    // x-z 平面投影（流体不进预览 §5.2）
    const w = Math.max(...p.cells.map(c => c[0])) + 1;
    const h = Math.max(...p.cells.map(c => c[2])) + 1;
    const set = new Set(p.cells.map(c => c[0] + ',' + c[2]));
    el.style.gridTemplateColumns = `repeat(${w},14px)`;
    let html = '';
    for (let z = h - 1; z >= 0; z--) for (let x = 0; x < w; x++) {
      const on = set.has(x + ',' + z);
      const col = p.color >= 0 ? ['#fff', '#ffe135', '#ff8c1a', '#3fbf4a', '#e63946', '#3a86ff'][p.color] : '#9db4d0';
      html += `<div style="background:${on ? col : '#16202f'}"></div>`;
    }
    el.innerHTML = html;
  }
  update(g: Game, fps: number) {
    $('hud-score').textContent = String(g.score);
    $('hud-stage').textContent = `${g.stage}`;
    $('hud-stagename').textContent = STAGE_NAME[g.stage];
    $('hud-diff').textContent = g.diff.name;
    $('hud-pause').textContent = g.canPause ? '' : '（不可暂停）';
    $('hud-fps').textContent = String(fps);
    const a = g.events.active;
    $('hud-event').textContent = a ? `事件：${EVENT_NAMES[a.id]} 剩余 ${Math.ceil(a.t)}s` : '';
  }
}
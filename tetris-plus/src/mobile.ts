import type { Game } from './core/engine';
import { ITEM_IDS } from './config';
import type { ItemId } from './core/types';

/** 全局标记：瞄准模式（移动端代替桌面"鼠标悬停瞄准"） */
export const MobileFlags = { aimMode: false };

export function isTouchDevice(): boolean {
  try {
    return matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  } catch { return false; }
}

const SHORT: Record<string, string> = { tnt: 'TNT', cross: '✚', line: '━', sponge: '绵', bucket: '桶', wall: '墙' };

/** 移动端虚拟按键 + 道具栏（仅触屏设备挂载） */
export class MobileControls {
  root: HTMLDivElement;
  private countEls: HTMLSpanElement[] = [];
  private aimBtn!: HTMLButtonElement;

  constructor(private getGame: () => Game | null) {
    this.root = document.createElement('div');
    this.root.id = 'mobile-ui';
    this.build();
    document.body.appendChild(this.root);
  }
  private mk(txt: string, fn: () => void, parent: HTMLElement, cls = ''): HTMLButtonElement {
    const b = document.createElement('button');
    b.className = cls;
    b.innerHTML = txt;
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation();
      const g = this.getGame();
      if (!g || g.state !== 'play' || g.paused || g.menuOpen) return;
      fn();
    });
    parent.appendChild(b);
    return b;
  }
  private build() {
    const g = () => this.getGame()!;
    // —— 左侧：移动/旋转/硬降 ——
    const left = document.createElement('div'); left.className = 'cluster';
    this.root.appendChild(left);
    this.mk('◀', () => g().move(-1, 0), left);
    this.mk('▶', () => g().move(1, 0), left);
    this.mk('▲', () => { if (g().dim === 3) g().move(0, 1); }, left);   // 3D=深度
    this.mk('▼', () => g().nudgeDown(), left);                          // 软降一格
    this.mk('⟳', () => g().rotate(g().dim === 3 ? 0 : 2), left);
    this.mk('⤓', () => g().hardDrop(), left);
    // —— 右侧：瞄准开关 + 道具栏 ——
    const right = document.createElement('div'); right.className = 'cluster items';
    this.root.appendChild(right);
    this.aimBtn = this.mk('🎯', () => {
      MobileFlags.aimMode = !MobileFlags.aimMode;
      this.aimBtn.classList.toggle('on', MobileFlags.aimMode);
    }, right, 'aim');
    ITEM_IDS.forEach((id, i) => {
      const b = this.mk(
        `${SHORT[id]}<br><span class="cnt">×0</span>`,
        () => {
          const gg = g();
          if (id === 'line') gg.useItem(i, { axis: 0 });      // 移动端固定 X 轴（裁定#34）
          else if (id === 'wall') gg.useItem(i, { size: 3 }); // 移动端固定 3³（裁定#34）
          else gg.useItem(i);
        },
        right
      );
      this.countEls[i] = b.querySelector('.cnt') as HTMLSpanElement;
    });
  }
  update(inv: Record<ItemId, number>, visible: boolean) {
    this.root.style.display = visible ? 'flex' : 'none';
    if (visible) ITEM_IDS.forEach((id, i) => { this.countEls[i].textContent = '×' + (inv[id] ?? 0); });
  }
}
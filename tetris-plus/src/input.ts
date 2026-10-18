import type { Game } from './core/engine';
import type { Renderer } from './render/renderer';
import { MobileFlags } from './mobile';

/**
 * 输入层（M9 重写）：
 * 桌面：键盘照旧；鼠标拖拽=视角、悬停=瞄准、点击=定点。
 * 触屏：单指横拖=左右移动；竖拖=软降(1D/2D)或深度(3D)；轻点=旋转；
 *       快速下滑=硬降；双指=相机旋转+捏合缩放；🎯模式下轻点=设置道具目标。
 */
export function bindInput(game: () => Game, rend: Renderer, onEsc: () => void) {
  // ---------- 键盘（与原版一致） ----------
  addEventListener('keydown', (e) => {
    const g = game();
    if (e.code === 'Escape') { onEsc(); return; }
    if (g.state !== 'play') return;
    switch (e.code) {
      case 'ArrowLeft': g.move(-1, 0); e.preventDefault(); break;
      case 'ArrowRight': g.move(1, 0); e.preventDefault(); break;
      case 'ArrowUp': if (g.dim === 3) g.move(0, 1); e.preventDefault(); break;
      case 'ArrowDown': if (g.dim === 3) g.move(0, -1); else g.softDrop = true; e.preventDefault(); break;
      case 'KeyQ': case 'KeyE': g.rotate(g.dim === 3 ? 0 : 2); break;
      case 'KeyR': case 'KeyF': if (g.dim === 3) g.rotate(1); break;
      case 'KeyT': case 'KeyG': if (g.dim === 3) g.rotate(2); break;
      case 'ShiftLeft': case 'ShiftRight': if (g.dim === 3) g.softDrop = true; break;
      case 'Space': g.hardDrop(); e.preventDefault(); break;
      case 'Digit1': g.useItem(0); break;
      case 'Digit2': g.useItem(1); break;
      case 'Digit3': g.useItem(2, { axis: e.shiftKey ? 1 : e.altKey ? 2 : 0 }); break;
      case 'Digit4': g.useItem(3); break;
      case 'Digit5': g.useItem(4); break;
      case 'Digit6': g.useItem(5, { size: e.shiftKey ? 5 : 3 }); break;
    }
  });
  addEventListener('keyup', (e) => {
    const g = game();
    if (['ArrowDown', 'ShiftLeft', 'ShiftRight'].includes(e.code)) g.softDrop = false;
  });

  const cv = rend.renderer.domElement;
  cv.addEventListener('contextmenu', e => e.preventDefault());

  type PInfo = {
    x: number; y: number; sx: number; sy: number; t: number;
    moved: number; accX: number; accY: number; type: string;
  };
  const pointers = new Map<number, PInfo>();
  let pinchD = 0;
  const TH_X = 30, TH_Y = 26; // 每拖过阈值触发一格

  cv.addEventListener('pointerdown', (e) => {
    cv.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, {
      x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY,
      t: performance.now(), moved: 0, accX: 0, accY: 0, type: e.pointerType
    });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchD = Math.hypot(a.x - b.x, a.y - b.y);
    }
  });

  cv.addEventListener('pointermove', (e) => {
    const g = game();
    const p = pointers.get(e.pointerId);
    if (!p) {
      if (e.pointerType === 'mouse') g.aim = rend.pick(e.clientX, e.clientY); // 桌面悬停瞄准
      return;
    }
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    p.moved += Math.abs(dx) + Math.abs(dy);

    if (pointers.size >= 2) { // 双指：相机 + 缩放
      if (g.dim === 3) {
        rend.yaw -= dx * 0.008;
        rend.pitch = Math.max(-0.1, Math.min(1.35, rend.pitch + dy * 0.006));
      }
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchD > 0 && d > 0) rend.dist = Math.max(6, Math.min(400, rend.dist * (pinchD / d)));
      pinchD = d;
      return;
    }

    if (p.type === 'mouse') { // 桌面：按住拖拽=转视角（原行为）
      if (g.dim === 3 && (e.buttons & 1)) {
        rend.yaw -= dx * 0.008;
        rend.pitch = Math.max(-0.1, Math.min(1.35, rend.pitch + dy * 0.006));
      }
      return;
    }

    // ---------- 触屏单指：操控方块 ----------
    if (g.state !== 'play' || g.paused || g.menuOpen) return;
    p.accX += dx; p.accY += dy;
    while (p.accX >= TH_X) { p.accX -= TH_X; g.move(1, 0); }
    while (p.accX <= -TH_X) { p.accX += TH_X; g.move(-1, 0); }
    if (g.dim === 3) {
      while (p.accY >= TH_Y) { p.accY -= TH_Y; g.move(0, -1); }  // 下拖=靠近
      while (p.accY <= -TH_Y) { p.accY += TH_Y; g.move(0, 1); }   // 上拖=远离
    } else {
      while (p.accY >= TH_Y) { p.accY -= TH_Y; g.nudgeDown(); }   // 下拖=软降
    }
  });

  const onUp = (e: PointerEvent) => {
    const p = pointers.get(e.pointerId);
    pointers.delete(e.pointerId);
    pinchD = 0;
    if (!p) return;
    const g = game();
    if (p.type === 'mouse') {
      if (p.moved < 6) g.aim = rend.pick(e.clientX, e.clientY); // 点击定点
      return;
    }
    const dt = performance.now() - p.t;
    if (p.moved < 12 && dt < 300) { // 轻点
      if (g.state !== 'play' || g.paused || g.menuOpen) return;
      if (MobileFlags.aimMode) g.aim = rend.pick(e.clientX, e.clientY);
      else g.rotate(g.dim === 3 ? 0 : 2);
      return;
    }
    // 快速下滑 = 硬降（1D/2D）
    const dyTotal = e.clientY - p.sy;
    if (g.dim < 3 && dyTotal > 90 && dt < 240 && g.state === 'play') g.hardDrop();
  };
  cv.addEventListener('pointerup', onUp);
  cv.addEventListener('pointercancel', onUp);
}
import { Game } from './core/engine';
import { DIFFS, clampCfg, defaultCfg, GameCfg } from './config';
import { saveGame, loadGame, SAVE_KEY } from './core/save';
import { sfx } from './audio';

const $ = (id: string) => document.getElementById(id)!;

/** 菜单 / 暂停 / 结算 / 自定义编辑器（M7）；含移动端说明（M9） */
export class UI {
  private root = $('screens');
  constructor(
    private getGame: () => Game,
    private startGame: (cfg: GameCfg, diffId: string) => void,
    private reload: (g: Game) => void
  ) {}
  clear() { this.root.innerHTML = ''; }

  /* ---------- 主菜单 ---------- */
  main() {
    this.clear();
    const diffs = Object.entries(DIFFS).map(([k, d]) =>
      `<button data-d="${k}">${d.name}（${d.speed}× 掉率${d.drop * 100}% ${d.pause ? '可暂停' : '不可暂停'}）</button>`).join('<br/>');
    this.root.innerHTML = `<div class="screen"><div class="card">
      <h1>俄罗斯方块 Plus</h1>
      <div class="dim">一维→二维→三维→颜色→流体，按累计分数解锁</div>
      <h2>选择难度开始</h2>${diffs}
      <hr style="border-color:#263042"/>
      <button class="sec" id="btn-custom">自定义模式</button>
      <button class="sec" id="btn-load">读档</button>
      <button class="sec" id="btn-help">键位说明</button>
    </div></div>`;
    this.root.querySelectorAll('button[data-d]').forEach(b =>
      b.addEventListener('click', () => { sfx.click(); this.startGame(defaultCfg(), (b as HTMLElement).dataset.d!); }));
    $('btn-custom').onclick = () => { sfx.click(); this.custom(); };
    $('btn-load').onclick = () => {
      sfx.click();
      const s = localStorage.getItem(SAVE_KEY);
      const g = s && loadGame(s);
      if (g) this.reload(g); else alert('没有可用存档');
    };
    $('btn-help').onclick = () => { sfx.click(); this.help(); };
  }

  /* ---------- 键位说明（桌面 + 移动端） ---------- */
  help() {
    this.clear();
    this.root.innerHTML = `<div class="screen"><div class="card">
      <h1>键位（桌面）</h1>
      <p><kbd>←→</kbd> 横向移动　<kbd>↑↓</kbd> 3D 深度移动 / 2D 软降</p>
      <p><kbd>Q/E</kbd> 旋转（2D 平面内 / 3D 绕 z）　<kbd>R/F</kbd> 3D 绕 x　<kbd>T/G</kbd> 3D 绕 y</p>
      <p><kbd>Space</kbd> 硬降　<kbd>Shift</kbd> 软降（3D）</p>
      <p><kbd>1</kbd> TNT　<kbd>2</kbd> 十字TNT　<kbd>3</kbd> 一字TNT（+Shift/Alt 选 Y/Z 轴）<br/>
      <kbd>4</kbd> 海绵　<kbd>5</kbd> 排水桶　<kbd>6</kbd> 墙壁炸弹（+Shift=5×5×5）</p>
      <p><kbd>Esc</kbd> 暂停/菜单（不可暂停难度下游戏继续）　鼠标拖拽转视角、滚轮缩放、悬停瞄准道具目标</p>
      <h2>移动端（触屏）</h2>
      <p>单指左右拖=移动；单指向下拖=软降（3D 为深度移动）；轻点=旋转；快速下滑=硬降；
      双指拖=转视角、捏合=缩放；右上 ⏸ = 菜单/暂停。</p>
      <p>道具：点右下角道具按钮对 🎯 瞄准点使用；先点 🎯 再轻点场景可设置瞄准格。</p>
      <button class="sec" id="btn-help-back">返回</button>
    </div></div>`;
    $('btn-help-back').onclick = () => { sfx.click(); this.main(); };
  }

  /* ---------- 暂停菜单 ---------- */
  pause(canPause: boolean) {
    this.clear();
    this.root.innerHTML = `<div class="screen"><div class="card">
      <h1>${canPause ? '已暂停' : '菜单（游戏继续中）'}</h1>
      <button id="p-resume">${canPause ? '继续' : '关闭菜单'}</button>
      <button id="p-save">存档</button>
      <button id="p-restart" class="sec">重新开始</button>
      <button id="p-main" class="sec">回主菜单</button>
    </div></div>`;
    $('p-resume').onclick = () => {
      sfx.click();
      this.getGame().menuOpen = false;
      if (canPause) this.getGame().paused = false;
      this.clear();
    };
    $('p-save').onclick = () => {
      localStorage.setItem(SAVE_KEY, saveGame(this.getGame()));
      this.bannerSaved();
    };
    $('p-restart').onclick = () => { sfx.click(); location.reload(); };
    $('p-main').onclick = () => { sfx.click(); location.reload(); };
  }
  private bannerSaved() {
    const b = $('banner');
    b.textContent = '已存档'; b.style.opacity = '1';
    setTimeout(() => (b.style.opacity = '0'), 1200);
  }

  /* ---------- 结算 ---------- */
  over(g: Game) {
    this.clear();
    this.root.innerHTML = `<div class="screen"><div class="card">
      <h1>游戏结束</h1>
      <p>${g.overReason}</p>
      <p>最终分数：<b style="font-size:26px;color:#ffd75e">${g.score}</b>　到达阶段：${g.stage}</p>
      <button id="o-again">再来一局</button>
      <button id="o-main" class="sec">回主菜单</button>
    </div></div>`;
    $('o-again').onclick = () => { sfx.click(); this.startGame(g.cfg, g.diffId); };
    $('o-main').onclick = () => { sfx.click(); location.reload(); };
  }

  /* ---------- 自定义模式编辑器（§2.8，全参数 JSON 导入/导出） ---------- */
  custom() {
    this.clear();
    this.root.innerHTML = `<div class="screen"><div class="card">
      <h1>自定义模式</h1>
      <div class="row">
        <div>
          <h2>场地</h2>
          <label>宽 W(5-100) <input type="number" id="cW" value="10"/></label>
          <label>深 D(5-100) <input type="number" id="cD" value="10"/></label>
          <label>高 H(5-50) <input type="number" id="cH" value="20"/></label>
          <label>维度 <select id="cdim"><option value="1">1D</option><option value="2">2D</option><option value="3" selected>3D</option></select></label>
          <h2>难度参数</h2>
          <label>下落速度倍率 <input type="number" id="cspeed" value="1" step="0.1"/></label>
          <label>道具掉率(0-1) <input type="number" id="cdrop" value="0.3" step="0.05"/></label>
          <label>允许暂停 <input type="checkbox" id="cpause" checked/></label>
        </div>
        <div>
          <h2>事件</h2>
          <label>启用 <input type="checkbox" id="cevon" checked/></label>
          <label>每次锁定触发率 <input type="number" id="cper" value="0.03" step="0.01"/></label>
          <label>反重力权重 <input type="number" id="w0" value="1"/></label>
          <label>炸弹雨权重 <input type="number" id="w1" value="1"/></label>
          <label>雨天权重 <input type="number" id="w2" value="1"/></label>
          <label>塌方权重 <input type="number" id="w3" value="1"/></label>
          <label>雨速率(格/秒) <input type="number" id="crr" value="0.2" step="0.1"/></label>
          <label>雨时长(秒) <input type="number" id="crd" value="30"/></label>
        </div>
        <div>
          <h2>方块属性概率(0-1)</h2>
          <label>重力 <input type="number" id="a0" value="0" step="0.05"/></label>
          <label>气体 <input type="number" id="a1" value="0" step="0.05"/></label>
          <label>液体 <input type="number" id="a2" value="0" step="0.05"/></label>
          <label>染色 <input type="number" id="a3" value="0" step="0.05"/></label>
          <h2>初始道具</h2>
          <label>TNT <input type="number" id="i0" value="0"/> 十字 <input type="number" id="i1" value="0"/> 一字 <input type="number" id="i2" value="0"/></label>
          <label>海绵 <input type="number" id="i3" value="0"/> 水桶 <input type="number" id="i4" value="0"/> 墙炸 <input type="number" id="i5" value="0"/></label>
        </div>
      </div>
      <hr style="border-color:#263042"/>
      <button id="c-start">开始游戏</button>
      <button id="c-export" class="sec">导出 JSON</button>
      <button id="c-import-btn" class="sec">导入 JSON</button>
      <input type="file" id="c-import" accept=".json,application/json" style="display:none"/>
      <button id="c-back" class="sec">返回</button>
    </div></div>`;

    const gv = (id: string) => ($(id) as HTMLInputElement).value;
    const build = (): any => ({
      custom: true,
      W: +gv('cW'), D: +gv('cD'), H: +gv('cH'), dim: +gv('cdim'),
      speed: +gv('cspeed'), drop: +gv('cdrop'),
      pause: ($( 'cpause') as HTMLInputElement).checked,
      eventsEnabled: ($('cevon') as HTMLInputElement).checked,
      perLock: +gv('cper'),
      weights: { antigrav: +gv('w0'), bombrain: +gv('w1'), rain: +gv('w2'), collapse: +gv('w3') },
      rainRate: +gv('crr'), rainDuration: +gv('crd'),
      attrs: { grav: +gv('a0'), gas: +gv('a1'), liquid: +gv('a2'), dye: +gv('a3') },
      startItems: {
        tnt: +gv('i0'), cross: +gv('i1'), line: +gv('i2'),
        sponge: +gv('i3'), bucket: +gv('i4'), wall: +gv('i5')
      }
    });
    const apply = (o: any) => {
      const set = (id: string, v: any) => {
        const el = $(id) as HTMLInputElement;
        if (!el || v == null) return;
        if (el.type === 'checkbox') el.checked = !!v; else el.value = String(v);
      };
      set('cW', o.W); set('cD', o.D); set('cH', o.H); set('cdim', o.dim);
      set('cspeed', o.speed); set('cdrop', o.drop); set('cpause', o.pause);
      set('cevon', o.eventsEnabled); set('cper', o.perLock);
      set('w0', o.weights?.antigrav); set('w1', o.weights?.bombrain);
      set('w2', o.weights?.rain); set('w3', o.weights?.collapse);
      set('crr', o.rainRate); set('crd', o.rainDuration);
      set('a0', o.attrs?.grav); set('a1', o.attrs?.gas); set('a2', o.attrs?.liquid); set('a3', o.attrs?.dye);
      set('i0', o.startItems?.tnt); set('i1', o.startItems?.cross); set('i2', o.startItems?.line);
      set('i3', o.startItems?.sponge); set('i4', o.startItems?.bucket); set('i5', o.startItems?.wall);
    };

    $('c-start').onclick = () => { sfx.click(); this.startGame(clampCfg(build()), 'normal'); };
    $('c-export').onclick = () => {
      const blob = new Blob([JSON.stringify(build(), null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'tetris-plus-custom.json';
      a.click();
      URL.revokeObjectURL(a.href);
    };
    $('c-import-btn').onclick = () => ($('c-import') as HTMLInputElement).click();
    ($('c-import') as HTMLInputElement).onchange = (ev) => {
      const f = (ev.target as HTMLInputElement).files?.[0];
      if (!f) return;
      const rd = new FileReader();
      rd.onload = () => {
        try { apply(JSON.parse(String(rd.result))); }
        catch { alert('JSON 解析失败'); }
      };
      rd.readAsText(f);
    };
    $('c-back').onclick = () => { sfx.click(); this.main(); };
  }
}
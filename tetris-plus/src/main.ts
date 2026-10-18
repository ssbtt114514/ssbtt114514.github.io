import { Game } from './core/engine';
import { Renderer } from './render/renderer';
import { Hud } from './render/hud';
import { UI } from './ui';
import { bindInput } from './input';
import { sfx } from './audio';
import { GameCfg } from './config';
import { hashSeed } from './core/rng';
import { MobileControls, isTouchDevice } from './mobile';

const params = new URLSearchParams(location.search);
const SEED = params.get('seed') ? hashSeed(params.get('seed')!) : (Date.now() % 1e9);
const IS_TOUCH = isTouchDevice();

let game: Game | null = null;
let renderer: Renderer | null = null;
let inputBound = false;
let mobile: MobileControls | null = null;
let hintDismissed = false;
let lastOrientShown: boolean | null = null;
const canvas = document.getElementById('c') as HTMLCanvasElement;
const hud = new Hud();

function wire(g: Game) {
  g.onBanner = (s) => {
    hud.banner(s);
    if (s.includes('阶段')) sfx.stage();
    else if (s.includes('事件')) sfx.event();
    else if (s.includes('消除') || s.includes('魔方')) sfx.clear();
    else if (s.includes('道具')) sfx.click();
  };
  g.onOver = () => { sfx.over(); ui.over(g); };
  g.sfxEvent = () => sfx.event();
}
function attachRenderer(g: Game) {
  if (!renderer) renderer = new Renderer(canvas, g);
  else (renderer as any).game = g;
}
function toggleMenu() {
  const g = game;
  if (!g || g.state !== 'play') return;
  g.menuOpen = !g.menuOpen;
  if (g.menuOpen) { const r = g.tryPause(); ui.pause(r.paused); }
  else { g.paused = false; ui.clear(); }
}
function startGame(cfg: GameCfg, diffId: string) {
  game = new Game(cfg, SEED, diffId);
  wire(game); game.start();
  ui.clear(); hud.refreshInv(game.inv); hud.drawNext(game);
  attachRenderer(game);
  if (!inputBound && renderer) {
    inputBound = true;
    bindInput(() => game!, renderer!, toggleMenu);
  }
}
function reloadGame(g: Game) {
  game = g; wire(g);
  ui.clear(); hud.refreshInv(g.inv); hud.drawNext(g);
  attachRenderer(g);
}
const ui = new UI(() => game!, startGame, reloadGame);
ui.main();

// ===== M9：移动端装配 =====
if (IS_TOUCH) {
  mobile = new MobileControls(() => game);
  const mp = document.getElementById('m-pause');
  if (mp) {
    mp.style.display = 'block';
    mp.addEventListener('pointerdown', (e) => { e.preventDefault(); toggleMenu(); });
  }
  addEventListener('gesturestart' as any, (e: any) => e.preventDefault()); // iOS 双指缩放页面防护
}
addEventListener('pointerdown', () => sfx.unlock(), { passive: true }); // 首次触摸解锁音频（iOS）

function checkOrient() {
  const hint = document.getElementById('rotate-hint');
  if (!hint) return;
  const show = IS_TOUCH && !hintDismissed && innerHeight > innerWidth && game?.state === 'play';
  if (show !== lastOrientShown) { hint.style.display = show ? 'flex' : 'none'; lastOrientShown = show; }
}
document.getElementById('rotate-hint')?.addEventListener('pointerdown', () => { hintDismissed = true; checkOrient(); });
addEventListener('resize', () => { renderer?.resize(); checkOrient(); });

let last = performance.now();
let nextDrawn: any = null;
function loop(t: number) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (t - last) / 1000); last = t;
  if (!game) return;
  const invBefore = JSON.stringify(game.inv);
  game.frame(dt);
  if (JSON.stringify(game.inv) !== invBefore) hud.refreshInv(game.inv);
  if (nextDrawn !== game.next) { hud.drawNext(game); nextDrawn = game.next; }
  if (renderer) { renderer.sync(); renderer.render(dt); hud.update(game, renderer.fps); }
  if (mobile) mobile.update(game.inv, game.state === 'play' && !game.menuOpen && !game.paused);
  checkOrient();
}
requestAnimationFrame(loop);
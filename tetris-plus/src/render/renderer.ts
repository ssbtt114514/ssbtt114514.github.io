import * as THREE from 'three';
import type { Game } from '../core/engine';
import { K } from '../core/types';
import { COLORS6, MAX_RENDER } from '../config';

/** 渲染层：InstancedMesh 重建（仅 grid.version 变化时）、轨道相机、鼠标瞄准 */
export class Renderer {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(55, 1, 0.1, 2000);
  renderer: THREE.WebGLRenderer;
  solidMesh: THREE.InstancedMesh; fluidMesh: THREE.InstancedMesh;
  private idxS: number[] = []; private idxF: number[] = [];
  private lastV = -1; private lastDims = '';
  box: THREE.LineSegments | null = null;
  redLine: THREE.LineLoop | null = null;
  private vol: THREE.Mesh | null = null;
  private piecePool: THREE.Mesh[] = [];
  private bombPool: THREE.Mesh[] = [];
  aimBox: THREE.LineSegments;
  yaw = Math.PI; pitch = 0.32; dist = 30;
  private target = new THREE.Vector3();
  private ray = new THREE.Raycaster();
  fps = 60; private fpsN = 0; private fpsT = 0;

  constructor(canvas: HTMLCanvasElement, private game: Game) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.scene.background = new THREE.Color(0x0b0e14);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const dl = new THREE.DirectionalLight(0xffffff, 0.9);
    dl.position.set(20, 40, -15);
    this.scene.add(dl);
    const geo = new THREE.BoxGeometry(0.96, 0.96, 0.96);
    this.solidMesh = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial(), MAX_RENDER);
    this.fluidMesh = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ transparent: true, opacity: 0.75 }), 50000);
    this.solidMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.fluidMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.scene.add(this.solidMesh, this.fluidMesh);
    for (let i = 0; i < 8; i++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.98, 0.98), new THREE.MeshLambertMaterial());
      m.visible = false; this.scene.add(m); this.piecePool.push(m);
    }
    for (let i = 0; i < 16; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.38), new THREE.MeshLambertMaterial({ color: 0x111111, emissive: 0xff2200, emissiveIntensity: 0.7 }));
      m.visible = false; this.scene.add(m); this.bombPool.push(m);
    }
    this.aimBox = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1.06, 1.06, 1.06)),
      new THREE.LineBasicMaterial({ color: 0xffe14d }));
    this.aimBox.visible = false;
    this.scene.add(this.aimBox);
    this.resize();
  }
  resize() {
    const w = innerWidth, h = innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }
  /** 场地尺寸变化时重建框体/红线/相机 */
  private setField() {
    const g = this.game.grid;
    this.lastDims = `${g.W},${g.D},${g.H}`;
    if (this.box) this.scene.remove(this.box);
    if (this.redLine) this.scene.remove(this.redLine);
    if (this.vol) this.scene.remove(this.vol);
    const bgeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(g.W, g.H, g.D));
    this.box = new THREE.LineSegments(bgeo, new THREE.LineBasicMaterial({ color: 0x3d5a80 }));
    this.box.position.set(g.W / 2, g.H / 2, g.D / 2);
    const z = g.H - 1; // 红线 = 顶行
    const pts = [new THREE.Vector3(0, z, 0), new THREE.Vector3(g.W, z, 0), new THREE.Vector3(g.W, z, g.D), new THREE.Vector3(0, z, g.D)];
    this.redLine = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xff3355 }));
    this.vol = new THREE.Mesh(new THREE.BoxGeometry(g.W, g.H, g.D),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
    this.vol.position.copy(this.box.position);
    this.scene.add(this.box, this.redLine, this.vol);
    this.target.set(g.W / 2, g.H / 2, g.D / 2);
    this.dist = Math.max(g.W, g.D) * 1.4 + g.H;
    this.lastV = -1;
  }
  sync() {
    const g = this.game.grid;
    const dims = `${g.W},${g.D},${g.H}`;
    if (dims !== this.lastDims) this.setField();
    if (g.version !== this.lastV) this.rebuild();
    // 活动方块
    const p = this.game.piece;
    let n = 0;
    if (p && this.game.state === 'play') {
      const col = p.color >= 0 ? COLORS6[p.color] : (p.bomb ? 0x222222 : 0x9db4d0);
      for (const [cx, cy, cz] of p.cells) {
        const m = this.piecePool[n++];
        if (!m) break;
        m.visible = true;
        m.position.set(p.x + cx + 0.5, p.z + cz + 0.5, p.y + cy + 0.5);
        (m.material as THREE.MeshLambertMaterial).color.setHex(col);
      }
    }
    for (let i = n; i < this.piecePool.length; i++) this.piecePool[i].visible = false;
    // 炸弹雨
    let bn = 0;
    for (const b of this.game.bombs) {
      const m = this.bombPool[bn++];
      if (!m) break;
      m.visible = true; m.position.set(b.x + 0.5, b.z + 0.5, b.y + 0.5);
    }
    for (let i = bn; i < this.bombPool.length; i++) this.bombPool[i].visible = false;
    // 瞄准
    const a = this.game.aim;
    if (a && this.game.state === 'play') {
      this.aimBox.visible = true;
      this.aimBox.position.set(a.x + 0.5, a.z + 0.5, a.y + 0.5);
    } else this.aimBox.visible = false;
  }
  private rebuild() {
    const g = this.game.grid;
    this.lastV = g.version;
    const m4 = new THREE.Matrix4(); const col = new THREE.Color();
    let s = 0, f = 0;
    this.idxS.length = 0; this.idxF.length = 0;
    for (let i = 0; i < g.N; i++) {
      const k = g.kind[i];
      if (!k) continue;
      const [x, y, z] = g.xyz(i);
      m4.makeTranslation(x + 0.5, z + 0.5, y + 0.5);
      if (k === K.SOLID || k === K.STONE) {
        if (s >= MAX_RENDER) continue;
        this.solidMesh.setMatrixAt(s, m4);
        col.setHex(g.color[i] >= 0 ? COLORS6[g.color[i]] : (k === K.STONE ? 0x6b7280 : 0x8fb0d8));
        this.solidMesh.setColorAt(s, col);
        this.idxS.push(i); s++;
      } else {
        if (f >= 50000) continue;
        this.fluidMesh.setMatrixAt(f, m4);
        col.setHex(k === K.WATER ? (g.dyeColor[i] >= 0 ? COLORS6[g.dyeColor[i]] : 0x2f9bff) : 0xff6a00);
        this.fluidMesh.setColorAt(f, col);
        this.idxF.push(i); f++;
      }
    }
    this.solidMesh.count = s; this.fluidMesh.count = f;
    this.solidMesh.instanceMatrix.needsUpdate = true;
    this.fluidMesh.instanceMatrix.needsUpdate = true;
    if (this.solidMesh.instanceColor) this.solidMesh.instanceColor.needsUpdate = true;
    if (this.fluidMesh.instanceColor) this.fluidMesh.instanceColor.needsUpdate = true;
  }
  updateCamera() {
    const t = this.target;
    this.camera.position.set(
      t.x + this.dist * Math.sin(this.yaw) * Math.cos(this.pitch),
      t.y + this.dist * Math.sin(this.pitch),
      t.z + this.dist * Math.cos(this.yaw) * Math.cos(this.pitch));
    this.camera.lookAt(t);
  }
  /** 鼠标 → 网格瞄准格 */
  pick(mx: number, my: number): { x: number; y: number; z: number } | null {
    const r = this.renderer.domElement.getBoundingClientRect();
    const v = new THREE.Vector2(((mx - r.left) / r.width) * 2 - 1, -((my - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(v, this.camera);
    const hits = this.ray.intersectObjects([this.solidMesh, this.fluidMesh, this.vol!].filter(Boolean));
    if (!hits.length) return null;
    const h = hits[0];
    if (h.instanceId != null) {
      const i = (h.object === this.solidMesh ? this.idxS : this.idxF)[h.instanceId];
      if (i != null) { const [x, y, z] = this.game.grid.xyz(i); return { x, y, z }; }
    }
    if (h.object === this.vol && h.point) {
      const g = this.game.grid;
      return {
        x: Math.max(0, Math.min(g.W - 1, Math.floor(h.point.x))),
        y: Math.max(0, Math.min(g.D - 1, Math.floor(h.point.z))),
        z: Math.max(0, Math.min(g.H - 1, Math.floor(h.point.y)))
      };
    }
    return null;
  }
  render(dt: number) {
    this.fpsN++; this.fpsT += dt;
    if (this.fpsT >= 0.5) { this.fps = Math.round(this.fpsN / this.fpsT); this.fpsN = 0; this.fpsT = 0; }
    this.updateCamera();
    this.renderer.render(this.scene, this.camera);
  }
}
/**
 * Rapier 物理引擎演示管理器
 *
 * 在思维导图 Markdown 中使用：
 *   - <div class="rp-demo" data-sim="freefall" style="width:320px;height:244px"></div>
 *
 * data-sim 支持的演示（对应人教版物理必修第一册知识点）：
 *   freefall  自由落体        （第二章 2.3）
 *   upthrow   竖直上抛        （第二章 2.2 匀变速规律）
 *   slide     刹车 / 匀减速   （第二章 2.2 典型例题）
 *   spring    弹簧振子        （第三章 3.1 胡克定律 F=kx）
 *   inclined  斜面滑块        （第三章 3.4 力的分解 / 第四章 牛顿定律）
 *   push      恒力推动        （第四章 4.3 牛顿第二定律 F=ma）
 *   elevator  电梯超重失重    （第四章 4.6 超重和失重）
 *   collision 弹性碰撞        （拓展：动量守恒初步）
 *
 * 渲染：使用 Rapier 内置 DebugRenderPipeline 把物理场景画到 2D Canvas，
 *       物理计算完全由 @dimforge/rapier3d-compat（WASM）驱动。
 */
(function () {
  'use strict';

  const W = 320;   // 画布宽
  const H = 220;   // 画布高
  const STEP = 1 / 60;
  const demos = new Map(); // el id -> {raf, world, cfg, state}
  let observer = null;

  /* 四元数：绕 z 轴旋转 θ 弧度 */
  function quatZ(theta) {
    return { x: 0, y: 0, z: Math.sin(theta / 2), w: Math.cos(theta / 2) };
  }

  /* 常用物件构造 */
  function ground(world, opts = {}) {
    const { x = 0, y = -0.35, hx = 4.2, hy = 0.25, friction = 0.8, restitution = 0 } = opts;
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(x, y, 0));
    world.createCollider(RAPIER.ColliderDesc.cuboid(hx, hy, 1).setFriction(friction).setRestitution(restitution), body);
    return body;
  }

  function ball(world, opts = {}) {
    const { x = 0, y = 0.35, r = 0.35, friction = 0.2, restitution = 0.6, density = 1 } = opts;
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(x, y, 0).setCcdEnabled(true));
    world.createCollider(RAPIER.ColliderDesc.ball(r).setFriction(friction).setRestitution(restitution).setDensity(density), body);
    return body;
  }

  function box(world, opts = {}) {
    const { x = 0, y = 0.35, hx = 0.5, hy = 0.4, hz = 0.4, friction = 0.3, restitution = 0.1, density = 1, linvel } = opts;
    let desc = RAPIER.RigidBodyDesc.dynamic().setTranslation(x, y, 0).setCcdEnabled(true);
    if (linvel) desc = desc.setLinvel(linvel[0], linvel[1], linvel[2] || 0);
    const body = world.createRigidBody(desc);
    world.createCollider(RAPIER.ColliderDesc.cuboid(hx, hy, hz).setFriction(friction).setRestitution(restitution).setDensity(density), body);
    return body;
  }

  /* 坐标投影：世界坐标 → 画布像素（忽略 z，二维演示） */
  function makeCamera(cfg) {
    const cx = cfg.center.x, cy = cfg.center.y, sc = cfg.scale;
    return {
      x: (wx) => W / 2 + (wx - cx) * sc,
      y: (wy) => H / 2 - (wy - cy) * sc,
      s: sc,
    };
  }

  /* ---------------------------------------------------------------- *
   * 演示预设
   * ---------------------------------------------------------------- */
  const PRESETS = {
    freefall: {
      name: '自由落体',
      gravity: { x: 0, y: -9.81, z: 0 },
      scale: 30,
      center: { x: 0, y: 0.4 },
      build(world, state) {
        ground(world, { friction: 0.8 });
        state.ball = ball(world, { x: 0, y: 4.0, r: 0.35, restitution: 0.62, friction: 0.3 });
      },
      overlay(ctx, cam, state) {
        groundLine(ctx, cam);
        label(ctx, cam, 'v₀=0，只受重力 g≈9.8 m/s²，下落与反弹', 8, 16);
        const p = state.ball ? state.ball.translation() : null;
        if (p) label(ctx, cam, `当前高度 y≈${p.y.toFixed(2)} m`, 8, 34);
      },
    },

    upthrow: {
      name: '竖直上抛',
      gravity: { x: 0, y: -9.81, z: 0 },
      scale: 30,
      center: { x: 0, y: 1.0 },
      build(world, state) {
        ground(world, { friction: 0.8 });
        state.ball = ball(world, { x: 0, y: 0.35, r: 0.35, restitution: 0.55, friction: 0.3 });
        state.ball.setLinvel({ x: 0, y: 7.8, z: 0 }, true);
      },
      overlay(ctx, cam, state) {
        groundLine(ctx, cam);
        label(ctx, cam, 'v₀=7.8 m/s 竖直上抛，最高点 h=v₀²/2g≈3.1 m', 8, 16);
        const p = state.ball ? state.ball.translation() : null;
        if (p) label(ctx, cam, `当前 y≈${p.y.toFixed(2)} m，v≈${state.ball.linvel().y.toFixed(1)} m/s`, 8, 34);
      },
    },

    slide: {
      name: '刹车 · 匀减速',
      gravity: { x: 0, y: -9.81, z: 0 },
      scale: 28,
      center: { x: 0.6, y: 0.3 },
      build(world) {
        ground(world, { friction: 0.5 });
        box(world, { x: -4.6, y: 0.36, hx: 0.5, hy: 0.36, hz: 0.4, friction: 0.45, linvel: [5.5, 0, 0] });
      },
      overlay(ctx, cam, state) {
        groundLine(ctx, cam);
        // 起始位置标记线
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = '#94a3b8';
        ctx.beginPath();
        ctx.moveTo(cam.x(-4.6), 0); ctx.lineTo(cam.x(-4.6), H);
        ctx.stroke();
        ctx.restore();
        label(ctx, cam, 'v₀=5.5 m/s，μ≈0.45 → a=μg≈4.4 m/s²', 8, 16);
        label(ctx, cam, '制动距离 s=v₀²/2a≈3.4 m（虚线为起点）', 8, 34);
      },
    },

    spring: {
      name: '弹簧振子 · 胡克定律',
      gravity: { x: 0, y: -9.81, z: 0 },
      scale: 34,
      center: { x: 0, y: 0.8 },
      build(world, state) {
        // 顶部固定点（无碰撞体，仅作锚点）
        const anchor = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, 2.2, 0));
        const b = ball(world, { x: 0, y: -0.5, r: 0.32, restitution: 0.15, friction: 0.3 });
        state.anchor = anchor;
        state.ball = b;
        state.restLength = 1.7;
        const joint = RAPIER.JointData.spring(state.restLength, 32, 1.8, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 });
        world.createImpulseJoint(joint, anchor, b, true);
      },
      overlay(ctx, cam, state) {
        const a = state.anchor.translation();
        const p = state.ball.translation();
        // 弹簧：画锯齿线
        ctx.save();
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const x0 = cam.x(a.x), y0 = cam.y(a.y), y1 = cam.y(p.y);
        const coils = 8;
        for (let i = 0; i <= coils; i++) {
          const yy = y0 + ((y1 - y0) * i) / coils;
          const xx = x0 + (i % 2 === 0 ? 0 : 5);
          if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
        }
        ctx.stroke();
        // 悬挂点小球
        ctx.fillStyle = '#8b5cf6';
        ctx.beginPath(); ctx.arc(x0, y0, 3, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        const dx = a.y - p.y - state.restLength;
        label(ctx, cam, `F=-k·x，k=28 N/m，当前伸长 Δx≈${dx.toFixed(2)} m`, 8, 16);
        label(ctx, cam, '平衡位置 x₀=L+mg/k；来回振动≈简谐运动', 8, 34);
      },
    },

    inclined: {
      name: '斜面滑块',
      gravity: { x: 0, y: -9.81, z: 0 },
      scale: 30,
      center: { x: 0.5, y: 0.3 },
      build(world) {
        // 斜面：绕 z 旋转 20° 的固定长方体
        const slope = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0.5, -0.35, 0).setRotation(quatZ(20 * Math.PI / 180)));
        world.createCollider(RAPIER.ColliderDesc.cuboid(3.4, 0.22, 1).setFriction(0.25).setRestitution(0.05), slope);
        // 底部地面，接住滑下的小球
        ground(world, { y: -1.05, hx: 4.2, friction: 0.3 });
        ball(world, { x: -1.9, y: 1.0, r: 0.3, restitution: 0.1, friction: 0.05 });
      },
      overlay(ctx, cam, state) {
        // 斜面方向示意
        ctx.save();
        ctx.strokeStyle = '#cbd5e1';
        ctx.setLineDash([3, 5]);
        ctx.beginPath();
        ctx.moveTo(cam.x(-2.2), cam.y(-0.2)); ctx.lineTo(cam.x(3.2), cam.y(-0.62));
        ctx.stroke();
        ctx.restore();
        label(ctx, cam, '斜面 θ=20°，mg 分解：沿斜面 mg·sinθ，垂直 mg·cosθ', 8, 16);
        label(ctx, cam, '小球沿斜面滚下 → 加速度 a=g·sinθ（理想光滑）', 8, 34);
      },
    },

    push: {
      name: '恒力推动 · F=ma',
      gravity: { x: 0, y: -9.81, z: 0 },
      scale: 28,
      center: { x: 0.6, y: 0.3 },
      build(world, state) {
        ground(world, { friction: 0.1 });
        const b = box(world, { x: -4.2, y: 0.36, hx: 0.45, hy: 0.36, hz: 0.4, friction: 0.08 });
        state.body = b;
        // 每帧施加等效冲量 F·dt，等价于恒定水平力（compat 中 addForce 会跨帧累积，故用 applyImpulse）
        state.force = 0.62; // F≈0.62 N → a≈F/m≈1.2 m/s²
        state.dt = 1 / 60;
      },
      afterStep(world, state, dt) {
        if (state.body) state.body.applyImpulse({ x: state.force * state.dt, y: 0, z: 0 }, true);
      },
      overlay(ctx, cam, state) {
        groundLine(ctx, cam);
        label(ctx, cam, '每帧施加恒定水平力 F → 物体匀加速（a=F/m）', 8, 16);
        if (state.body) {
          const v = state.body.linvel();
          label(ctx, cam, `当前速度 v≈${v.x.toFixed(2)} m/s（随时间近似线性增大）`, 8, 34);
        }
      },
    },

    elevator: {
      name: '电梯 · 超重与失重',
      gravity: { x: 0, y: -9.81, z: 0 },
      scale: 34,
      center: { x: 0, y: -0.2 },
      build(world, state) {
        // 电梯轿厢：运动学刚体，按时间驱动（周期 8s，最高约 1.25 m）
        const plat = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, -1.05, 0));
        world.createCollider(RAPIER.ColliderDesc.cuboid(1.8, 0.22, 1).setFriction(0.8).setRestitution(0.02), plat);
        // 轿厢内物体
        const obj = box(world, { x: 0, y: -0.35, hx: 0.38, hy: 0.38, hz: 0.38, friction: 0.8, restitution: 0.05 });
        state.platform = plat;
        state.obj = obj;
        state.t = 0;
      },
      afterStep(world, state, dt) {
        state.t += dt;
        const cyc = state.t % 8;
        const A = 0.8;      // 加速度大小 m/s²
        const V = A * 1.2;  // 匀速段速度 = 0.96 m/s
        let y, phase, accel;
        if (cyc < 1.2) { const u = cyc; y = -1.05 + 0.5 * A * u * u; phase = '加速上升 → 超重'; accel = A; }
        else if (cyc < 2.4) { const u = cyc - 1.2; y = -0.474 + V * u; phase = '匀速上升 → 视重=重力'; accel = 0; }
        else if (cyc < 3.6) { const u = cyc - 2.4; y = 0.678 + V * u - 0.5 * A * u * u; phase = '减速上升 → 失重'; accel = -A; }
        else if (cyc < 4.8) { const u = cyc - 3.6; y = 1.254 - 0.5 * A * u * u; phase = '加速下降 → 失重'; accel = -A; }
        else if (cyc < 6.0) { const u = cyc - 4.8; y = 0.678 - V * u; phase = '匀速下降 → 视重=重力'; accel = 0; }
        else if (cyc < 7.2) { const u = cyc - 6.0; y = -0.474 - V * u + 0.5 * A * u * u; phase = '减速下降 → 超重'; accel = A; }
        else { y = -1.05; phase = '静止 → 视重=重力'; accel = 0; }
        state.platform.setNextKinematicTranslation({ x: 0, y: y, z: 0 });
        state.phase = phase;
        state.accel = accel;
      },
      overlay(ctx, cam, state) {
        label(ctx, cam, state.phase || '电梯运动', 8, 16);
        label(ctx, cam, '超重：加速度向上，视重 N=m(g+a)；失重反之', 8, 34);
        // 视重 / 实重 指示条
        const N = 1 + (state.accel || 0) / 9.81;
        ctx.save();
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(W - 150, H - 34, 140, 12);
        ctx.fillStyle = state.accel > 0 ? '#34A853' : state.accel < 0 ? '#ef4444' : '#94a3b8';
        const barW = Math.min(134, 134 * N);
        ctx.fillRect(W - 148, H - 33, Math.max(2, barW), 10);
        ctx.fillStyle = '#475569';
        ctx.font = '10px Inter, system-ui, "PingFang SC", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`视重/实重 ≈ ${N.toFixed(2)}`, W - 148, H - 40);
        ctx.restore();
      },
    },

    collision: {
      name: '弹性碰撞 · 动量拓展',
      gravity: { x: 0, y: -9.81, z: 0 },
      scale: 42,
      center: { x: 0, y: 0.3 },
      build(world, state) {
        ground(world, { friction: 0, hx: 6 });
        // 两侧挡板，让小球往复碰撞
        for (const x of [-5.4, 5.4]) {
          const wall = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(x, 0.9, 0));
          world.createCollider(RAPIER.ColliderDesc.cuboid(0.12, 1.3, 1).setFriction(0).setRestitution(1.0), wall);
        }
        const a = ball(world, { x: -2.7, y: 0.35, r: 0.34, restitution: 1.0, friction: 0 });
        const b = ball(world, { x: 2.7, y: 0.35, r: 0.34, restitution: 1.0, friction: 0 });
        a.setLinvel({ x: 3.2, y: 0, z: 0 }, true);
        b.setLinvel({ x: -3.2, y: 0, z: 0 }, true);
        state.balls = [a, b];
      },
      overlay(ctx, cam, state) {
        groundLine(ctx, cam);
        label(ctx, cam, '质量相等、完全弹性碰撞 → 速度交换（动量守恒）', 8, 16);
        if (state.balls) {
          const va = state.balls[0].linvel().x.toFixed(2);
          const vb = state.balls[1].linvel().x.toFixed(2);
          label(ctx, cam, `v₁≈${va} m/s，v₂≈${vb} m/s`, 8, 34);
        }
      },
    },
  };

  /* 工具函数 */
  function groundLine(ctx, cam) {
    ctx.save();
    ctx.strokeStyle = '#cbd5e1';
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(0, cam.y(-0.1)); ctx.lineTo(W, cam.y(-0.1));
    ctx.stroke();
    ctx.restore();
  }

  function label(ctx, cam, text, x, y) {
    ctx.save();
    ctx.fillStyle = '#334155';
    ctx.font = '11px Inter, system-ui, "PingFang SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  /* 画调试线 */
  function drawDebug(ctx, cam, world) {
    const pipe = world.debugRenderPipeline;
    pipe.render(world.bodies, world.colliders, world.softBodies, world.impulseJoints, world.multibodyJoints, world.narrowPhase);
    const v = pipe.vertices, c = pipe.colors;
    if (!v || v.length < 6) return;
    ctx.lineWidth = 2;
    for (let i = 0; i + 5 < v.length; i += 6) {
      const ci = (i / 6) * 4; // 每个顶点 4 个颜色分量，线段起点色
      const r = c[ci], g = c[ci + 1], b = c[ci + 2], a = c[ci + 3];
      ctx.strokeStyle = `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},${a})`;
      ctx.beginPath();
      ctx.moveTo(cam.x(v[i]), cam.y(v[i + 1]));
      ctx.lineTo(cam.x(v[i + 3]), cam.y(v[i + 4]));
      ctx.stroke();
    }
  }

  /* 帧循环 */
  function startLoop(el, cfg) {
    const st = demos.get(el.id);
    if (!st) return;
    const canvas = el.querySelector('.rp-canvas');
    const ctx = canvas.getContext('2d');
    const cam = makeCamera(cfg);
    const world = st.world;
    let acc = 0;
    let last = performance.now();

    // 浅色卡片底 + 淡拖尾
    const frame = (t) => {
      if (!demos.has(el.id)) return;
      st.raf = requestAnimationFrame(frame);
      const dt = Math.min((t - last) / 1000, 0.05);
      last = t;
      acc += dt;
      let steps = 0;
      while (acc >= STEP && steps < 6) {
        if (cfg.afterStep) cfg.afterStep(world, st.state, STEP);
        world.step();
        acc -= STEP;
        steps++;
      }
      ctx.fillStyle = 'rgba(248,250,252,0.45)';
      ctx.fillRect(0, 0, W, H);
      drawDebug(ctx, cam, world);
      if (cfg.overlay) cfg.overlay(ctx, cam, st.state);
    };
    st.raf = requestAnimationFrame(frame);
  }

  /* 初始化单个演示 */
  function initDemo(el) {
    if (el.dataset.rpInit) return;
    el.dataset.rpInit = 'pending';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const sim = el.getAttribute('data-sim') || '';
      const cfg = PRESETS[sim];
      if (!cfg) {
        el.dataset.rpInit = 'error';
        el.dataset.rpError = '未知演示: ' + sim;
        return;
      }
      if (typeof RAPIER === 'undefined') {
        el.dataset.rpInit = 'error';
        el.dataset.rpError = 'Rapier 未加载';
        return;
      }
      try {
        // 构建节点 DOM
        el.style.width = '320px';
        el.style.height = (H + 24) + 'px';
        el.innerHTML = `
          <div class="rp-head"><span>${cfg.name}</span><button class="rp-reset" type="button">↻ 重置</button></div>
          <canvas class="rp-canvas" width="${W}" height="${H}"></canvas>`;
        const state = {};
        const world = new RAPIER.World(cfg.gravity);
        cfg.build(world, state);
        demos.set(el.id, { world, cfg, state });
        el.dataset.rpInit = '1';

        el.querySelector('.rp-reset').addEventListener('click', () => {
          const old = demos.get(el.id);
          if (old) {
            cancelAnimationFrame(old.raf);
            try { old.world.free(); } catch (_) {}
          }
          delete el.dataset.rpInit;
          el.replaceChildren();
          initDemo(el);
        });
        startLoop(el, cfg);
      } catch (e) {
        console.warn('[Rapier] 演示初始化失败:', sim, e.message, e.stack);
        el.dataset.rpInit = 'error';
        el.dataset.rpError = e.message || '';
      }
    }));
  }

  /* 扫描容器内所有未初始化的演示 */
  function scan(container) {
    if (typeof RAPIER === 'undefined') return;
    const els = container.querySelectorAll('.rp-demo:not([data-rp-init="1"]):not([data-rp-init="error"])');
    els.forEach(initDemo);
  }

  /* 清理所有演示（切换学科时调用） */
  function clearAll() {
    demos.forEach((st, id) => {
      cancelAnimationFrame(st.raf);
      try { st.world.free(); } catch (_) {}
      const el = document.getElementById(id);
      if (el) {
        el.replaceChildren();
      }
    });
    demos.clear();
    document.querySelectorAll('.rp-demo[data-rp-init]').forEach(el => {
      delete el.dataset.rpInit;
    });
  }

  /* 启动 MutationObserver：节点展开/折叠时新出现的演示自动初始化 */
  function startObserver(svg) {
    if (observer) observer.disconnect();
    observer = new MutationObserver(mutations => {
      for (const m of mutations) {
        if (m.addedNodes.length) {
          scan(svg);
          break;
        }
      }
    });
    observer.observe(svg, { childList: true, subtree: true });
  }

  /* 对外 API */
  window.RapierBoards = {
    scan,
    clearAll,
    startObserver,
    init: function (svg) {
      const checkReady = () => {
        if (window.__RAPIER_LOAD__) {
          window.__RAPIER_LOAD__.then((R) => {
            if (!R) return;
            scan(svg);
            startObserver(svg);
          });
        } else {
          setTimeout(checkReady, 200);
        }
      };
      checkReady();
    }
  };
})();

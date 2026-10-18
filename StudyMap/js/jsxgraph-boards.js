/**
 * JSXGraph 可交互数学画板管理器
 *
 * 在思维导图 Markdown 中使用：
 *   <div class="jxg-board" data-graph='{"bounds":[-6,6,6,-6],"functions":[{"fn":"x^2"}]}'></div>
 *
 * data-graph 支持的字段：
 *   bounds: [xmin, ymax, xmax, ymin]
 *   axes: true / false（默认 true）
 *   grid: true / false（默认 true）
 *   functions: [{fn, name?, color?, strokeWidth?}]
 *   slider: {name, min, max, start, fn}  —— 带滑块的函数，fn 中可引用滑块变量
 *   points: [[x,y,name?], ...]
 *   circles: [[[cx,cy], r, name?], ...]
 *   polygons: [[[x1,y1],[x2,y2],...], ...]
 *   tangent: {fn, at}  —— 在 x=at 处画切线
 *   label: 画板下方说明文字
 */
(function () {
  'use strict';

  const boards = new Map(); // element id -> board instance
  let boardCounter = 0;
  let observer = null;

  /* 解析 data-graph JSON，失败返回 null */
  function parseGraph(el) {
    const raw = el.getAttribute('data-graph') || '';
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.warn('[JSXGraph] 解析失败:', raw.slice(0, 80), e);
      return null;
    }
  }

  /* 为画板生成唯一 ID */
  function ensureId(el) {
    if (!el.id) {
      el.id = 'jxg-board-' + (++boardCounter);
    }
    return el.id;
  }

  /* 销毁单个画板 */
  function destroyBoard(el) {
    const id = el.id;
    if (boards.has(id)) {
      try { boards.get(id).clear(); } catch (_) {}
      boards.delete(id);
    }
  }

  /* 初始化单个画板 */
  function initBoard(el) {
    if (el.dataset.jxgInit) return; // 已初始化或正在初始化
    el.dataset.jxgInit = 'pending';
    // 提前设置内联尺寸，确保 JSXGraph 测量正确
    el.style.width = '300px';
    el.style.height = '220px';
    // 延迟到下一帧，确保 markmap foreignObject 已完成布局
    requestAnimationFrame(() => requestAnimationFrame(() => doInit(el)));
  }

  function doInit(el) {
    if (el.dataset.jxgInit === '1') return;
    const cfg = parseGraph(el);
    if (!cfg) { el.dataset.jxgInit = 'error'; return; }

    const id = ensureId(el);
    el.dataset.jxgInit = '1';

    try {
      const bounds = cfg.bounds || [-6, 6, 6, -6];
      const board = JXG.JSXGraph.initBoard(id, {
        boundingbox: bounds,
        axis: cfg.axes !== false,
        grid: cfg.grid !== false,
        showCopyright: false,
        showNavi: false,
        keepAspectRatio: false,
        pan: { enabled: true, needShift: false },
        zoom: { wheel: true, needShift: false },
        defaultAxes: {
          x: { strokeColor: '#94a3b8', tickColor: '#cbd5e1', label: { fontSize: 9 } },
          y: { strokeColor: '#94a3b8', tickColor: '#cbd5e1', label: { fontSize: 9 } }
        }
      });

      /* 静态函数 */
      if (Array.isArray(cfg.functions)) {
        cfg.functions.forEach(f => {
          board.create('functiongraph', [f.fn], {
            strokeColor: f.color || '#34A853',
            strokeWidth: f.strokeWidth || 2
          });
        });
      }

      /* 带滑块的函数 */
      if (cfg.slider && cfg.slider.fn) {
        const s = cfg.slider;
        const slider = board.create('slider', [
          [bounds[0] + 0.5, bounds[1] - 0.8],
          [bounds[0] + 3.5, bounds[1] - 0.8],
          [s.min, s.start, s.max]
        ], { name: s.name || 'a', snapWidth: 0.1 });
        board.create('functiongraph', [
          function (x) {
            const v = slider.Value();
            // 用 Function 构造器，将滑块变量注入作用域
            try {
              return new Function(s.name || 'a', 'x', 'return (' + s.fn + ');')(v, x);
            } catch (_) { return 0; }
          }
        ], {
          strokeColor: s.color || '#4285F4',
          strokeWidth: 2.5
        });
      }

      /* 点 */
      if (Array.isArray(cfg.points)) {
        cfg.points.forEach(p => {
          board.create('point', [p[0], p[1]], {
            name: p[2] || '',
            size: 3,
            fillColor: '#1e293b',
            strokeColor: '#1e293b',
            label: { fontSize: 10, offset: [6, -6] }
          });
        });
      }

      /* 圆 */
      if (Array.isArray(cfg.circles)) {
        cfg.circles.forEach(c => {
          board.create('circle', [c[0], c[1]], {
            strokeColor: c[3] || '#f59e0b',
            strokeWidth: 1.5,
            fillColor: 'rgba(245,158,11,.08)',
            name: c[2] || '',
            withLabel: !!c[2]
          });
        });
      }

      /* 多边形 */
      if (Array.isArray(cfg.polygons)) {
        cfg.polygons.forEach(poly => {
          board.create('polygon', poly, {
            fillColor: 'rgba(52,168,83,.12)',
            strokeColor: '#34A853',
            strokeWidth: 1.5,
            vertices: { visible: false }
          });
        });
      }

      /* 切线 */
      if (cfg.tangent && cfg.tangent.fn) {
        const t = cfg.tangent;
        const p = board.create('point', [t.at, 0], { visible: false });
        const glider = board.create('glider', [t.at, 0,
          board.create('functiongraph', [t.fn], { visible: false })
        ], { name: '', size: 3, fillColor: '#ef4444' });
        board.create('tangent', [glider], {
          strokeColor: '#ef4444',
          strokeWidth: 1.5,
          dash: 2
        });
        board.create('functiongraph', [t.fn], {
          strokeColor: '#34A853',
          strokeWidth: 2
        });
      }

      /* 交互式单位圆：可拖动点，实时显示 sin/cos */
      if (cfg.unitCircle) {
        const circ = board.create('circle', [[0, 0], 1], {
          strokeColor: '#4285F4', strokeWidth: 1.5,
          fillColor: 'rgba(66,133,244,.05)'
        });
        const P = board.create('glider', [Math.cos(Math.PI / 4), Math.sin(Math.PI / 4), circ], {
          name: 'P', size: 4, fillColor: '#ef4444', strokeColor: '#ef4444',
          label: { fontSize: 11, offset: [8, -8] }
        });
        // x 投影 (cos)
        board.create('segment', [P, [function () { return P.X(); }, 0]], {
          strokeColor: '#34A853', strokeWidth: 2, dash: 0
        });
        // y 投影 (sin)
        board.create('segment', [P, [0, function () { return P.Y(); }]], {
          strokeColor: '#f59e0b', strokeWidth: 2, dash: 0
        });
        // 半径
        board.create('segment', [[0, 0], P], {
          strokeColor: '#1e293b', strokeWidth: 1.5
        });
        // 角度指示（用 angle 元素）
        const originPt = board.create('point', [0, 0], { visible: false });
        const xAxisPt = board.create('point', [0.35, 0], { visible: false });
        const anglePt = board.create('point', [
          function () { const a = Math.atan2(P.Y(), P.X()); return 0.35 * Math.cos(a); },
          function () { const a = Math.atan2(P.Y(), P.X()); return 0.35 * Math.sin(a); }
        ], { visible: false });
        board.create('angle', [xAxisPt, originPt, anglePt], {
          radius: 0.35,
          fillColor: 'rgba(139,92,246,.18)',
          strokeColor: '#8b5cf6',
          strokeWidth: 1
        });
        // 实时数值文本
        board.create('text', [bounds[0] + 0.3, bounds[1] - 0.5,
          function () {
            const ang = Math.atan2(P.Y(), P.X());
            const deg = (ang * 180 / Math.PI).toFixed(1);
            return 'θ=' + deg + '°  sin=' + P.Y().toFixed(2) + '  cos=' + P.X().toFixed(2);
          }
        ], { fontSize: 11, color: '#1e293b', fixed: true });
        // 坐标轴标签
        board.create('text', [bounds[2] - 0.5, -0.25, 'x(cos)'], { fontSize: 9, color: '#64748b' });
        board.create('text', [0.1, bounds[1] - 0.3, 'y(sin)'], { fontSize: 9, color: '#64748b' });
      }

      boards.set(id, board);

      // 强制修正尺寸：直接设置 jxgbox 和 SVG 的宽高
      const fixSize = () => {
        const w = el.clientWidth || 300;
        const h = el.clientHeight || 220;
        const box = el.querySelector('.jxgbox');
        const svg = el.querySelector('svg');
        if (box) { box.style.width = w + 'px'; box.style.height = h + 'px'; }
        if (svg) { svg.setAttribute('width', w); svg.setAttribute('height', h); svg.style.width = w + 'px'; svg.style.height = h + 'px'; }
        try { board.resizeTo(w, h); } catch (_) {}
        try { board.fullUpdate(); } catch (_) {}
      };
      fixSize();
      [100, 300, 600, 1200].forEach(d => setTimeout(fixSize, d));

      // ResizeObserver 持续适配
      try {
        const ro = new ResizeObserver(fixSize);
        ro.observe(el);
        board._ro = ro;
      } catch (_) {}

      /* 说明标签 */
      if (cfg.label) {
        const lbl = document.createElement('div');
        lbl.className = 'jxg-board-label';
        lbl.textContent = cfg.label;
        el.parentNode.insertBefore(lbl, el.nextSibling);
      }
    } catch (e) {
      console.warn('[JSXGraph] 画板初始化失败:', id, e.message, e.stack);
      el.dataset.jxgInit = 'error';
      el.dataset.jxgError = e.message || '';
    }
  }

  /* 扫描容器内所有未初始化的画板 */
  function scan(container) {
    if (typeof JXG === 'undefined') return;
    const els = container.querySelectorAll('.jxg-board:not([data-jxg-init="1"]):not([data-jxg-init="error"])');
    els.forEach(initBoard);
  }

  /* 清理所有画板（切换学科时调用） */
  function clearAll() {
    boards.forEach((board, id) => {
      if (board._ro) { try { board._ro.disconnect(); } catch (_) {} }
      const el = document.getElementById(id);
      if (el) { try { JXG.JSXGraph.freeBoard(board); } catch (_) {} }
    });
    boards.clear();
    // 重置所有标记
    document.querySelectorAll('.jxg-board[data-jxg-init]').forEach(el => {
      delete el.dataset.jxgInit;
    });
    document.querySelectorAll('.jxg-board-label').forEach(el => el.remove());
  }

  /* 启动 MutationObserver：节点展开/折叠时新出现的画板自动初始化 */
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
  window.JXGBoards = {
    scan,
    clearAll,
    startObserver,
    init: function (svg) {
      if (typeof JXG === 'undefined') {
        // JSXGraph 还没加载完，等一下
        const check = setInterval(() => {
          if (typeof JXG !== 'undefined') {
            clearInterval(check);
            scan(svg);
            startObserver(svg);
          }
        }, 100);
        setTimeout(() => clearInterval(check), 8000);
        return;
      }
      scan(svg);
      startObserver(svg);
    }
  };
})();

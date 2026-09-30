/* ============================================================
   app.js — 成绩排名分析台 · 主应用逻辑
   ============================================================ */

/* ---------- 工具 ---------- */
let toastTimer;
function toast(msg){
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

function countUp(el, to, dec = 0){
  const from = parseFloat(el.textContent) || 0;
  const t0 = performance.now(), dur = 750;
  (function step(t){
    const k = Math.min(1, (t - t0) / dur);
    const e = 1 - Math.pow(1 - k, 3);
    const v = from + (to - from) * e;
    el.textContent = dec ? v.toFixed(dec) : Math.round(v);
    if (k < 1) requestAnimationFrame(step);
  })(t0);
}

/* ================= 渲染 ================= */

function deltaHTML(p, view){
  const sr = p.subjects[view]?.rank, tr = p.totalRank;
  if (sr == null || tr == null) return '<span class="mut">—</span>';
  const d = tr - sr;
  if (d === 0) return '<span class="mut">持平</span>';
  return d > 0 ? `<span class="up">↑${d}</span>` : `<span class="dn">↓${-d}</span>`;
}

function rowHTML(p, i, view, ds){
  const isTotal = view === 'total';
  const m = isTotal ? { score: p.total, rank: p.totalRank } : (p.subjects[view] || { score: null, rank: null });
  const max = (isTotal ? ds._max.total : ds._max[view]) || 1;
  const pct = m.score == null ? 0 : clamp(m.score / max * 100, 4, 100);
  const color = isTotal ? 'var(--primary)' : SUBJ_COLORS[view];
  const mid = isTotal
    ? (p.classRank != null ? `班内 ${fmtScore(p.classRank)}` : '<span class="mut">—</span>')
    : deltaHTML(p, view);
  const sub = isTotal
    ? (p.classRank != null ? `班内第 ${fmtScore(p.classRank)} 名` : (ds.isMerged ? `${p.records.length} 次考试` : ''))
    : `总排名 ${p.totalRank ?? '–'}`;
  return `<li class="row rip" data-key="${esc(p.name)}" data-name="${esc(p.name)}" style="--sc:${color}">
    <div class="rk ${i < 3 ? 'm' + (i + 1) : ''}">${m.rank ?? '–'}</div>
    <div class="who"><b>${esc(p.name)}</b><span>${sub}</span></div>
    <div class="mid">${mid}</div>
    <div class="sc"><span class="num">${fmtScore(m.score)}</span><span class="bar"><i data-w="${pct.toFixed(1)}"></i></span></div>
  </li>`;
}

function renderChips(){
  let html = state.exams.map(ex =>
    `<button class="chip rip ${state.mode === ex.id ? 'on' : ''}" data-exam="${ex.id}">📄 ${esc(ex.label)} <em>${ex.rows.length}人</em></button>`
  ).join('');
  if (state.exams.length > 1) {
    html += `<button class="chip rip ${state.mode === 'all' ? 'on' : ''}" data-exam="all">✨ 汇总 <em>${state.exams.length} 次考试</em></button>`;
  }
  $('#examChips').innerHTML = html;
}

function renderStats(){
  const ds = currentDS();
  const totals = ds.rows.map(r => r.total).filter(v => v != null);
  countUp($('#stCount'), ds.rows.length);
  countUp($('#stMax'), totals.length ? Math.max(...totals) : 0);
  countUp($('#stAvg'), totals.length ? totals.reduce((a, b) => a + b, 0) / totals.length : 0, 1);
  countUp($('#stSub'), ds.subjects.length);
  $('#stSubSub').textContent = ds.isMerged ? `科 · ${state.exams.length} 场` : '科';
}

function renderPodium(){
  const ds = currentDS();
  const top = sortedFor(ds, 'total').slice(0, 3);
  const max = top[0]?.total || 1;
  const order = [top[1], top[0], top[2]];
  $('#podium').innerHTML = order.map((p, idx) => {
    if (!p) return '<div class="pcol"></div>';
    const place = idx === 1 ? 1 : idx === 0 ? 2 : 3;
    const h = Math.max(14, (p.total / max) * 100);
    return `<div class="pcol rip" data-name="${esc(p.name)}">
      <div class="pmedal">${['🥇','🥈','🥉'][place - 1]}</div>
      <div class="pname">${esc(p.name)}</div>
      <div class="pscore">${fmtScore(p.total)}</div>
      <div class="pbar"><i data-h="${h.toFixed(1)}"></i></div>
    </div>`;
  }).join('');
  requestAnimationFrame(() => requestAnimationFrame(() =>
    $$('#podium .pbar i').forEach(i => i.style.height = i.dataset.h + '%')
  ));
}

function renderTabs(){
  const ds = currentDS();
  const tabs = ['total', ...ds.subjects];
  if (!tabs.includes(state.view)) state.view = 'total';
  $('#rankTabs').innerHTML = tabs.map(t =>
    `<button class="chip rip ${state.view === t ? 'on' : ''}" data-view="${t}">
      ${t === 'total' ? '🏆 总排名' : `<i class="sdot" style="background:${SUBJ_COLORS[t]}"></i>${t}排名`}
    </button>`
  ).join('');
}

function updateThead(){
  $('#thMid').textContent = state.view === 'total' ? '班内' : '较总榜';
  $('#thScore').textContent = state.view === 'total' ? '总分' : state.view + '得分';
}

function renderList(flip = true){
  const ds = currentDS();
  if (!ds) return;
  const list = $('#rankList');
  const q = state.search.trim();
  let arr = sortedFor(ds, state.view);
  if (q) arr = arr.filter(p => p.name.includes(q));
  const first = new Map();
  if (flip) [...list.children].forEach(el => first.set(el.dataset.key, el.getBoundingClientRect().top));
  list.innerHTML = arr.map((p, i) => rowHTML(p, i, state.view, ds)).join('');
  updateThead();
  requestAnimationFrame(() => {
    $$('#rankList .bar i').forEach(el => el.style.width = el.dataset.w + '%');
    if (!flip) return;
    [...list.children].forEach((el, idx) => {
      const f = first.get(el.dataset.key);
      if (f == null) {
        el.style.opacity = 0;
        el.style.transform = 'translateY(14px)';
        requestAnimationFrame(() => {
          el.style.transition = `opacity .4s ${idx * 10}ms, transform .5s cubic-bezier(.2,.9,.2,1) ${idx * 10}ms`;
          el.style.opacity = 1;
          el.style.transform = '';
        });
        return;
      }
      const d = f - el.getBoundingClientRect().top;
      if (Math.abs(d) > 1) {
        el.style.transition = 'none';
        el.style.transform = `translateY(${d}px)`;
        requestAnimationFrame(() => {
          el.style.transition = 'transform .55s cubic-bezier(.22,1,.36,1)';
          el.style.transform = '';
        });
      }
    });
  });
}

function renderKings(){
  const ds = currentDS();
  $('#kings').innerHTML = ds.subjects.map(s => {
    const top = sortedFor(ds, s)[0];
    if (!top || top.subjects[s]?.score == null) return '';
    return `<div class="king">
      <i class="sdot" style="background:${SUBJ_COLORS[s]}"></i>
      <span class="ks">${s}</span><b>${esc(top.name)}</b>
      <span class="kv">${fmtScore(top.subjects[s].score)}</span>
    </div>`;
  }).join('') || '<p class="mut">暂无数据</p>';
}

function renderSource(){
  $('#srcList').innerHTML = state.exams.map(ex =>
    `<div class="src-row">
      <b>${esc(ex.label)}</b>
      <span class="gnum" style="color:var(--muted)">${ex.rows.length} 人</span>
      <span class="badge">已加载</span>
    </div>`
  ).join('');
}

function renderAll(){
  if (!state.exams.length) {
    $('#emptyState').hidden = false;
    $('#app').hidden = true;
    return;
  }
  $('#emptyState').hidden = true;
  $('#app').hidden = false;
  renderChips();
  renderStats();
  renderPodium();
  renderTabs();
  renderList(false);
  renderKings();
  renderSource();
}

/* ================= 个人详情 ================= */

function personHTML(row, recs, ds){
  const maxs = ds._max;
  const hash = [...row.name].reduce((a, c) => a + c.charCodeAt(0), 0);
  const av = AV_COLORS[hash % AV_COLORS.length];
  const ov = [
    ['总分', fmtScore(row.total), '分'],
    ['年级排名', row.totalRank ?? '–', ds.isMerged ? '平均后重排' : '名'],
    ['班级排名', row.classRank ?? '–', '名'],
    ['参考科目', ds.subjects.filter(s => row.subjects[s]?.score != null).length, '科']
  ];
  const cards = ds.subjects.map(s => {
    const v = row.subjects[s];
    if (!v || v.score == null) return '';
    const pct = clamp(v.score / (maxs[s] || 1) * 100, 3, 100);
    return `<div class="s-card" style="--sc:${SUBJ_COLORS[s]}">
      <header><i class="sdot" style="background:${SUBJ_COLORS[s]}"></i>${s}<em>年排 ${v.rank ?? '–'}</em></header>
      <div class="s-num">${fmtScore(v.score)}</div>
      <span class="bar"><i data-w="${pct.toFixed(1)}"></i></span>
    </div>`;
  }).join('');
  const axes = ds.subjects.filter(s => row.subjects[s]?.score != null);
  const radar = axes.length >= 3
    ? '<div id="radarChart" class="chart-box"></div>'
    : '<p class="mut" style="padding:20px;text-align:center">有效科目不足 3 科，暂不绘制雷达图</p>';
  const metrics = ['total', ...new Set(recs.flatMap(r => Object.keys(r.row.subjects).filter(s => r.row.subjects[s].score != null)))];
  let history;
  if (recs.length > 1) {
    history = `<section class="sec"><h3>历史轨迹 · ${recs.length} 次考试</h3>
      <div class="hchips" id="hChips">
        ${metrics.map(m => `<button class="chip mini rip ${m === 'total' ? 'on' : ''}" data-metric="${m}">${m === 'total' ? '总分' : m}</button>`).join('')}
      </div>
      <div id="hChart" class="chart-box"></div>
      <table class="htab"><thead><tr><th>考试</th><th>总分</th><th>年名</th><th>班名</th></tr></thead><tbody>
        ${recs.map(r => `<tr><td>${esc(r.label)}</td><td class="gnum">${fmtScore(r.row.total)}</td><td class="gnum">${r.row.totalRank ?? '–'}</td><td class="gnum">${r.row.classRank ?? '–'}</td></tr>`).join('')}
      </tbody></table>
    </section>`;
  } else {
    history = `<section class="sec"><h3>历史轨迹</h3>
      <p class="mut">暂无历史数据 —— ${state.exams.length > 1 ? '该生仅出现在一次考试中' : '导入更多场次后即可查看跨考试分数趋势'}。</p>
    </section>`;
  }
  return `<header class="sh-head">
      <div class="avatar" style="--av:${av}">${esc(row.name[0])}</div>
      <div>
        <h2 class="display">${esc(row.name)}</h2>
        <p class="mut">当前榜单：${esc(ds.label)}${row.classRank != null ? ` · 班内第 ${fmtScore(row.classRank)} 名` : ''}${ds.isMerged ? ' · 展示平均值' : ''}</p>
      </div>
      <button class="icon-btn rip" id="sheetClose">✕</button>
    </header>
    <section class="sec"><div class="ov-strip">${ov.map(([l, v, u]) => `<div class="ov"><span>${l}</span><b>${v}</b><em>${u}</em></div>`).join('')}</div></section>
    <section class="sec"><h3>${ds.isMerged ? '各科平均成绩' : '各科成绩'}</h3>
      <div class="detail-grid">
        <div class="s-grid">${cards || '<p class="mut">无科目数据</p>'}</div>
        <div class="radar-box">${radar}</div>
      </div>
      <h3 style="margin:18px 0 4px">📈 各科成绩走势</h3>
      <div id="subjectLineChart" class="chart-box"></div>
    </section>
    ${history}`;
}

function drawHistory(recs, metric){
  const color = metric === 'total' ? PRIMARY_HEX : SUBJ_COLORS[metric];
  const pts = recs.map(r => ({
    label: r.label,
    v: metric === 'total' ? r.row.total : r.row.subjects[metric]?.score
  })).filter(p => p.v != null);
  const el = $('#hChart');
  if (!pts.length) {
    disposeChart(el);
    el.innerHTML = '<p class="mut">该科目在历次考试中无数据</p>';
    return;
  }
  // 仅当没有缓存实例（此前显示的是“无数据”提示）时才清理 DOM；
  // 已有 ECharts 实例时不能用 innerHTML=''，否则会销毁其内部 canvas。
  if (!_chartInstances.has(el)) el.innerHTML = '';
  renderHistoryChart(el, pts.map(p => p.label), pts.map(p => p.v), color);
}

function openPerson(name){
  const ds = currentDS();
  const row = ds.rows.find(r => r.name === name);
  if (!row) return;
  const recs = historyOf(name);
  // 重建前先销毁抽屉内可能残留的图表实例（防止指向已分离 DOM）
  disposeChartsWithin('#sheetBody');
  $('#sheetBody').innerHTML = personHTML(row, recs, ds);
  $('#sheetWrap').classList.add('open');
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    $$('#sheetBody .bar i').forEach(el => el.style.width = el.dataset.w + '%');
    // 初始化雷达图
    const radarEl = $('#radarChart');
    if (radarEl) {
      const axes = ds.subjects.filter(s => row.subjects[s]?.score != null);
      renderRadarChart(radarEl, axes, axes.map(s => row.subjects[s].score / (ds._max[s] || 1) * 100), PRIMARY_HEX);
      resizeChart(radarEl);
    }
    // 初始化各科成绩折线图
    const slEl = $('#subjectLineChart');
    if (slEl) {
      const axes = ds.subjects.filter(s => row.subjects[s]?.score != null);
      renderSubjectLineChart(
        slEl, axes,
        axes.map(s => row.subjects[s].score),
        axes.map(s => row.subjects[s].rank),
        axes.map(s => SUBJ_COLORS[s])
      );
      resizeChart(slEl);
    }
    // 初始化历史折线图
    if (recs.length > 1) { drawHistory(recs, 'total'); resizeChart($('#hChart')); }
  }));
  if (recs.length > 1) {
    $('#hChips').addEventListener('click', e => {
      const b = e.target.closest('[data-metric]');
      if (!b) return;
      $$('#hChips .chip').forEach(c => c.classList.toggle('on', c === b));
      drawHistory(recs, b.dataset.metric);
      // 切换后下一帧校正尺寸，确保任何布局下都正常出图
      requestAnimationFrame(() => resizeChart($('#hChart')));
    });
  }
}

function closeSheet(){
  $('#sheetWrap').classList.remove('open');
  document.body.style.overflow = '';
  // 销毁抽屉内的所有 ECharts 实例
  disposeChartsWithin('#sheetBody');
}

/* ================= 考试管理弹窗 ================= */

function openManage(){
  const box = $('#manageList');
  if (!state.exams.length) {
    box.innerHTML = '<div class="mgr-empty">暂无考试数据</div>';
  } else {
    box.innerHTML = state.exams.map(ex => `
      <div class="mgr-row">
        <input value="${esc(ex.label)}" data-id="${ex.id}" aria-label="考试名称">
        <span class="mg-meta">${ex.rows.length}人</span>
        <button class="mgr-del rip" data-del="${ex.id}" aria-label="删除" title="删除此考试">🗑</button>
      </div>
    `).join('');
    box.querySelectorAll('input').forEach(inp => {
      const commit = () => {
        const v = inp.value.trim();
        const ex = state.exams.find(e => e.id === inp.dataset.id);
        if (v && ex && v !== ex.label) {
          renameExam(inp.dataset.id, v);
          renderAll();
          toast('已重命名');
        }
      };
      inp.addEventListener('change', commit);
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') inp.blur(); });
    });
    box.querySelectorAll('[data-del]').forEach(b => {
      b.onclick = () => {
        removeExam(b.dataset.del);
        if (state.exams.length === 0) { closeManage(); renderAll(); }
        else { openManage(); renderAll(); }
        toast('已删除该次考试');
      };
    });
  }
  $('#mgrWrap').classList.add('open');
}

function closeManage(){ $('#mgrWrap').classList.remove('open'); }

/* ================= 导入 ================= */

async function handleFiles(fileList){
  const files = [...fileList].filter(f => /\.csv$/i.test(f.name));
  if (!files.length) { toast('请选择 CSV 文件'); return; }
  const groups = new Map();
  for (const f of files) {
    const rel = f.webkitRelativePath || f.name;
    const parts = rel.split('/');
    const label = parts.length > 1 ? (parts[parts.length - 2] || f.name) : f.name.replace(/\.csv$/i, '');
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push(f);
  }
  let added = 0;
  for (const [label, arr] of groups) {
    const f = arr.find(x => /^main\.csv$/i.test(x.name)) || arr[0];
    try {
      const ex = buildExam(prettify(label), await readSmart(f));
      replaceExam(ex);
      added++;
    } catch (err) {
      toast(`「${label}」解析失败：${err.message}`);
    }
  }
  if (added) {
    if (state.exams.length === 1) state.mode = state.exams[0].id;
    else if (!state.mode || !['all', ...state.exams.map(x => x.id)].includes(state.mode))
      state.mode = state.exams[state.exams.length - 1].id;
    persistExams();
    renderAll();
    toast(`✅ 已导入 ${added} 场考试，共 ${state.exams.reduce((a, b) => a + b.rows.length, 0)} 条记录`);
  }
}

/* ================= 事件与初始化 ================= */

function initTheme(){
  document.documentElement.dataset.theme = SafeStore.get('rb-theme') || 'light';
  const syncIcon = () => { $('#btnTheme').textContent = document.documentElement.dataset.theme === 'dark' ? '☀️' : '🌙'; };
  syncIcon();
  $('#btnTheme').onclick = () => {
    const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = t;
    SafeStore.set('rb-theme', t);
    syncIcon();
  };
}

function initEvents(){
  // 导入按钮
  $('#btnImport').onclick = () => $('#fileCsv').click();
  $('#fab').onclick = () => $('#fileCsv').click();
  $('#btnPickFiles').onclick = () => $('#fileCsv').click();
  $('#btnPickFolder').onclick = () => $('#fileDir').click();
  $('#fileCsv').onchange = e => { handleFiles(e.target.files); e.target.value = ''; };
  $('#fileDir').onchange = e => { handleFiles(e.target.files); e.target.value = ''; };

  // 管理按钮
  $('#btnManage').onclick = openManage;
  $('#mgrClose').onclick = closeManage;

  // 搜索
  $('#searchInput').addEventListener('input', e => { state.search = e.target.value; renderList(); });

  // 事件委托
  document.addEventListener('click', e => {
    const v = e.target.closest('[data-view]');
    if (v) { state.view = v.dataset.view; renderTabs(); renderList(); return; }
    const x = e.target.closest('[data-exam]');
    if (x) { state.mode = x.dataset.exam; mergeCache = null; renderAll(); return; }
    const r = e.target.closest('[data-name]');
    if (r && r.closest('#rankList,#podium')) { openPerson(r.dataset.name); return; }
    if (e.target.closest('#sheetClose') || e.target.classList.contains('sheet-back')) closeSheet();
    if (e.target.classList.contains('mgr-back')) closeManage();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeSheet(); closeManage(); }
  });

  // 涟漪
  document.addEventListener('pointerdown', e => {
    const el = e.target.closest('.rip');
    if (!el) return;
    const rc = el.getBoundingClientRect();
    const s = Math.max(rc.width, rc.height);
    const sp = document.createElement('span');
    sp.className = 'ripple';
    sp.style.width = sp.style.height = s + 'px';
    sp.style.left = (e.clientX - rc.left - s / 2) + 'px';
    sp.style.top = (e.clientY - rc.top - s / 2) + 'px';
    el.appendChild(sp);
    setTimeout(() => sp.remove(), 600);
  });

  // 拖拽
  ['dragover', 'dragenter'].forEach(ev => window.addEventListener(ev, e => {
    e.preventDefault();
    if (!$('#emptyState').hidden) $('#dropCard').classList.add('drag');
  }));
  ['dragleave', 'drop'].forEach(ev => window.addEventListener(ev, e => {
    e.preventDefault();
    $('#dropCard')?.classList.remove('drag');
    if (ev === 'drop' && e.dataTransfer?.files?.length) handleFiles(e.dataTransfer.files);
  }));
}

async function init(){
  initTheme();
  initEvents();

  // 优先自动读取 manifest（GitHub Pages）
  const autoloaded = await autoload();
  if (autoloaded.length) {
    state.mode = state.exams[state.exams.length - 1].id;
    renderAll();
    toast(`📂 已自动读取 ${autoloaded.length} 场考试`);
    return;
  }

  // 其次读取本地存储
  if (loadPersisted()) {
    state.mode = state.exams[state.exams.length - 1].id;
    renderAll();
    return;
  }

  renderAll();
}

init();

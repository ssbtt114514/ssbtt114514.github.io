/* ============================================================
   store.js — 状态管理、本地持久化、自动读取
   ============================================================ */
const LS_KEY = 'rankboard_exams_v1';

const state = { exams: [], mode: null, view: 'total', search: '' };
let mergeCache = null, mergeCacheKey = '';

/* ---------- 考试管理 ---------- */
function replaceExam(ex){
  const i = state.exams.findIndex(e => e.label === ex.label);
  if (i > -1) state.exams.splice(i, 1);
  state.exams.push(ex);
  state.exams.sort((a, b) => (a.date?.getTime() ?? Infinity) - (b.date?.getTime() ?? Infinity));
  mergeCache = null;
}

function removeExam(id){
  state.exams = state.exams.filter(e => e.id !== id);
  mergeCache = null;
  ensureMode();
  persistExams();
}

function renameExam(id, newName){
  const ex = state.exams.find(e => e.id === id);
  if (!ex) return;
  ex.label = newName;
  ex.date = guessDate(newName);
  state.exams.sort((a, b) => (a.date?.getTime() ?? Infinity) - (b.date?.getTime() ?? Infinity));
  mergeCache = null;
  persistExams();
}

/* ---------- 当前数据源 ---------- */
function currentDS(){
  if (state.mode === 'all' && state.exams.length > 1) {
    const key = state.exams.map(e => e.id).join(',');
    if (key !== mergeCacheKey) {
      mergeCache = mergeExams(state.exams);
      mergeCacheKey = key;
    }
    return mergeCache;
  }
  return state.exams.find(e => e.id === state.mode) || state.exams[state.exams.length - 1];
}

/* 校正当前选中模式：无效则落到最新一场；汇总需 >1 场 */
function ensureMode(){
  const valid = ['all', ...state.exams.map(e => e.id)];
  if (!state.mode || !valid.includes(state.mode)) {
    state.mode = state.exams.length ? state.exams[state.exams.length - 1].id : null;
  }
  if (state.mode === 'all' && state.exams.length <= 1) {
    state.mode = state.exams[0]?.id ?? null;
  }
}

/* ---------- 排序 ---------- */
function sortedFor(ds, view){
  const arr = [...ds.rows];
  if (view === 'total') {
    arr.sort((a, b) => (a.totalRank ?? 1e9) - (b.totalRank ?? 1e9) || (b.total ?? -1) - (a.total ?? -1));
  } else {
    arr.sort((a, b) =>
      (a.subjects[view]?.rank ?? 1e9) - (b.subjects[view]?.rank ?? 1e9)
      || (b.subjects[view]?.score ?? -1) - (a.subjects[view]?.score ?? -1)
    );
  }
  return arr;
}

/* 单科最高分学生（单次遍历 O(n)，避免为每科各做一次排序） */
function topScorer(ds, subject){
  let best = null;
  for (const r of ds.rows) {
    const sc = r.subjects[subject]?.score;
    if (sc != null && (!best || sc > best.subjects[subject].score)) best = r;
  }
  return best;
}

/* ---------- 历史轨迹 ---------- */
function historyOf(name){
  return state.exams.map(ex => ({
    label: ex.label,
    date: ex.date,
    row: ex.rows.find(r => r.name === name)
  })).filter(r => r.row).sort((a, b) => (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0));
}

/* ---------- 安全存储（跟踪保护/隐私模式下 localStorage 可能被禁用） ---------- */
const SafeStore = {
  get(k){ try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v){ try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
  remove(k){ try { localStorage.removeItem(k); } catch (e) {} }
};

/* ---------- 本地持久化 ---------- */
function persistExams(){
  const data = state.exams.map(e => ({ label: e.label, csv: e._csv }));
  SafeStore.set(LS_KEY, JSON.stringify(data));
}

function loadPersisted(){
  const raw = SafeStore.get(LS_KEY);
  if (!raw) return false;
  let arr;
  try { arr = JSON.parse(raw); } catch (e) { return false; }
  if (!Array.isArray(arr) || arr.length === 0) return false;
  let loaded = 0;
  arr.forEach(x => {
    if (x && x.csv) {
      try { replaceExam(buildExam(x.label, x.csv)); loaded++; } catch (e) {}
    }
  });
  return loaded > 0;
}

/* ---------- 自动读取 list/manifest.json ---------- */
function loadByManifest(){
  return fetch('list/manifest.json', { cache: 'no-store' })
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(m => Array.isArray(m) ? m : (m.exams || []));
}

/* 是否本地开发环境（本地服务器才有目录列表） */
const isLocalHost = ['localhost','127.0.0.1','0.0.0.0',''].includes(location.hostname);

/* 从目录列表读取（仅本地 Python http.server，会生成可解析的 index） */
async function loadFromDirectory(){
  const loaded = [];
  const r = await fetch('list/', { cache: 'no-store' });
  if (!r.ok) return loaded;
  const text = await r.text();
  const hrefs = [...text.matchAll(/href=["']([^"']+)["']/g)].map(m => m[1]);
  const folders = [...new Set(hrefs
    .map(h => decodeURIComponent(h.split('?')[0].split('#')[0]))
    .filter(h => h.endsWith('/') && !/^(\.\.?)?\/$/.test(h) && !/^https?:/.test(h))
    .map(h => h.slice(0, -1)))];
  for (const f of folders) {
    try {
      const t = await fetch(`list/${f}/main.csv`).then(rr => rr.ok ? rr.text() : Promise.reject());
      replaceExam(buildExam(prettify(f), t));
      loaded.push(f);
    } catch (e) {}
  }
  return loaded;
}

/* 从 manifest 读取（GitHub Pages 等静态托管，无目录列表） */
async function loadFromManifest(){
  const loaded = [];
  const items = await loadByManifest();
  for (const it of items) {
    const name = typeof it === 'string' ? it : it.name;
    const path = typeof it === 'string' ? `list/${name}/main.csv` : it.path;
    const t = await fetch(path).then(rr => rr.ok ? rr.text() : Promise.reject());
    replaceExam(buildExam(prettify(name), t));
    loaded.push(name);
  }
  return loaded;
}

async function autoload(){
  // 本地开发：优先目录列表（新增文件夹无需改 manifest）
  if (isLocalHost) {
    try {
      const d = await loadFromDirectory();
      if (d.length) return d;
    } catch (e) {}
  }
  // 静态托管（GitHub Pages）：直接读 manifest，避免对 list/ 的 404
  try {
    return await loadFromManifest();
  } catch (e) {}
  // 本地环境 manifest 也失败则不再尝试目录（上面已试）
  return [];
}

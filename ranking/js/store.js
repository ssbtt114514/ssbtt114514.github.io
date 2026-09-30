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
  if (state.mode === id) state.mode = state.exams.length ? state.exams[state.exams.length - 1].id : null;
  if (state.mode === 'all' && state.exams.length <= 1) state.mode = state.exams[0]?.id ?? null;
  mergeCache = null;
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

/* ---------- 历史轨迹 ---------- */
function historyOf(name){
  return state.exams.map(ex => ({
    label: ex.label,
    date: ex.date,
    row: ex.rows.find(r => r.name === name)
  })).filter(r => r.row).sort((a, b) => (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0));
}

/* ---------- 本地持久化 ---------- */
function persistExams(){
  try {
    const data = state.exams.map(e => ({ label: e.label, csv: e._csv }));
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch (e) { /* 配额超限忽略 */ }
}

function loadPersisted(){
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return false;
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr) || arr.length === 0) return false;
    let loaded = 0;
    arr.forEach(x => {
      if (x && x.csv) {
        try { replaceExam(buildExam(x.label, x.csv)); loaded++; } catch (e) {}
      }
    });
    return loaded > 0;
  } catch (e) { return false; }
}

/* ---------- 自动读取 list/manifest.json ---------- */
function loadByManifest(){
  return fetch('list/manifest.json', { cache: 'no-store' })
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(m => Array.isArray(m) ? m : (m.exams || []));
}

async function autoload(){
  const loaded = [];
  // 1) 尝试目录列表（仅本地 Python 服务器可用）
  try {
    const r = await fetch('list/', { cache: 'no-store' });
    if (r.ok) {
      const text = await r.text();
      const hrefs = [...text.matchAll(/href=["']([^"']+)["']/g)].map(m => m[1]);
      const folders = [...new Set(hrefs
        .map(h => decodeURIComponent(h.split('?')[0]))
        .filter(h => h.endsWith('/') && h !== '../' && !/^https?:/.test(h))
        .map(h => h.slice(0, -1)))];
      for (const f of folders) {
        try {
          const t = await fetch(`list/${f}/main.csv`).then(rr => rr.ok ? rr.text() : Promise.reject());
          replaceExam(buildExam(prettify(f), t));
          loaded.push(f);
        } catch (e) {}
      }
    }
  } catch (e) {}
  if (loaded.length) return loaded;

  // 2) GitHub Pages：读取 manifest.json
  try {
    const items = await loadByManifest();
    for (const it of items) {
      const name = typeof it === 'string' ? it : it.name;
      const path = typeof it === 'string' ? `list/${name}/main.csv` : it.path;
      const t = await fetch(path).then(rr => rr.ok ? rr.text() : Promise.reject());
      replaceExam(buildExam(prettify(name), t));
      loaded.push(name);
    }
  } catch (e) {}
  return loaded;
}

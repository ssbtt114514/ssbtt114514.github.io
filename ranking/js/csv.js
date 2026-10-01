/* ============================================================
   csv.js — CSV 解析（PapaParse）与考试构建
   ============================================================ */
const SUBJECTS = ['语文','数学','英语','物理','地理','生物','化学','历史','政治'];
const SUBJ_COLORS = {
  语文:'#f59e0b', 数学:'#06b6d4', 英语:'#8b5cf6', 物理:'#3b82f6',
  地理:'#10b981', 生物:'#84cc16', 化学:'#f43f5e', 历史:'#b45309', 政治:'#14b8a6'
};
const PRIMARY_HEX = '#0e7490';
const AV_COLORS = ['#0e7490','#7c3aed','#db2777','#ea580c','#059669','#2563eb','#b45309'];

/* ---------- 日期解析 ---------- */
function guessDate(label){
  let m = String(label).match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
  if (m) return new Date(+m[1], +m[2]-1, +m[3]);
  m = String(label).match(/(\d{4})(\d{2})(\d{2})/);
  if (m) return new Date(+m[1], +m[2]-1, +m[3]);
  return null;
}

function prettify(label){
  const m = String(label).match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/)
    || String(label).match(/^.*?(\d{4})(\d{2})(\d{2}).*$/);
  if (m) return `${m[1]}年${+m[2]}月${+m[3]}日`;
  return label;
}

/* ---------- 自动补全排名（竞赛排名 1224：同分同名次） ----------
   scoreOf / getRank / setRank 以访问器形式传入，统一处理总分与各科。 */
function assignRanks(rows, scoreOf, getRank, setRank){
  const valid = rows.filter(r => scoreOf(r) != null);
  if (!valid.length || valid.every(r => getRank(r) != null)) return;
  const sorted = valid.map(scoreOf).sort((a, b) => b - a);
  valid.forEach(r => {
    if (getRank(r) == null) setRank(r, sorted.indexOf(scoreOf(r)) + 1);
  });
}

function ensureRanks(ex){
  // 总分排名
  assignRanks(ex.rows, r => r.total, r => r.totalRank, (r, v) => r.totalRank = v);
  // 各科排名
  for (const s of ex.subjects) {
    assignRanks(
      ex.rows,
      r => r.subjects[s]?.score,
      r => r.subjects[s]?.rank,
      (r, v) => { if (r.subjects[s]) r.subjects[s].rank = v; }
    );
  }
}

/* ---------- 装饰：最大值 ---------- */
function decorateDS(ds){
  ds._max = { total: Math.max(0, ...ds.rows.map(r => r.total ?? -1)) };
  for (const s of ds.subjects) ds._max[s] = Math.max(0, ...ds.rows.map(r => r.subjects[s]?.score ?? -1));
  return ds;
}

/* ---------- 残缺数据补全 ----------
   1) 缺总分：已知科目求和
   2) 缺恰好一门科目、总分已知：总分 − 其余科目之和
   3) 排名由 ensureRanks 依据分数统一重算
*/
function inferMissing(p, subjects){
  const known = subjects.filter(s => p.subjects[s]?.score != null);
  const missing = subjects.filter(s => p.subjects[s]?.score == null);
  const sumKnown = known.reduce((a, s) => a + p.subjects[s].score, 0);

  if (p.total == null && known.length) {
    // 缺总分 → 科目求和
    p.total = +sumKnown.toFixed(1);
    p._totalInferred = true;
  } else if (p.total != null && missing.length === 1 && known.length) {
    // 缺一门科目 → 总分反推
    const inferred = p.total - sumKnown;
    if (inferred >= 0) {
      p.subjects[missing[0]].score = +inferred.toFixed(1);
      p.subjects[missing[0]]._inferred = true;
    }
  }
}

/* ---------- 从 CSV 文本构建考试对象（PapaParse） ---------- */
function buildExam(label, text){
  const result = Papa.parse(text, {
    header: false,
    skipEmptyLines: 'greedy',
    dynamicTyping: false
  });
  const grid = result.data;
  if (!grid || grid.length < 2) throw new Error('内容为空');

  const header = grid[0].map(h => String(h ?? '').trim());
  const find = cands => {
    for (const c of cands) {
      const i = header.indexOf(c);
      if (i > -1) return i;
    }
    return -1;
  };
  const iName = find(['姓名','学生姓名','名字','学生']);
  if (iName < 0) throw new Error('未找到"姓名"列');
  const iClass = find(['班名','班级排名','班排','班内排名']);
  const iTotal = find(['总分','总成绩','合计']);
  const iTR = find(['年名','年级排名','总排名','年排名','校排名']);

  const subjects = [], subIdx = {};
  for (const s of SUBJECTS) {
    const si = header.indexOf(s);
    if (si > -1) {
      subjects.push(s);
      subIdx[s] = {
        score: si,
        rank: find([s+'年名', s+'排名', s+'年级排名', s+'年排', s+'班名', s+'班级排名'])
      };
    }
  }
  if (subjects.length === 0) throw new Error('未识别到科目列（语文/数学/英语…）');

  const num = v => {
    const n = parseFloat(String(v ?? '').replace(/[^0-9.\-]/g, ''));
    return isNaN(n) ? null : n;
  };

  const rows = [];
  for (let r = 1; r < grid.length; r++) {
    const g = grid[r];
    const name = String(g[iName] ?? '').trim();
    if (!name || /^(合计|总计|小计|累计|平均|平均分)$/.test(name)) continue;
    const p = {
      name,
      classRank: iClass > -1 ? num(g[iClass]) : null,
      total: iTotal > -1 ? num(g[iTotal]) : null,
      totalRank: iTR > -1 ? num(g[iTR]) : null,
      subjects: {}
    };
    // 先解析各科
    for (const s of subjects) {
      p.subjects[s] = {
        score: num(g[subIdx[s].score]),
        rank: subIdx[s].rank > -1 ? num(g[subIdx[s].rank]) : null
      };
    }
    // 残缺补全
    inferMissing(p, subjects);
    rows.push(p);
  }
  if (!rows.length) throw new Error('无有效数据行');

  const ex = {
    id: 'e_' + Math.random().toString(36).slice(2, 9),
    label,
    date: guessDate(label),
    subjects,
    rows,
    _csv: text
  };
  ensureRanks(ex);
  decorateDS(ex);
  return ex;
}

/* ---------- 汇总多场考试 ---------- */
function mergeExams(exams){
  const map = new Map();
  for (const ex of exams) {
    for (const p of ex.rows) {
      if (!map.has(p.name)) map.set(p.name, { name: p.name, records: [], classRank: p.classRank, subjects: {} });
      const rec = map.get(p.name);
      rec.records.push(p);
      if (p.classRank != null) rec.classRank = p.classRank;
    }
  }
  const subjects = [];
  for (const s of SUBJECTS) if (exams.some(e => e.subjects.includes(s))) subjects.push(s);
  const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
  const rows = [...map.values()].map(m => {
    const row = {
      name: m.name,
      classRank: m.classRank,
      records: m.records,
      total: avg(m.records.map(r => r.total).filter(v => v != null)),
      totalRank: null,
      subjects: {}
    };
    for (const s of subjects) {
      const vs = m.records.map(r => r.subjects[s]?.score).filter(v => v != null);
      row.subjects[s] = {
        score: vs.length ? +(vs.reduce((a, b) => a + b, 0) / vs.length).toFixed(1) : null,
        rank: null
      };
    }
    return row;
  });
  const ex = {
    id: '__merged__',
    label: `汇总 · ${exams.length} 次考试`,
    isMerged: true,
    date: null,
    subjects,
    rows
  };
  ensureRanks(ex);
  decorateDS(ex);
  return ex;
}

/* ---------- 文件读取（UTF-8 / GBK 自动检测） ---------- */
function readSmart(file){
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => {
      try {
        let text = new TextDecoder('utf-8').decode(fr.result);
        if (text.includes('\uFFFD')) text = new TextDecoder('gbk').decode(fr.result);
        res(text);
      } catch (e) { rej(e); }
    };
    fr.onerror = rej;
    fr.readAsArrayBuffer(file);
  });
}

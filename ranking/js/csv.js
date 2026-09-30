/* csv.js */
/* ============================================================
   成绩排名看板 —— 核心逻辑（原生 JS）
   ============================================================ */
const SUBJECT_ORDER = ['语文','数学','英语','物理','化学','地理','生物','历史','政治'];
const SUBJECT_COLOR = {
  语文:'#e11d48', 数学:'#0284c7', 英语:'#059669', 物理:'#d97706', 化学:'#0891b2',
  地理:'#65a30d', 生物:'#db2777', 历史:'#b45309', 政治:'#475569'
};
const AVATAR_COLORS = ['#0d9488','#0284c7','#059669','#d97706','#db2777','#0891b2','#65a30d','#e11d48','#475569','#7c3aed'];
const TOTAL = '__total__', GR = '__gr__', AGG = '__aggregate__';
const LS_KEY = 'grade_rank_system_v1';
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- CSV 解析（支持引号、逗号、换行） ---------- */
function parseCSV(text){
  text = String(text).replace(/^﻿/,'');
  const rows=[]; let row=[], cur='', inQ=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(inQ){
      if(c==='"'){ if(text[i+1]==='"'){cur+='"';i++;} else inQ=false; }
      else cur+=c;
    }else{
      if(c==='"') inQ=true;
      else if(c===','){ row.push(cur); cur=''; }
      else if(c==='\n'){ row.push(cur); rows.push(row); row=[]; cur=''; }
      else if(c==='\r'){ /* skip */ }
      else cur+=c;
    }
  }
  if(cur.length||row.length){ row.push(cur); rows.push(row); }
  return rows.filter(r=>r.some(x=>String(x).trim()!==''));
}

/* ---------- 考试日期解析（文件夹名如 2026-3-5） ---------- */
function parseExamDate(name){
  let m = name.match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
  if(m) return new Date(+m[1], +m[2]-1, +m[3]).getTime();
  m = name.match(/(\d{4})\D+(\d{1,2})/);
  if(m) return new Date(+m[1], +m[2]-1, 1).getTime();
  return NaN;
}

/* ---------- 从 CSV 文本构建考试对象 ---------- */
function buildExam(name, text){
  const rows = parseCSV(text);
  if(rows.length<2) throw new Error('表格中没有数据行');
  const h = rows[0].map(x=>String(x).trim());
  const norm = s => s.replace(/[\s　]/g,'');
  const findIdx = names => {
    for(const n of names){
      const i = h.findIndex(x => x===n || norm(x)===n);
      if(i>=0) return i;
    }
    return -1;
  };
  const iName  = findIdx(['姓名','名字','学生','学生姓名','name','Name']);
  const iTotal = findIdx(['总分','总得分','合计','总成绩']);
  const iClass = findIdx(['班名','班级排名','班排名','班内排名']);
  const iGrade = findIdx(['年名','年级排名','年排名','校排名','年级名次']);
  const subjects = SUBJECT_ORDER.filter(s=>h.includes(s));
  if(subjects.length===0) throw new Error('未识别到科目列（语文/数学/英语…）');
  const subIdx = {}, subRankIdx = {};
  for(const s of subjects){
    subIdx[s] = h.indexOf(s);
    subRankIdx[s] = [s+'年名', s+'年级排名', s+'年排名', s+'班名', s+'班级排名', s+'排名', s+'名次']
      .map(x=>h.indexOf(x)).find(i=>i>=0) ?? -1;
  }
  const students = [];
  for(let r=1;r<rows.length;r++){
    const row = rows[r];
    const nm = String(row[iName>=0?iName:0]||'').trim();
    if(!nm || /^(合计|总计|小计|累计|平均|平均分)$/.test(nm)) continue;
    const cell = i => i>=0 ? parseFloat(String(row[i]).replace(/[^\d.\-]/g,'')) : NaN;
    const scores = {};
    let sum=0, cnt=0;
    for(const s of subjects){
      const v = cell(subIdx[s]);
      scores[s] = { v, gr: cell(subRankIdx[s]) };
      if(!isNaN(v)){ sum+=v; cnt++; }
    }
    let total = cell(iTotal);
    if(isNaN(total)) total = cnt?sum:NaN;
    students.push({ name:nm, total, classRank:cell(iClass), gradeRank:cell(iGrade), scores });
  }
  if(students.length===0) throw new Error('未解析到学生记录');
  return { id:'e_'+Math.random().toString(36).slice(2,9), name, date:parseExamDate(name),
           subjects, students, _csv:text, _aggregate:false };
}

/* store.js */
/* ---------- 数据仓库 ---------- */
let exams = [];
const state = { examId:null, metric:TOTAL, q:'', view:'list', student:null, detailMetric:TOTAL };

function sortExams(){
  exams.sort((a,b)=> (a.date||0)-(b.date||0) || a.name.localeCompare(b.name,'zh'));
}
function addExam(name, text){
  const ex = buildExam(name, text);
  const i = exams.findIndex(e=>e.name===ex.name);
  if(i>=0) ex.id = exams[i].id, exams[i] = ex; else exams.push(ex);
  sortExams();
  return { exam:ex, replaced:i>=0 };
}
function renameExam(id, newName){
  const ex = exams.find(e=>e.id===id); if(!ex) return;
  ex.name = newName; ex.date = parseExamDate(newName); sortExams();
}
function removeExam(id){
  exams = exams.filter(e=>e.id!==id);
  if(state.examId===id) state.examId = exams.length? exams[exams.length-1].id : null;
}

/* ---------- 汇总考试（各次平均） ---------- */
function buildAggregate(){
  const map = new Map();
  for(const ex of exams){
    for(const st of ex.students){
      if(!map.has(st.name)) map.set(st.name, { name:st.name, count:0,
        tSum:0,tN:0, gSum:0,gN:0, sc:{} });
      const a = map.get(st.name);
      a.count++;
      if(!isNaN(st.total)){ a.tSum+=st.total; a.tN++; }
      if(!isNaN(st.gradeRank)){ a.gSum+=st.gradeRank; a.gN++; }
      for(const s of ex.subjects){
        const v = st.scores[s]?.v, gr = st.scores[s]?.gr;
        if(!a.sc[s]) a.sc[s] = { sum:0,n:0, gsum:0,gn:0 };
        if(!isNaN(v)){ a.sc[s].sum+=v; a.sc[s].n++; }
        if(!isNaN(gr)){ a.sc[s].gsum+=gr; a.sc[s].gn++; }
      }
    }
  }
  const subjects = SUBJECT_ORDER.filter(s => exams.some(e=>e.subjects.includes(s)));
  const students = [];
  for(const a of map.values()){
    const scores = {};
    for(const s of subjects){
      const o = a.sc[s];
      scores[s] = o ? { v:o.n?o.sum/o.n:NaN, gr:o.gn?o.gsum/o.gn:NaN } : { v:NaN, gr:NaN };
    }
    students.push({ name:a.name, total:a.tN?a.tSum/a.tN:NaN,
      gradeRank:a.gN?a.gSum/a.gN:NaN, classRank:NaN, count:a.count, scores });
  }
  return { id:AGG, name:'汇总（平均）', date:NaN, subjects, students, _aggregate:true };
}

/* ---------- 排名计算（同分并列） ---------- */
function metricValue(st, m){ return m===TOTAL ? st.total : st.scores[m]?.v; }
function metricGrade(st, m){ return m===TOTAL ? st.gradeRank : st.scores[m]?.gr; }
function rankRows(exam, m){
  const rows = exam.students
    .map(st=>({ st, v:metricValue(st,m), gr:metricGrade(st,m) }))
    .filter(r=>!isNaN(r.v));
  rows.sort((a,b)=> b.v-a.v || a.st.name.localeCompare(b.st.name,'zh'));
  rows.forEach((r,i)=>{ r.rank = (i>0 && r.v===rows[i-1].v) ? rows[i-1].rank : i+1; });
  return rows;
}
function currentExam(){
  if(state.examId===AGG) return buildAggregate();
  return exams.find(e=>e.id===state.examId) || buildAggregate();
}

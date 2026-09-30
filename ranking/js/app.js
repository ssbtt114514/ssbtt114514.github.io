/* app.js —— 渲染、交互与自动读取 */
/* ============================================================
   渲染层
   ============================================================ */
const $ = id => document.getElementById(id);
function esc(s){ return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function fmt(v, digits=1){
  if(v===null||v===undefined||isNaN(v)) return '—';
  const r = Math.round(v*Math.pow(10,digits))/Math.pow(10,digits);
  return String(r);
}
function avatarColor(name){
  let h=0; for(let i=0;i<name.length;i++) h=(h*31 + name.charCodeAt(i))>>>0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function avatarHTML(name, cls=''){
  return `<span class="avatar ${cls}" style="background:linear-gradient(135deg,${avatarColor(name)},${avatarColor(name)}cc)">${esc(name[0]||'?')}</span>`;
}
let activeCharts = [];
function disposeCharts(){
  activeCharts.forEach(c=>{ try{c.dispose();}catch(e){} });
  activeCharts = [];
}

/* ---------- 考试 chips ---------- */
function renderExamChips(){
  const box = $('examChips');
  let html = exams.map(ex=>{
    const on = state.examId===ex.id;
    return `<button class="exam-chip rippable ${on?'on':''}" data-exam="${ex.id}" role="tab"
      aria-selected="${on}">${esc(ex.name)}<span class="cnt">${ex.students.length}人</span></button>`;
  }).join('');
  if(exams.length>=2){
    const on = state.examId===AGG;
    html += `<button class="exam-chip rippable ${on?'on':''}" data-exam="${AGG}" role="tab" aria-selected="${on}">
      <svg width="12" height="12" viewBox="0 0 24 24" style="vertical-align:-1px;margin-right:3px" fill="none"><path d="M4 18v-7M10 18V6M16 18v-9M22 18H2" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>
      汇总（平均）</button>`;
  }
  box.innerHTML = html;
}

/* ---------- 科目 Tabs ---------- */
function renderTabs(){
  const exam = currentExam();
  const bar = $('tabBar');
  const tabs = [{k:TOTAL, n:'总分'}].concat(exam.subjects.map(s=>({k:s,n:s})));
  if(!tabs.some(t=>t.k===state.metric)) state.metric = TOTAL;
  bar.innerHTML = `<span class="tab-indicator" id="tabIndicator"></span>` +
    tabs.map(t=>{
      const on = state.metric===t.k;
      return `<button class="tab-btn ${on?'on':''}" data-metric="${t.k===TOTAL?TOTAL:esc(t.k)}"
        role="tab" aria-selected="${on}">${esc(t.n)}</button>`;
    }).join('');
  requestAnimationFrame(moveTabIndicator);
}
function moveTabIndicator(){
  const bar = $('tabBar');
  const active = bar.querySelector('.tab-btn.on');
  const ind = $('tabIndicator');
  if(!active||!ind) return;
  ind.style.width = active.offsetWidth*0.56+'px';
  ind.style.transform = `translateX(${active.offsetLeft + active.offsetWidth*0.22 - bar.scrollLeft}px)`;
}

/* ---------- 领奖台 ---------- */
function renderPodium(rows, maxV){
  const box = $('podium');
  if(state.q || rows.length<3){ box.innerHTML=''; box.hidden = true; return; }
  box.hidden = false;
  const order = [rows[1], rows[0], rows[2]];
  const cls = ['p2','p1','p3'];
  box.innerHTML = order.map((r,i)=>{
    const st = r.st;
    const color = state.metric===TOTAL ? 'var(--primary)' : SUBJECT_COLOR[state.metric];
    const grTxt = !isNaN(r.gr) ? `年名 ${fmt(r.gr,0)}` : '';
    return `<div class="podium-item glass rippable ${cls[i]}" data-student="${esc(st.name)}">
      <span class="p-rank">第 ${r.rank} 名</span>
      ${avatarHTML(st.name)}
      <span class="p-name">${esc(st.name)}</span>
      <span class="p-val">${fmt(r.v)}</span>
      <span class="p-gr">${grTxt}${st.count?` · ${st.count}次考试`:''}</span>
      <span class="p-bar"><i style="background:${color};width:${Math.max(8,r.v/maxV*100)}%"></i></span>
    </div>`;
  }).join('');
}

/* ---------- 榜单 ---------- */
function renderList(){
  const exam = currentExam();
  let rows = rankRows(exam, state.metric);
  if(state.q) rows = rows.filter(r=>r.st.name.includes(state.q));
  const list = $('rankList');
  if(rows.length===0){
    $('podium').innerHTML=''; $('podium').hidden=true;
    list.innerHTML = `<div class="empty">
      <div class="e-ic"><svg width="44" height="44" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#0f766e" stroke-width="2"/><path d="m20 20-3.2-3.2" stroke="#0f766e" stroke-width="2" stroke-linecap="round"/></svg></div>
      <h3>没有找到匹配的学生</h3><p>换个关键词试试</p></div>`;
    return;
  }
  const maxV = Math.max(...rows.map(r=>r.v));
  renderPodium(rows, maxV);
  const metricName = state.metric===TOTAL ? '总分' : state.metric;
  list.innerHTML = rows.map((r,i)=>{
    const st = r.st;
    const rc = r.rank<=3 ? 'r'+r.rank : '';
    const grTag = !isNaN(r.gr) ? `<span class="tag gray">年名 ${fmt(r.gr,0)}</span>` : '';
    const clsTag = !isNaN(st.classRank) && state.metric===TOTAL
      ? `<span class="tag">原班名 ${fmt(st.classRank,0)}</span>` : '';
    const cntTag = st.count ? `<span class="tag">${st.count}次</span>` : '';
    const delay = Math.min((i*38), 420);
    return `<div class="rank-row glass rippable" data-student="${esc(st.name)}" style="animation-delay:${delay}ms">
      <span class="rank-badge ${rc}">${r.rank}</span>
      ${avatarHTML(st.name)}
      <span class="r-main">
        <span class="r-name">${esc(st.name)}</span>
        <span class="r-sub">${clsTag}${grTag}${cntTag}</span>
      </span>
      <span class="r-val"><b>${fmt(r.v)}</b><span>${metricName}</span></span>
      <svg class="chev" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="m9 6 6 6-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>`;
  }).join('');
}

/* ---------- 空态（无考试） ---------- */
function renderEmptyState(){
  $('listView').innerHTML = `<div class="empty">
    <div class="e-ic"><svg width="46" height="46" viewBox="0 0 24 24" fill="none"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" stroke="#0f766e" stroke-width="2" stroke-linejoin="round"/><path d="M14 3v5h5M9 13h6M9 17h4" stroke="#0f766e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
    <h3>还没有成绩数据</h3>
    <p id="emptyStatus"></p>
    <p>把成绩放入「list/日期/main.csv」即可自动读取，也可以直接导入表格<br>支持多次考试独立查看与汇总平均排名</p>
    <div class="e-actions">
      <button class="btn btn-primary rippable" id="emptyFile">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M12 16V4m0 0L8 8m4-4 4 4M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        导入 CSV 表格</button>
      <button class="btn btn-tonal rippable" id="emptyFolder">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M3 7a2 2 0 0 1 2-2h4l2 2.2h8a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>
        导入文件夹</button>
    </div></div>`;
  $('emptyFile').onclick = ()=>$('fileInput').click();
  $('emptyFolder').onclick = ()=>$('folderInput').click();
}

/* ---------- 主渲染 ---------- */
function render(){
  disposeCharts();
  if(exams.length===0){
    $('listView').hidden = false; $('detailView').hidden = true;
    renderEmptyState(); renderExamChips();
    $('tabBar').style.visibility='hidden';
    $('search').parentElement.style.display='none';
    return;
  }
  $('tabBar').style.visibility='visible';
  $('search').parentElement.style.display='';
  renderExamChips();
  if(state.view==='detail'){
    $('listView').hidden = true;
    const dv = $('detailView'); dv.hidden = false;
    renderDetail();
  }else{
    $('detailView').hidden = true;
    $('listView').hidden = false;
    renderTabs();
    renderList();
  }
}
function transitionRender(){
  if(!reduceMotion && document.startViewTransition && state.view==='list'){
    document.startViewTransition(()=>render());
  }else render();
}

/* ============================================================
   学生详情
   ============================================================ */
function examsWithStudent(name){
  return exams.filter(ex=>ex.students.some(s=>s.name===name));
}
function renderDetail(){
  const name = state.student;
  const ctxExam = currentExam();
  const st = ctxExam.students.find(s=>s.name===name);
  const present = examsWithStudent(name);
  const dv = $('detailView');
  if(!st){ state.view='list'; render(); return; }

  /* 上下文各科排名 */
  const rankCache = {};
  const subjectRows = ctxExam.subjects.map(s=>{
    if(!rankCache[s]) rankCache[s] = rankRows(ctxExam, s);
    const rr = rankCache[s].find(r=>r.st.name===name);
    const vals = ctxExam.students.map(x=>x.scores[s]?.v).filter(v=>!isNaN(v));
    const max = vals.length?Math.max(...vals):NaN;
    return { s, v:st.scores[s]?.v, rank:rr?.rank, gr:st.scores[s]?.gr, max };
  });
  const totalRankRows_ = rankRows(ctxExam, TOTAL);
  const totalRow = totalRankRows_.find(r=>r.st.name===name);

  /* 头部 */
  let html = `<button class="dt-back rippable" id="dtBack">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="m15 6-6 6 6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      返回榜单</button>
    <div class="dt-hero glass-strong">
      ${avatarHTML(name)}
      <div class="dt-h-main">
        <div class="dt-h-name">${esc(name)}</div>
        <div class="dt-h-tags">
          <span class="tag">班内第 ${totalRow?.rank ?? '—'} 名</span>
          ${!isNaN(st.gradeRank)?`<span class="tag gray">年名 ${fmt(st.gradeRank)}</span>`:''}
          ${st.count?`<span class="tag gray">参与 ${st.count} 次考试</span>`:''}
        </div>
      </div>
      <div class="dt-h-total"><b id="heroTotal">${fmt(st.total)}</b><span>${esc(ctxExam._aggregate?'平均总分':'总分')}</span></div>
    </div>`;

  /* 科目卡片 */
  html += `<div class="sec-title">各科成绩 · ${esc(ctxExam.name)}</div><div class="sub-grid">` +
    subjectRows.map(o=>{
      const pct = !isNaN(o.v)&&o.max ? o.v/o.max*100 : 0;
      return `<div class="sub-card glass">
        <div class="sc-top">
          <span class="sc-dot" style="background:${SUBJECT_COLOR[o.s]}"></span>
          <span class="sc-name">${esc(o.s)}</span>
          <span class="sc-rank">班内 ${o.rank??'—'}${!isNaN(o.gr)?` · 年名${fmt(o.gr,0)}`:''}</span>
        </div>
        <div class="sc-val" style="color:${SUBJECT_COLOR[o.s]}">${fmt(o.v)}</div>
        <div class="sc-bar"><i data-w="${pct}" style="background:linear-gradient(90deg,${SUBJECT_COLOR[o.s]},${SUBJECT_COLOR[o.s]}99)"></i></div>
      </div>`;
    }).join('') + `</div>`;

  /* 历史走势 */
  if(present.length>=1){
    const segMetrics = [TOTAL].concat(SUBJECT_ORDER.filter(s=>present.some(ex=>ex.subjects.includes(s)))).concat([GR]);
    html += `<div class="sec-title">历史走势</div>
      <div class="chart-card glass">
        <div class="seg" id="histSeg">
          ${segMetrics.map(m=>{
            const n = m===TOTAL?'总分':m===GR?'年名':m;
            return `<button class="seg-btn rippable ${state.detailMetric===m?'on':''}" data-hm="${m===TOTAL?TOTAL:m===GR?GR:esc(m)}">${esc(n)}</button>`;
          }).join('')}
        </div>
        <div class="chart" id="histChart"></div>
      </div>`;
    /* 雷达图：最近一次考试得分率 */
    const last = present[present.length-1];
    if(last.subjects.length>=3){
      html += `<div class="sec-title">最近考试能力画像 · ${esc(last.name)}</div>
        <div class="chart-card glass"><div class="chart" id="radarChart" style="height:320px"></div></div>`;
    }
    /* 历史明细表 */
    const allSubs = SUBJECT_ORDER.filter(s=>present.some(ex=>ex.subjects.includes(s)));
    html += `<div class="sec-title">历次成绩明细</div>
      <div class="table-scroll"><table class="hist-table">
        <thead><tr><th>考试</th><th>总分</th><th>年名</th>${allSubs.map(s=>`<th>${esc(s)}</th>`).join('')}</tr></thead>
        <tbody>${present.map(ex=>{
          const s2 = ex.students.find(x=>x.name===name);
          return `<tr><td>${esc(ex.name)}</td><td><b>${fmt(s2.total)}</b></td>
            <td>${fmt(s2.gradeRank,0)}</td>
            ${allSubs.map(sb=>`<td>${fmt(s2.scores[sb]?.v)}</td>`).join('')}</tr>`;
        }).join('')}</tbody></table></div>`;
  }
  dv.innerHTML = html;

  /* 动画：进度条 */
  requestAnimationFrame(()=>{
    dv.querySelectorAll('.sc-bar i').forEach((el,i)=>{
      setTimeout(()=>{ el.style.width = el.dataset.w+'%'; }, 80+i*60);
    });
  });

  /* 图表 */
  if($('histChart')) renderHistoryChart(name, state.detailMetric);
  if($('radarChart')) renderRadarChart(name);

  /* 事件 */
  $('dtBack').onclick = ()=>{ state.view='list'; transitionRender(); window.scrollTo({top:0}); };
  dv.querySelectorAll('#histSeg .seg-btn').forEach(b=>{
    b.onclick = ()=>{
      state.detailMetric = b.dataset.hm===TOTAL?TOTAL:b.dataset.hm===GR?GR:b.dataset.hm;
      dv.querySelectorAll('#histSeg .seg-btn').forEach(x=>x.classList.toggle('on',x===b));
      if($('histChart')) renderHistoryChart(name, state.detailMetric);
    };
  });
}

/* ============================================================
   交互：导入 / 管理 / 反馈
   ============================================================ */
let snackTimer = null;
function snack(msg){
  const el = $('snack'); el.textContent = msg; el.classList.add('on');
  clearTimeout(snackTimer);
  snackTimer = setTimeout(()=>el.classList.remove('on'), 2600);
}

/* ---------- 涟漪 ---------- */
function bindRipple(root=document){
  root.addEventListener('pointerdown', e=>{
    const t = e.target.closest('.rippable');
    if(!t) return;
    const r = t.getBoundingClientRect();
    const size = Math.max(r.width, r.height);
    const span = document.createElement('span');
    span.className = 'ripple-span';
    span.style.width = span.style.height = size+'px';
    span.style.left = (e.clientX-r.left-size/2)+'px';
    span.style.top  = (e.clientY-r.top-size/2)+'px';
    t.appendChild(span);
    setTimeout(()=>span.remove(), 650);
  });
}

/* ---------- FAB 菜单 ---------- */
function setFab(on){
  $('fabWrap').classList.toggle('on',on);
  $('fabScrim').classList.toggle('on',on);
}
$('fab').onclick = ()=>setFab(!$('fabWrap').classList.contains('on'));
$('fabScrim').onclick = ()=>setFab(false);
$('fabFile').onclick = ()=>{ setFab(false); $('fileInput').click(); };
$('fabFolder').onclick = ()=>{ setFab(false); $('folderInput').click(); };
$('btnImportTop').onclick = ()=>setFab(true);

/* ---------- 文件读取 ---------- */
function readFileAsText(file){
  return new Promise((res,rej)=>{
    const fr = new FileReader();
    fr.onload = ()=>res(fr.result);
    fr.onerror = ()=>rej(fr.error);
    fr.readAsText(file,'utf-8');
  });
}
function examNameFromFile(file){
  const rel = file.webkitRelativePath || file.webkitRelativePath === '' ? file.webkitRelativePath : '';
  let base = file.name.replace(/\.(csv|CSV)$/,'');
  if(rel){
    const parts = rel.split('/').filter(Boolean);
    if(parts.length>=2){
      if(base==='main' || base==='table' || /^table_?\d*$/.test(base)){
        return parts[parts.length-2];
      }
      return parts[parts.length-2] === 'list' ? base : parts[parts.length-2];
    }
  }
  if(/^table[_-]?\d{4}[-_]?\d{2}[-_]?\d{2}$/.test(base)){
    const m = base.match(/(\d{4})[-_]?(\d{2})[-_]?(\d{2})/);
    if(m) return `${m[1]}-${+m[2]}-${+m[3]}`;
  }
  return base;
}
async function handleFiles(fileList, fromFolder=false){
  const files = Array.from(fileList).filter(f=>/\.csv$/i.test(f.name));
  if(files.length===0){ snack('请选择 CSV 格式的表格'); return; }
  let ok=0, fail=0, replaced=0;
  const firstName = examNameFromFile(files[0]);
  for(const f of files){
    try{
      const text = await readFileAsText(f);
      const nm = examNameFromFile(f);
      const r = addExam(nm, text);
      r.replaced ? replaced++ : ok++;
    }catch(err){ fail++; }
  }
  if(ok+replaced>0){
    if(!state.examId || exams.every(e=>e.id!==state.examId)){
      state.examId = exams[exams.length-1].id;
    }
    state.view='list';
    persistExams();
    transitionRender();
    const bits = [];
    if(ok) bits.push(`新增 ${ok} 次考试`);
    if(replaced) bits.push(`更新 ${replaced} 次`);
    if(fail) bits.push(`${fail} 个文件无法识别`);
    snack(bits.join('，'));
  }else{
    snack(fail?`${fail} 个文件无法识别，请检查表头（姓名/总分/科目）`:'导入失败');
  }
}
$('fileInput').onchange = e=>{ handleFiles(e.target.files); e.target.value=''; };
$('folderInput').onchange = e=>{ handleFiles(e.target.files,true); e.target.value=''; };

/* ---------- 考试 chips / tabs / 行点击（事件委托） ---------- */
$('examChips').addEventListener('click', e=>{
  const b = e.target.closest('.exam-chip'); if(!b) return;
  state.examId = b.dataset.exam===AGG ? AGG : b.dataset.exam;
  state.view='list';
  transitionRender();
});
$('tabBar').addEventListener('click', e=>{
  const b = e.target.closest('.tab-btn'); if(!b) return;
  state.metric = b.dataset.metric===TOTAL?TOTAL:b.dataset.metric;
  transitionRender();
});
function openStudent(name){
  state.student = name; state.view='detail'; state.detailMetric=TOTAL;
  window.scrollTo({top:0});
  render();
}
$('rankList').addEventListener('click', e=>{
  const row = e.target.closest('[data-student]'); if(!row) return;
  openStudent(row.dataset.student);
});
$('podium').addEventListener('click', e=>{
  const row = e.target.closest('[data-student]'); if(!row) return;
  openStudent(row.dataset.student);
});

/* ---------- 搜索 ---------- */
let searchTimer=null;
$('search').addEventListener('input', e=>{
  state.q = e.target.value.trim();
  clearTimeout(searchTimer);
  searchTimer = setTimeout(()=>{
    if(state.view!=='list') return;
    renderTabs(); renderList();
  }, 120);
});

/* ---------- 管理考试弹窗 ---------- */
function openManage(){
  const box = $('manageList');
  box.innerHTML = exams.map(ex=>`
    <div class="mg-row">
      <input value="${esc(ex.name)}" data-id="${ex.id}" aria-label="考试名称">
      <span class="mg-meta">${ex.students.length}人</span>
      <button class="mg-del rippable" data-del="${ex.id}" aria-label="删除">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M5 7h14M10 7V5h4v2m-7 0 .8 12h8.4L17 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>`).join('');
  box.querySelectorAll('input').forEach(inp=>{
    const commit = ()=>{
      const v = inp.value.trim();
      if(v && v!==exams.find(e=>e.id===inp.dataset.id)?.name){
        renameExam(inp.dataset.id, v); persistExams(); renderExamChips();
        snack('已重命名');
      }
    };
    inp.addEventListener('change', commit);
    inp.addEventListener('keydown', e=>{ if(e.key==='Enter') inp.blur(); });
  });
  box.querySelectorAll('[data-del]').forEach(b=>{
    b.onclick = ()=>{
      removeExam(b.dataset.del); persistExams();
      if(exams.length===0){ closeManage(); render(); }
      else { openManage(); transitionRender(); }
      snack('已删除该次考试');
    };
  });
  $('manageScrim').classList.add('on');
}
function closeManage(){ $('manageScrim').classList.remove('on'); }
$('btnManage').onclick = openManage;
$('mgClose').onclick = closeManage;
$('manageScrim').addEventListener('click', e=>{ if(e.target===$('manageScrim')) closeManage(); });

/* ---------- 本地持久化（仅 file:// 直接打开时保存导入的考试） ---------- */
function persistExams(){
  if(location.protocol!=='file:') return;
  try{
    localStorage.setItem(LS_KEY, JSON.stringify(exams.map(e=>({name:e.name, csv:e._csv}))));
  }catch(e){ /* 配额超限忽略 */ }
}
function loadPersisted(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if(!raw) return false;
    const arr = JSON.parse(raw);
    if(!Array.isArray(arr)||arr.length===0) return false;
    arr.forEach(x=>{ if(x&&x.csv) addExam(x.name, x.csv); });
    return exams.length>0;
  }catch(e){ return false; }
}

/* ---------- 视口变化 ---------- */
window.addEventListener('resize', ()=>{
  moveTabIndicator();
  activeCharts.forEach(c=>{ try{c.resize();}catch(e){} });
});
document.addEventListener('scroll', ()=>{
  const bar = $('tabBar');
  if(bar && bar.style.visibility!=='hidden') moveTabIndicator();
}, {passive:true});

/* ============================================================
   自动读取 list/ 目录（http 环境）
   先解析目录列表（python3 -m http.server 可用）；
   列表不可用时再尝试 list/manifest.json
   ============================================================ */
let AUTOLOAD_STATUS = '';
function loadByManifest(){
  return fetch('list/manifest.json',{cache:'no-store'})
    .then(r=>r.ok?r.json():Promise.reject())
    .then(m=>{
      const items = Array.isArray(m) ? m : (m.exams||[]);
      return items;
    });
}
async function autoload(){
  const loaded = [];
  /* 1) 目录列表解析（静态服务器生成的 index 页面） */
  let folders = [];
  try{
    const r = await fetch('list/',{cache:'no-store'});
    if(r.ok){
      const text = await r.text();
      const hrefs = [...text.matchAll(/href=["']([^"']+)["']/g)].map(m=>m[1]);
      folders = [...new Set(hrefs
        .map(h=>decodeURIComponent(h.split('?')[0]))
        .filter(h=>h.endsWith('/') && h!=='../' && !/^https?:/.test(h))
        .map(h=>h.slice(0,-1)))];
    }
  }catch(e){}
  for(const f of folders){
    try{
      const t = await fetch(`list/${f}/main.csv`).then(rr=>rr.ok?rr.text():Promise.reject());
      addExam(f,t); loaded.push(f);
    }catch(e){}
  }
  if(loaded.length) return {ok:true, loaded};
  /* 2) 列表不可用：尝试显式清单 {"exams":["2026-9-30"]} */
  try{
    const items = await loadByManifest();
    for(const it of items){
      const name = typeof it==='string' ? it : it.name;
      const path = typeof it==='string' ? `list/${name}/main.csv` : it.path;
      const t = await fetch(path).then(rr=>rr.ok?rr.text():Promise.reject());
      addExam(name,t); loaded.push(name);
    }
  }catch(e){}
  return loaded.length ? {ok:true,loaded}
    : {ok:false, reason:'未能自动读取 list/ 目录，请确认目录结构或直接使用导入'};
}

/* ---------- 初始化 ---------- */
async function init(){
  bindRipple();
  if(location.protocol==='file:'){
    AUTOLOAD_STATUS = '当前为直接打开（file 协议），浏览器禁止页面自动读取文件；可直接点按钮导入，导入结果保存在本机浏览器';
    loadPersisted();
  }else{
    const res = await autoload();
    if(!res.ok) AUTOLOAD_STATUS = res.reason;
  }
  state.examId = exams.length ? exams[exams.length-1].id : null;
  render();
  const stEl = document.getElementById('emptyStatus');
  if(stEl && AUTOLOAD_STATUS) stEl.textContent = AUTOLOAD_STATUS;
  if(exams.length && location.protocol!=='file:') snack(`已自动读取 list/ 下 ${exams.length} 次考试`);
}
init();

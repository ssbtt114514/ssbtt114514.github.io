/* charts.js */
/* ---------- 历史折线图 ---------- */
function renderHistoryChart(name, metric){
  const el = $('histChart'); if(!el || typeof echarts==='undefined') return;
  let chart = echarts.getInstanceByDom(el);
  if(!chart){ chart = echarts.init(el); activeCharts.push(chart); }
  const present = examsWithStudent(name);
  const xs = present.map(ex=>ex.name);
  const ys = present.map(ex=>{
    const st = ex.students.find(s=>s.name===name);
    if(metric===TOTAL) return fmt(st.total);
    if(metric===GR) return isNaN(st.gradeRank)?null:fmt(st.gradeRank,0);
    const v = st.scores[metric]?.v;
    return isNaN(v)?null:fmt(v);
  });
  const color = metric===TOTAL ? '#0d9488' : metric===GR ? '#475569' : SUBJECT_COLOR[metric];
  const title = metric===TOTAL?'总分':metric===GR?'年名':metric;
  chart.setOption({
    grid:{left:14,right:22,top:28,bottom:28,containLabel:true},
    title:{text:title+'走势',left:6,top:2,textStyle:{fontSize:13,fontWeight:700,color:'#3c5853'}},
    tooltip:{trigger:'axis',backgroundColor:'rgba(255,255,255,.92)',borderColor:'rgba(13,148,136,.25)',
      borderWidth:1,textStyle:{color:'#0e2b29',fontSize:12.5},
      extraCssText:'backdrop-filter:blur(10px);border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.14);'},
    xAxis:{type:'category',boundaryGap:false,data:xs,
      axisLine:{lineStyle:{color:'rgba(14,43,41,.22)'}},axisTick:{show:false},
      axisLabel:{color:'#5b7570',fontSize:11}},
    yAxis:{type:'value',scale:true,inverse:metric===GR,
      splitLine:{lineStyle:{color:'rgba(13,148,136,.10)'}},
      axisLabel:{color:'#5b7570',fontSize:11}},
    series:[{
      type:'line',data:ys,smooth:.42,symbol:'circle',symbolSize:8,
      lineStyle:{width:3.2,color},itemStyle:{color,borderColor:'#fff',borderWidth:2},
      areaStyle:{color:new echarts.graphic.LinearGradient(0,0,0,1,[
        {offset:0,color:color+'55'},{offset:1,color:color+'05'}])},
      emphasis:{focus:'series',scale:1.4},
      label:{show:true,position:'top',color:'#3c5853',fontSize:11,fontWeight:600,
        formatter:p=>p.value}
    }]
  }, true);
}

/* ---------- 雷达图（最近一次考试得分率） ---------- */
function renderRadarChart(name){
  const el = $('radarChart'); if(!el || typeof echarts==='undefined') return;
  const chart = echarts.init(el); activeCharts.push(chart);
  const present = examsWithStudent(name);
  const last = present[present.length-1];
  const st = last.students.find(s=>s.name===name);
  const indicator = last.subjects.map(s=>({name:s,max:100}));
  const values = last.subjects.map(s=>{
    const v = st.scores[s]?.v;
    const max = Math.max(...last.students.map(x=>x.scores[s]?.v).filter(x=>!isNaN(x)));
    return max? Math.round(v/max*100*10)/10 : 0;
  });
  chart.setOption({
    tooltip:{backgroundColor:'rgba(255,255,255,.92)',borderColor:'rgba(13,148,136,.25)',
      textStyle:{color:'#0e2b29',fontSize:12.5},
      extraCssText:'backdrop-filter:blur(10px);border-radius:12px;',
      formatter:()=>{
        return `<b>${esc(last.name)}</b><br>`+last.subjects.map((s,i)=>
          `${esc(s)}：相对最高 ${values[i]}%`).join('<br>');
      }},
    radar:{indicator,radius:'64%',center:['50%','54%'],splitNumber:4,
      axisName:{color:'#3c5853',fontSize:12,fontWeight:600},
      splitLine:{lineStyle:{color:'rgba(13,148,136,.18)'}},
      splitArea:{areaStyle:{color:['rgba(255,255,255,.25)','rgba(13,148,136,.06)']}},
      axisLine:{lineStyle:{color:'rgba(13,148,136,.18)'}}},
    series:[{type:'radar',
      data:[{value:values,name:'相对得分率',
        lineStyle:{color:'#0d9488',width:2.4},
        itemStyle:{color:'#0d9488',borderColor:'#fff',borderWidth:1.5},
        areaStyle:{color:new echarts.graphic.RadialGradient(0.5,0.5,1,[
          {offset:0,color:'rgba(94,234,212,.5)'},{offset:1,color:'rgba(13,148,136,.22)'}])}}]}]
  });
}

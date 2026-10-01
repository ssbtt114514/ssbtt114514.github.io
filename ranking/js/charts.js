/* ============================================================
   charts.js — ECharts 折线图 + 雷达图
   ============================================================ */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const fmtScore = n => n == null ? '—' : (Number.isInteger(n) ? String(n) : n.toFixed(1));

/* 统一动画配置：入场逐个生长 + 数据切换平滑过渡 */
const ANIM = {
  animation: true,
  animationDuration: 1100,
  animationEasing: 'cubicOut',
  animationDelay: idx => idx * 90,
  animationDurationUpdate: 650,
  animationEasingUpdate: 'cubicInOut',
  animationDelayUpdate: idx => idx * 50
};

/* ECharts 实例缓存 */
const _chartInstances = new Map();

function getChart(el){
  if (!el) return null;
  if (_chartInstances.has(el)) return _chartInstances.get(el);
  const c = echarts.init(el, null, { renderer: 'canvas' });
  // 初始化后立即校正尺寸，避免在元素刚创建/隐藏时拿到 0 宽高
  c.resize();
  _chartInstances.set(el, c);
  return c;
}

function resizeChart(el){
  const c = _chartInstances.get(el);
  if (c) c.resize();
}

function disposeChart(el){
  if (_chartInstances.has(el)) {
    _chartInstances.get(el).dispose();
    _chartInstances.delete(el);
  }
}

/* 销毁某个容器内的所有图表（抽屉重建前调用，防止实例指向已分离 DOM） */
function disposeChartsWithin(rootSel){
  const root = typeof rootSel === 'string' ? document.querySelector(rootSel) : rootSel;
  if (!root) return;
  for (const [el, c] of [..._chartInstances]) {
    if (root.contains(el)) { c.dispose(); _chartInstances.delete(el); }
  }
}

/* 窗口 resize 时重绘所有图表 */
let _resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(_resizeTimer);
  _resizeTimer = setTimeout(() => {
    _chartInstances.forEach(c => c.resize());
  }, 200);
});

/* ---------- 历史折线图 ---------- */
function renderHistoryChart(el, labels, values, color){
  const chart = getChart(el);
  if (!chart) return;
  chart.setOption({
    ...ANIM,
    grid: { left: 50, right: 24, top: 30, bottom: 62 },
    dataZoom: [
      { type: 'inside', start: 0, end: 100, zoomOnMouseWheel: true, moveOnMouseWheel: false, moveOnMouseMove: true },
      {
        type: 'slider', start: 0, end: 100, height: 18, bottom: 14,
        borderColor: 'transparent', backgroundColor: 'rgba(120,120,140,0.08)',
        fillerColor: 'rgba(14,116,144,0.18)', handleSize: '100%',
        handleStyle: { color: color, borderColor: '#fff' },
        moveHandleSize: 0, showDetail: false,
        dataBackground: { lineStyle: { color: color }, areaStyle: { color: color + '33' } },
        selectedDataBackground: { lineStyle: { color: color }, areaStyle: { color: color + '55' } }
      }
    ],
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(20,20,30,0.85)',
      borderColor: 'rgba(255,255,255,0.1)',
      textStyle: { color: '#fff', fontSize: 13 },
      formatter: p => `${p[0].axisValue}<br/>${p[0].marker} ${p[0].data ?? '—'}`
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: { lineStyle: { color: 'rgba(120,120,140,0.3)' } },
      axisLabel: { color: 'rgba(120,120,140,0.8)', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      scale: true,
      splitLine: { lineStyle: { color: 'rgba(120,120,140,0.12)' } },
      axisLabel: { color: 'rgba(120,120,140,0.8)', fontSize: 11 }
    },
    series: [{
      type: 'line',
      data: values,
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { color, width: 3 },
      itemStyle: { color, borderColor: '#fff', borderWidth: 2 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: color + '55' },
          { offset: 1, color: color + '00' }
        ])
      },
      label: {
        show: true,
        position: 'top',
        color: 'rgba(120,120,140,0.9)',
        fontSize: 11,
        formatter: p => p.data ?? ''
      }
    }]
  }, true);
}

/* ---------- 雷达图 ---------- */
function renderRadarChart(el, labels, values, color){
  const chart = getChart(el);
  if (!chart) return;
  chart.setOption({
    ...ANIM,
    radar: {
      indicator: labels.map(l => ({ name: l, max: 100 })),
      shape: 'polygon',
      radius: '65%',
      center: ['50%', '52%'],
      axisName: { color: 'rgba(120,120,140,0.9)', fontSize: 12 },
      splitLine: { lineStyle: { color: 'rgba(120,120,140,0.15)' } },
      splitArea: { areaStyle: { color: ['rgba(120,120,140,0.03)', 'rgba(120,120,140,0.06)'] } },
      axisLine: { lineStyle: { color: 'rgba(120,120,140,0.15)' } }
    },
    series: [{
      type: 'radar',
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { color, width: 2.5, join: 'round', cap: 'round' },
      itemStyle: { color, borderColor: '#fff', borderWidth: 1.5 },
      areaStyle: { color: color + '33' },
      data: [{ value: values, name: '成绩占比' }]
    }]
  }, true);
}

/* ---------- 科目成绩折线图（单次考试也可显示） ---------- */
function renderSubjectLineChart(el, labels, scores, ranks, colors){
  const chart = getChart(el);
  if (!chart) return;
  chart.setOption({
    ...ANIM,
    grid: { left: 50, right: 50, top: 40, bottom: 40 },
    dataZoom: [
      { type: 'inside', start: 0, end: 100, zoomOnMouseWheel: true, moveOnMouseWheel: false, moveOnMouseMove: true }
    ],
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(20,20,30,0.85)',
      borderColor: 'rgba(255,255,255,0.1)',
      textStyle: { color: '#fff', fontSize: 13 },
      formatter: ps => {
        const i = ps[0].dataIndex;
        return `${labels[i]}<br/>${ps[0].marker} 得分：${scores[i] ?? '—'}`
          + (ranks[i] != null ? `<br/>年名：${ranks[i]}` : '');
      }
    },
    legend: { show: false },
    xAxis: {
      type: 'category',
      data: labels,
      boundaryGap: false,
      axisLine: { lineStyle: { color: 'rgba(120,120,140,0.3)' } },
      axisLabel: { color: 'rgba(120,120,140,0.85)', fontSize: 12 }
    },
    yAxis: [
      {
        type: 'value',
        name: '得分',
        scale: true,
        splitLine: { lineStyle: { color: 'rgba(120,120,140,0.12)' } },
        axisLabel: { color: 'rgba(120,120,140,0.8)', fontSize: 11 },
        nameTextStyle: { color: 'rgba(120,120,140,0.8)' }
      }
    ],
    series: [{
      type: 'line',
      data: scores,
      smooth: true,
      symbol: 'circle',
      symbolSize: 9,
      lineStyle: { color: PRIMARY_HEX, width: 3 },
      itemStyle: {
        color: p => colors[p.dataIndex] || PRIMARY_HEX,
        borderColor: '#fff', borderWidth: 2
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: PRIMARY_HEX + '44' },
          { offset: 1, color: PRIMARY_HEX + '00' }
        ])
      },
      label: {
        show: true, position: 'top',
        color: 'rgba(120,120,140,0.9)', fontSize: 11,
        formatter: p => p.data ?? ''
      }
    }]
  }, true);
}

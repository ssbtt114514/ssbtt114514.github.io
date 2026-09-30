/* ============================================================
   charts.js — SVG 折线图 + 雷达图（零依赖）
   ============================================================ */

/* ---------- 工具 ---------- */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const uid = () => Math.random().toString(36).slice(2, 9);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const fmtScore = n => n == null ? '—' : (Number.isInteger(n) ? String(n) : n.toFixed(1));

/* ---------- 折线图 ---------- */
function lineSVG(labels, values, color){
  const w = 640, h = 250, p = 42, n = values.length, gid = 'g' + uid();
  if (!n) return '';
  const min = Math.min(...values), max = Math.max(...values);
  const span = (max - min) || Math.max(max * .2, 1);
  const lo = min - span * .18, hi = max + span * .18;
  const X = i => n === 1 ? w / 2 : p + (w - 2 * p) * i / (n - 1);
  const Y = v => h - p - (h - 2 * p) * (v - lo) / (hi - lo);

  let grid = '';
  for (let g = 0; g < 4; g++) {
    const gy = p + (h - 2 * p) * g / 3;
    grid += `<line x1="${p}" x2="${w-p}" y1="${gy.toFixed(1)}" y2="${gy.toFixed(1)}" class="gl"/>`
      + `<text x="${p-8}" y="${(gy+4).toFixed(1)}" class="gt" text-anchor="end">${fmtScore(hi-(hi-lo)*g/3)}</text>`;
  }
  const pts = values.map((v, i) => [X(i), Y(v)]);
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < n; i++) {
    const [x0, y0] = pts[i-1], [x1, y1] = pts[i];
    const [px, py] = pts[Math.max(0, i-2)], [nx, ny] = pts[Math.min(n-1, i+1)];
    d += ` C${(x0+(x1-px)/6).toFixed(1)},${(y0+(y1-py)/6).toFixed(1)} `
      + `${(x1-(nx-x0)/6).toFixed(1)},${(y1-(ny-y0)/6).toFixed(1)} `
      + `${x1.toFixed(1)},${y1.toFixed(1)}`;
  }
  const area = n > 1 ? `${d} L${pts[n-1][0].toFixed(1)},${h-p} L${pts[0][0].toFixed(1)},${h-p} Z` : '';
  const dots = pts.map(([x, y], i) =>
    `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5" class="pt" style="--d:${i*130}ms">`
    + `<title>${esc(labels[i])}：${fmtScore(values[i])}</title></circle>`
    + `<text x="${x.toFixed(1)}" y="${(y-13).toFixed(1)}" class="vt" text-anchor="middle">${fmtScore(values[i])}</text>`
  ).join('');
  const xls = labels.map((l, i) =>
    `<text x="${X(i).toFixed(1)}" y="${h-p+20}" class="xt" text-anchor="middle">${esc(l)}</text>`
  ).join('');

  return `<svg viewBox="0 0 ${w} ${h}" class="lchart" style="--lc:${color}">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${color}" stop-opacity=".32"/>
      <stop offset="1" stop-color="${color}" stop-opacity="0"/>
    </linearGradient></defs>
    ${grid}
    ${area ? `<path d="${area}" fill="url(#${gid})" class="area"/>` : ''}
    ${n > 1 ? `<path d="${d}" class="ln" pathLength="1"/>` : `<circle cx="${pts[0][0]}" cy="${pts[0][1]}" r="5" class="pt" style="--lc:${color};--d:0ms"/>`}
    ${dots}${xls}
  </svg>`;
}

/* ---------- 雷达图 ---------- */
function radarSVG(labels, vals, color){
  const S = 290, c = S / 2, R = 98, n = labels.length;
  const pt = (i, r) => {
    const a = -Math.PI / 2 + i * 2 * Math.PI / n;
    return [c + r * Math.cos(a), c + r * Math.sin(a)];
  };
  const ring = r => `<polygon points="${labels.map((_, i) => pt(i, R*r).map(v => v.toFixed(1)).join(',')).join(' ')}" class="rr"/>`;
  const axes = labels.map((_, i) => {
    const [x, y] = pt(i, R);
    return `<line x1="${c}" y1="${c}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="ra"/>`;
  }).join('');
  const lbl = labels.map((l, i) => {
    const [x, y] = pt(i, R + 20);
    return `<text x="${x.toFixed(1)}" y="${(y+4).toFixed(1)}" text-anchor="middle" class="rl">${esc(l)}</text>`;
  }).join('');
  const pts = vals.map((v, i) => pt(i, R * Math.max(.04, v)).map(x => x.toFixed(1)));
  const poly = pts.map(p => p.join(',')).join(' ');
  return `<svg viewBox="0 0 ${S} ${S}" class="rchart" style="--lc:${color}">
    ${ring(.25)}${ring(.5)}${ring(.75)}${ring(1)}${axes}
    <polygon points="${poly}" class="rp"/>
    <polyline points="${poly}" class="rl2" pathLength="1"/>
    ${pts.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="4" class="rd"/>`).join('')}
    ${lbl}
  </svg>`;
}

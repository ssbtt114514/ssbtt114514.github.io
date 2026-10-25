/*
 * gen-mind-data.js
 *
 * 从 mind/** 目录生成 StudyMap/js/mind-data.js（file:// 模式的内置 Markdown 副本）。
 *
 * 用法（在 StudyMap 目录下执行）：
 *   node tools/gen-mind-data.js
 *
 * 输出结构：
 *   window.STUDYMAP_EMBEDDED = {
 *     "mind/chinese/main.md": { "text": "...", "assets": { "mind/xxx/assets/yyy.svg": "data:..." } },
 *     ...
 *   };
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MIND_DIR = path.join(ROOT, 'mind');
const OUT = path.join(ROOT, 'js', 'mind-data.js');

// 与 StudyMap/js/mind.js 中 SUBJECTS 一致的学科顺序
const SUBJECT_ORDER = ['chinese', 'math', 'english', 'physics', 'chemistry', 'biology', 'politics', 'history', 'geography'];

function collectFiles(dir, base = '') {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, entry.name);
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...collectFiles(full, rel));
    else out.push(rel);
  }
  return out;
}

function mimeOf(file) {
  const ext = path.extname(file).toLowerCase();
  const map = {
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  };
  return map[ext] || null;
}

function build() {
  const embedded = {};
  const subjects = SUBJECT_ORDER.filter((id) => fs.existsSync(path.join(MIND_DIR, id, 'main.md')));

  for (const id of subjects) {
    const key = `mind/${id}/main.md`;
    const mdPath = path.join(MIND_DIR, id, 'main.md');
    const text = fs.readFileSync(mdPath, 'utf8');
    const entry = { text, assets: {} };

    const assetDir = path.join(MIND_DIR, id, 'assets');
    if (fs.existsSync(assetDir)) {
      for (const rel of collectFiles(assetDir)) {
        const file = path.join(assetDir, rel);
        const mime = mimeOf(rel);
        if (!mime) continue;
        const b64 = fs.readFileSync(file).toString('base64');
        entry.assets[`${key.replace(/main\.md$/, '')}assets/${rel}`] = `data:${mime};base64,${b64}`;
      }
    }
    embedded[key] = entry;
  }

  const header = '// 自动生成，请勿手改：由 gen-mind-data.js 从 mind/** 生成，用于 file:// 内置回退\n';
  const body = `window.STUDYMAP_EMBEDDED = ${JSON.stringify(embedded)};\n`;
  fs.writeFileSync(OUT, header + body, 'utf8');
  console.log(`已生成 ${OUT}（${subjects.length} 个学科）`);
}

build();

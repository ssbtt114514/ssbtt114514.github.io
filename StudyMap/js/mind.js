/*
 * StudyMap 主框架 v5
 * - HTTP/HTTPS：读取 mind/…/*.md，适合 GitHub Pages / Nginx / Apache
 * - file://：使用 js/mind-data.js 内置 Markdown，不再 fetch 本地文件
 * - 支持选择整个 mind 文件夹，直接读取本地 Markdown 与图片
 * - Markmap + KaTeX 数学公式
 * - 修复 markmap-view 低层 API 中 lineWidth 必须是函数的问题
 */
(() => {
  'use strict';

  const mm = window.markmap;
  const embedded = window.STUDYMAP_EMBEDDED || {};
  const $ = (id) => document.getElementById(id);

  const els = {
    list: $('subject-list'),
    count: $('subject-count'),
    subject: $('current-subject'),
    title: $('current-title'),
    description: $('current-description'),
    svg: $('mindmap'),
    loading: $('loading'),
    error: $('error'),
    status: $('status-text'),
    file: $('md-file'),
    folder: $('mind-folder'),
    fit: $('fit-btn'),
    reset: $('reset-btn'),
    expand: $('expand-btn'),
    collapse: $('collapse-btn'),
  };

  if (!mm?.Transformer || !mm?.Markmap) {
    showError('Markmap 未加载。请检查网络，或在静态部署时把 Markmap 第三方库放入 /other。');
    return;
  }

  const SUBJECTS = [
    { id: 'math', name: '数学', icon: '∑', file: 'mind/math/main.md', title: '高中数学', description: '公式、方法、题型与典型应用' },
    { id: 'biology', name: '生物', icon: '⌬', file: 'mind/biology/main.md', title: '高中生物', description: '分子、细胞与遗传等知识框架' },
    { id: 'english', name: '英语', icon: 'A', file: 'mind/english/main.md', title: '高中英语', description: '词汇、语法、阅读与写作框架' },
    { id: 'chinese', name: '语文', icon: '文', file: 'mind/chinese/main.md', title: '高中语文', description: '现代文、古诗文、语言文字运用' },
    { id: 'physics', name: '物理', icon: '↗', file: 'mind/physics/main.md', title: '高中物理', description: '力学、电学与物理模型' },
    { id: 'chemistry', name: '化学', icon: '⚗', file: 'mind/chemistry/main.md', title: '高中化学', description: '物质、反应、结构与实验' },
    { id: 'history', name: '历史', icon: '史', file: 'mind/history/main.md', title: '高中历史', description: '时间线、制度、事件与因果关系' },
    { id: 'geography', name: '地理', icon: '⌖', file: 'mind/geography/main.md', title: '高中地理', description: '自然地理、人文地理与区域分析' },
  ];

  const state = {
    subjects: SUBJECTS.slice(),
    current: SUBJECTS[0],
    markmap: null,
    root: null,
    transformer: new mm.Transformer(),
    assetKey: '',
    assetPromise: Promise.resolve(),
    localFiles: new Map(),
    localObjectUrls: new Set(),
  };

  function setLoading(show, text = '加载思维导图…') {
    els.loading.hidden = !show;
    if (show) els.loading.textContent = text;
  }

  function clearError() { els.error.hidden = true; }

  function showError(msg) {
    els.error.hidden = false;
    els.error.textContent = msg;
    setLoading(false);
    els.status.textContent = '加载失败';
  }

  function setStatus(text) {
    els.status.textContent = text;
  }

  function updateHeader(s) {
    els.subject.textContent = s.name;
    els.title.textContent = s.title;
    els.description.textContent = s.description;
  }

  function renderList() {
    els.count.textContent = String(state.subjects.length);
    els.list.innerHTML = state.subjects.map((s) => `
      <button class="subject-item ${s.id === state.current.id ? 'active' : ''}" data-id="${escapeHtml(s.id)}" type="button">
        <span class="subject-icon">${escapeHtml(s.icon)}</span>
        <span class="subject-name">${escapeHtml(s.name)}</span>
      </button>
    `).join('');

    els.list.querySelectorAll('.subject-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        const subject = state.subjects.find((s) => s.id === btn.dataset.id);
        if (subject) loadSubject(subject);
      });
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function pathKey(value) {
    return String(value || '').replaceAll('\\', '/').replace(/^\.\//, '').replace(/^\/+/,'');
  }

  function isAbsoluteUrl(value) {
    return /^(?:[a-z][a-z\d+.-]*:)?\/\//i.test(value) || /^(?:data|blob|file):/i.test(value);
  }

  function normalizeRelative(reference, baseFile) {
    if (!reference || isAbsoluteUrl(reference) || reference.startsWith('#')) return reference;
    const cleanBase = pathKey(baseFile);
    const baseDir = cleanBase.includes('/') ? cleanBase.slice(0, cleanBase.lastIndexOf('/')) : '';
    const parts = `${baseDir}/${reference}`.split('/');
    const output = [];
    for (const part of parts) {
      if (!part || part === '.') continue;
      if (part === '..') output.pop();
      else output.push(part);
    }
    return output.join('/');
  }

  /* 原始 markdown 引用 → 项目根相对 key（绝对/数据 URL 原样保留），只解析一次 */
  function toAssetKey(url, baseFile){
    if (!url || url.startsWith('#') || isAbsoluteUrl(url)) return url;
    return normalizeRelative(url, baseFile);
  }

  /* 根相对 key → http 模式下的绝对 URL（index.html 位于项目根，直接以其为基准） */
  function keyToHttpUrl(key){
    if (!key || isAbsoluteUrl(key)) return key;
    try {
      return new URL(key, location.href).href;
    } catch {
      return key;
    }
  }

  /* 本地文件 → blob URL（统一登记，便于切换时回收） */
  function blobFor(file){
    const url = URL.createObjectURL(file);
    state.localObjectUrls.add(url);
    return url;
  }

  function prepareMarkdownImages(markdown, baseFile, mode){
    // transform 阶段：http 模式用绝对 URL；embedded/local-folder 保留根相对 key，
    // 待解析完成后再替换为 data/blob，避免非 http 协议被清洗。
    const resolve = (raw) => {
      const key = toAssetKey(raw, baseFile);
      return mode === 'http' ? keyToHttpUrl(key) : key;
    };

    // Markdown: ![alt](url "title") / ![alt](<url>)
    let result = markdown.replace(/!\[([^\]]*)\]\(\s*(?:<([^>]+)>|([^\s)]+))(?:\s+(['"][^'"]*['"]))?\s*\)/g,
      (full, alt, angleUrl, normalUrl, title) => {
        const source = angleUrl || normalUrl;
        const replaced = resolve(source);
        return `![${alt}](${replaced}${title ? ` ${title}` : ''})`;
      });

    // HTML <img src="...">
    result = result.replace(/(<img\b[^>]*?\bsrc\s*=\s*["'])([^"']+)(["'][^>]*>)/gi,
      (full, prefix, url, suffix) => `${prefix}${resolve(url)}${suffix}`);

    return result;
  }

  function resolveEmbeddedAsset(key, fallbackBaseFile) {
    const normalized = pathKey(key);
    const entry = embedded[fallbackBaseFile];
    if (entry?.assets?.[normalized]) return entry.assets[normalized];
    for (const item of Object.values(embedded)) {
      if (item.assets?.[normalized]) return item.assets[normalized];
    }
    return normalized;
  }

  async function readMarkdown(subject) {
    const key = pathKey(subject.file);

    // 1) User-selected local folder files.
    const folderFile = state.localFiles.get(key);
    if (folderFile) {
      return { text: await folderFile.text(), base: key, mode: 'local-folder' };
    }

    // 2) file:// cannot fetch sibling files. Use the generated embedded fallback.
    if (location.protocol === 'file:') {
      const data = embedded[key];
      if (data) return { text: data.text, base: key, mode: 'embedded' };
      throw new Error(`本地内置数据不存在：${key}`);
    }

    // 3) Static server / GitHub Pages / Nginx.
    const response = await fetch(key, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}：${key}`);
    return { text: await response.text(), base: key, mode: 'http' };
  }

  function replaceHtmlImageSources(root, baseFile, mode) {
    if (!root) return;

    // 此时 src 对 http 模式已是绝对 URL（保留）；embedded/local 为根相对 key。
    const getReplacement = (src) => {
      if (!src || isAbsoluteUrl(src)) return src;
      const key = pathKey(src);
      if (mode === 'embedded') return resolveEmbeddedAsset(key, baseFile);
      if (mode === 'local-folder') {
        const file = state.localFiles.get(key);
        return file ? blobFor(file) : src;
      }
      return keyToHttpUrl(key);
    };

    walkTree(root, (node) => {
      if (typeof node.content !== 'string' || !node.content.includes('<img')) return;
      node.content = node.content.replace(
        /(<img\b[^>]*?\bsrc\s*=\s*["'])([^"']+)(["'][^>]*>)/gi,
        (full, prefix, src, suffix) => `${prefix}${getReplacement(src)}${suffix}`,
      );
    });
  }

  /* 为学科内链 <a href="subject:..."> 增加 internal-link 类（用于 ⇢ 标识） */
  function tagInternalLinks(root){
    if (!root) return;
    walkTree(root, (node) => {
      if (typeof node.content !== 'string' || !node.content.includes('subject:')) return;
      node.content = node.content.replace(
        /<a\b(?![^>]*\bclass=)([^>]*?)\bhref=["']subject:([^"']+)["']([^>]*)>/gi,
        (full, before, id, after) => `<a${before} href="subject:${id}" class="internal-link"${after}>`
      );
    });
  }


  function rewriteRenderedImages(baseFile, mode) {
    const images = [...els.svg.querySelectorAll('foreignObject img')];
    if (!images.length) return;

    for (const img of images) {
      const source = img.getAttribute('src') || '';
      if (!source || isAbsoluteUrl(source)) continue;

      // source 为根相对 key，直接按模式解析，不再与 base 目录二次拼接。
      const key = pathKey(source);
      if (mode === 'embedded') {
        const replacement = resolveEmbeddedAsset(key, baseFile);
        if (replacement && replacement !== key) img.setAttribute('src', replacement);
      } else if (mode === 'local-folder') {
        const file = state.localFiles.get(key);
        if (file) img.setAttribute('src', blobFor(file));
      } else {
        img.setAttribute('src', keyToHttpUrl(key));
      }
    }
  }

  async function waitForImages() {
    const images = [...els.svg.querySelectorAll('foreignObject img')];
    if (!images.length) return;

    await Promise.all(images.map((img) => new Promise((resolve) => {
      if (img.complete) { resolve(); return; }
      const done = () => {
        img.removeEventListener('load', done);
        img.removeEventListener('error', done);
        resolve();
      };
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
    })));

    // SVG images can finish loading after the first foreignObject measurement.
    // Ask Markmap to recalculate once media has a real intrinsic size.
    try {
      await state.markmap?.renderData(state.root);
    } catch {
      // A failed image must not break the whole mindmap.
    }
  }

  async function ensureAssets(features) {
    if (!mm.loadCSS || !mm.loadJS) return;
    const assets = state.transformer.getUsedAssets(features || {});
    const styles = assets?.styles || [];
    const scripts = [...(assets?.preloadScripts || []), ...(assets?.scripts || [])];
    const key = JSON.stringify({ styles, scripts });
    if (!key || key === state.assetKey) return state.assetPromise;

    state.assetKey = key;
    state.assetPromise = (async () => {
      if (styles.length) await mm.loadCSS(styles);
      if (scripts.length) {
        await mm.loadJS(scripts, { getMarkmap: () => mm });
      }
    })();
    return state.assetPromise;
  }

  async function renderMarkdown(markdown, baseFile, mode) {
    els.svg.replaceChildren();

    const prepared = prepareMarkdownImages(markdown, baseFile, mode);

    const { root, features } = state.transformer.transform(prepared);

    // Rewrite image src after Markdown parsing. This is the key fix for SVGs:
    // data/blob/file schemes are avoided during parsing, where they may be
    // rejected, and are only inserted into the final HTML node content.
    replaceHtmlImageSources(root, baseFile, mode);
    tagInternalLinks(root);
    state.root = root;

    await ensureAssets(features);

    // IMPORTANT: low-level markmap-view expects lineWidth(node) -> number.
    // Passing `lineWidth: 2` causes "lineWidth is not a function" in v0.18.x.
    state.markmap?.destroy?.();
    state.markmap = mm.Markmap.create(els.svg, {
      autoFit: true,
      duration: 420,
      initialExpandLevel: 3,
      zoom: true,
      pan: true,
      toggleRecursively: true,
      maxWidth: 360,
      spacingVertical: 18,
      spacingHorizontal: 84,
      paddingX: 14,
      lineWidth: () => 2,
      embedGlobalCSS: true,
    }, root);

    // Markmap/Markdown may preserve a relative image URL in the final
    // foreignObject instead of the node object. In file:// mode that URL
    // resolves against index.html and produces ERR_FILE_NOT_FOUND. Rewrite
    // the actual rendered DOM as a final safety net.
    rewriteRenderedImages(baseFile, mode);
    await waitForImages();
    requestAnimationFrame(() => requestAnimationFrame(() => state.markmap?.fit()));
    setLoading(false);
  }

  async function loadSubject(subject) {
    state.current = subject;
    updateHeader(subject);
    renderList();
    clearError();
    setLoading(true, `正在加载「${subject.name}」…`);

    try {
      const result = await readMarkdown(subject);
      await renderMarkdown(result.text, result.base, result.mode);
      const label = result.mode === 'http' ? '静态服务器' : result.mode === 'embedded' ? '本地内置' : '本地目录';
      setStatus(`已加载 · ${subject.name} · ${label}`);
    } catch (err) {
      showError(`无法加载 ${subject.file}\n\n${err?.message || err}`);
    }
  }

  function fit() { state.markmap?.fit(); }

  async function reset() {
    if (!state.markmap || !state.root) return;
    // setData() 重新初始化树，同时会重新应用 initialExpandLevel。
    // 这里的“重置”就是恢复 Markdown 的初始折叠状态。
    await state.markmap.setData(state.root);
    requestAnimationFrame(() => state.markmap?.fit());
  }

  function walkTree(node, fn) {
    fn(node);
    // Markmap 0.18.x 不再把 children 挪到 _children，折叠状态由
    // node.payload.fold 控制：1 = 当前节点折叠，2 = 连同整棵子树递归折叠。
    for (const child of node.children || []) walkTree(child, fn);
  }

  async function setExpanded(expanded) {
    if (!state.root || !state.markmap) return;

    // 不要调用 setData()：它会再次执行 _initializeData()，从而按照
    // initialExpandLevel 重新折叠节点，这正是之前“展开后恢复初始状态”的原因。
    // 直接修改 INode.payload.fold，再让 Markmap 重新布局即可。
    walkTree(state.root, (node) => {
      node.payload = {
        ...node.payload,
        // 展开全部：所有节点均显示子节点。
        // 折叠全部：根节点保持展开，只折叠根以下的所有节点。
        fold: expanded || node === state.root ? 0 : 1,
      };
    });

    // renderData() 是 Markmap 0.18.x 的正确更新入口，会保留当前 INode
    // 和折叠状态；同时它是 async，等待完成后再 fit，避免布局尚未完成就缩放。
    await state.markmap.renderData(state.root);
    requestAnimationFrame(() => state.markmap?.fit());
  }

  /* 解析"学科内链"，返回目标学科 id；非内链返回 null。
     支持：subject:biology、?subject=biology、#/subject/biology */
  function parseInternalSubject(href){
    if (!href) return null;
    let m = href.match(/^subject:([a-z0-9_-]+)/i);
    if (m) return m[1];
    try {
      const u = new URL(href, location.href);
      const qs = u.searchParams.get('subject');
      if (qs) return qs;
      m = u.hash.match(/subject\/([a-z0-9_-]+)/i);
      if (m) return m[1];
    } catch { /* 相对协议外链接忽略 */ }
    return null;
  }

  /* 链接跳转：事件委托（捕获阶段），点击 <a> 时导航且不触发节点折叠。 */
  function bindLinkNavigation(){
    els.svg.addEventListener('click', (event) => {
      const anchor = event.target.closest?.('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href') || anchor.getAttribute('xlink:href') || '';

      // 学科内链 → 切换学科
      const targetId = parseInternalSubject(href);
      if (targetId) {
        event.preventDefault();
        event.stopPropagation();
        const subject = state.subjects.find((s) => s.id === targetId);
        if (subject) {
          loadSubject(subject);
          setStatus(`已跳转到 · ${subject.name}`);
        }
        return;
      }

      // 外部链接：新开标签页，并阻止节点折叠
      if (isAbsoluteUrl(href)) {
        event.stopPropagation();
        anchor.setAttribute('target', '_blank');
        anchor.setAttribute('rel', 'noopener noreferrer');
      }
    }, true);
  }

  els.fit.addEventListener('click', fit);
  els.reset.addEventListener('click', reset);
  els.expand.addEventListener('click', () => setExpanded(true));
  els.collapse.addEventListener('click', () => setExpanded(false));

  // 单个 Markdown 文件导入。
  els.file.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const subject = {
      id: 'imported', name: '本地文件', icon: '↥', file: file.name,
      title: file.name.replace(/\.(md|markdown)$/i, ''), description: '临时导入的 Markdown'
    };
    try {
      state.current = subject;
      updateHeader(subject);
      clearError();
      setLoading(true, `正在导入「${file.name}」…`);
      await renderMarkdown(await file.text(), file.name, 'local-folder');
      setStatus(`已导入 · ${file.name}`);
    } catch (err) {
      showError(`Markdown 导入失败：${err?.message || err}`);
    } finally {
      event.target.value = '';
    }
  });

  // 选择项目根目录或 mind 目录，读取实际 Markdown + 图片。
  els.folder.addEventListener('change', async (event) => {
    const files = [...(event.target.files || [])];
    if (!files.length) return;

    for (const url of state.localObjectUrls) URL.revokeObjectURL(url);
    state.localObjectUrls.clear();
    state.localFiles.clear();

    for (const file of files) {
      const path = pathKey(file.webkitRelativePath || file.name);
      const marker = '/mind/';
      const idx = path.indexOf(marker);
      const key = idx >= 0 ? path.slice(idx + 1) : path.startsWith('mind/') ? path : `mind/${path}`;
      state.localFiles.set(key, file);
    }

    const mains = [...state.localFiles.entries()]
      .filter(([key]) => /(?:^|\/)main\.(md|markdown)$/i.test(key));

    if (!mains.length) {
      showError('没有找到 mind/**/main.md。请选择项目根目录或 mind 目录。');
      return;
    }

    state.subjects = mains.map(([key]) => {
      const parts = key.split('/');
      const folderName = parts.length >= 3 ? parts[1] : parts[0].replace(/\.(md|markdown)$/i, '');
      const fallback = SUBJECTS.find((s) => s.id === folderName);
      return fallback ? { ...fallback, file: key } : {
        id: folderName,
        name: folderName,
        icon: '•',
        file: key,
        title: folderName,
        description: '本地 Markdown 思维导图'
      };
    });

    state.current = state.subjects[0];
    renderList();
    await loadSubject(state.current);
    setStatus(`已载入本地目录 · ${state.subjects.length} 个思维导图`);
    event.target.value = '';
  });

  renderList();
  updateHeader(state.current);
  bindLinkNavigation();
  loadSubject(state.current);
})();

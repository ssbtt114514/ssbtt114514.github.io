/* =========================================================
   main.js — application shell / navigation / motion
   ========================================================= */
const PAGE_MODULES = [
    { id: 'profile', name: '主页', icon: 'fas fa-user-astronaut', module: window.ProfileModule },
    { id: 'skills', name: '技能', icon: 'fas fa-laptop-code', module: window.SkillsModule },
    { id: 'games', name: '游戏', icon: 'fas fa-gamepad', module: window.GamesModule },
    { id: 'identity', name: '身份', icon: 'fas fa-id-card', module: window.IdentityModule },
    { id: 'experience', name: '经历', icon: 'fas fa-history', module: window.ExperienceModule },
    { id: 'github', name: '仓库', icon: 'fab fa-github', module: window.GitHubModule },
    { id: 'bilibili', name: '项目', icon: 'fas fa-code-branch', module: window.BilibiliModule },
    { id: 'contact', name: '联系', icon: 'fas fa-address-card', module: window.ContactModule }
];

let currentPageId = 'profile';
let isAnimating = false;
let loadingOverlay = null;
const initializedModules = new Set();

function showLoading(msg = '正在准备页面') {
    if (!loadingOverlay) loadingOverlay = document.getElementById('loading-overlay');
    if (!loadingOverlay) return;
    const detail = loadingOverlay.querySelector('#loading-detail');
    if (detail) detail.textContent = msg;
    loadingOverlay.classList.add('visible');
    loadingOverlay.setAttribute('aria-hidden', 'false');
}

function hideLoading() {
    if (!loadingOverlay) loadingOverlay = document.getElementById('loading-overlay');
    if (!loadingOverlay) return;
    loadingOverlay.classList.remove('visible');
    loadingOverlay.setAttribute('aria-hidden', 'true');
}

function buildTabs() {
    const tabsContainer = document.getElementById('pageTabs');
    if (!tabsContainer) return;
    tabsContainer.innerHTML = '';
    tabsContainer.setAttribute('role', 'tablist');
    tabsContainer.setAttribute('aria-label', '页面导航');

    PAGE_MODULES.forEach((page, index) => {
        const btn = document.createElement('button');
        btn.className = 'tab-btn';
        btn.type = 'button';
        btn.dataset.page = page.id;
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-selected', page.id === currentPageId ? 'true' : 'false');
        btn.setAttribute('aria-controls', `${page.id}Page`);
        btn.tabIndex = page.id === currentPageId ? 0 : -1;
        if (page.id === currentPageId) btn.classList.add('active');
        btn.innerHTML = `<i class="${page.icon}" aria-hidden="true"></i><span>${page.name}</span>`;
        btn.addEventListener('click', () => switchPage(page.id));
        btn.addEventListener('keydown', (event) => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            let next = index;
            if (event.key === 'ArrowRight') next = (index + 1) % PAGE_MODULES.length;
            if (event.key === 'ArrowLeft') next = (index - 1 + PAGE_MODULES.length) % PAGE_MODULES.length;
            if (event.key === 'Home') next = 0;
            if (event.key === 'End') next = PAGE_MODULES.length - 1;
            const nextBtn = tabsContainer.querySelector(`[data-page="${PAGE_MODULES[next].id}"]`);
            nextBtn?.focus();
            switchPage(PAGE_MODULES[next].id);
        });
        tabsContainer.appendChild(btn);
    });
}

function prepareReveal(pageEl) {
    if (!pageEl) return;
    const children = [...pageEl.querySelectorAll('.glass-card, .repo-tile, .video-card, .featured-project-card')].slice(0, 36);
    children.forEach((el, index) => {
        el.classList.add('motion-pending');
        el.style.transitionDelay = `${Math.min(index * 24, 260)}ms`;
    });
    requestAnimationFrame(() => {
        children.forEach(el => el.classList.add('motion-ready'));
        window.setTimeout(() => children.forEach(el => el.style.transitionDelay = ''), 650);
    });
}

function initModule(page, silent = false) {
    if (!page?.module || typeof page.module.init !== 'function') return;
    if (initializedModules.has(page.id)) return;
    if (!silent) showLoading(`正在加载 ${page.name}…`);
    try {
        page.module.init(`${page.id}Page`);
        initializedModules.add(page.id);
        prepareReveal(document.getElementById(`${page.id}Page`));
    } catch (error) {
        console.error(`模块 ${page.id} 初始化失败`, error);
        const pageDiv = document.getElementById(`${page.id}Page`);
        if (pageDiv) pageDiv.innerHTML = `<div class="glass-card" style="text-align:center"><strong>模块加载失败</strong><p class="muted">${escapeHTML(error?.message || String(error))}</p></div>`;
    } finally {
        if (!silent) hideLoading();
    }
}

function buildPages() {
    const pagesContainer = document.getElementById('pagesContainer');
    if (!pagesContainer) return;
    pagesContainer.innerHTML = '';

    const cubeStage = document.createElement('div');
    cubeStage.className = 'cube-stage';
    cubeStage.id = 'cubeStage';
    pagesContainer.appendChild(cubeStage);

    PAGE_MODULES.forEach(page => {
        const pageDiv = document.createElement('section');
        pageDiv.id = `${page.id}Page`;
        pageDiv.className = 'page';
        pageDiv.setAttribute('role', 'tabpanel');
        pageDiv.setAttribute('aria-label', page.name);
        pageDiv.hidden = page.id !== currentPageId;
        if (page.id === currentPageId) pageDiv.classList.add('active-page');
        cubeStage.appendChild(pageDiv);
    });

    const first = PAGE_MODULES.find(page => page.id === currentPageId);
    if (first) initModule(first);

    const rest = PAGE_MODULES.filter(page => page.id !== currentPageId);
    const idle = window.requestIdleCallback || (cb => window.setTimeout(cb, 120));
    idle(() => rest.forEach(page => initModule(page, true)));
}

function getPageIndex(pageId) { return PAGE_MODULES.findIndex(page => page.id === pageId); }

function updateTabs(pageId) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        const selected = btn.dataset.page === pageId;
        btn.classList.toggle('active', selected);
        btn.setAttribute('aria-selected', selected ? 'true' : 'false');
        btn.tabIndex = selected ? 0 : -1;
    });
}

function switchPage(pageId) {
    if (pageId === currentPageId || isAnimating) return;
    const oldIndex = getPageIndex(currentPageId);
    const newIndex = getPageIndex(pageId);
    if (newIndex < 0) return;

    const target = PAGE_MODULES[newIndex];
    initModule(target, true);

    const oldPage = document.getElementById(`${currentPageId}Page`);
    const newPage = document.getElementById(`${pageId}Page`);
    const cubeStage = document.getElementById('cubeStage');
    if (!newPage) return;

    const direction = newIndex > oldIndex ? 'right' : 'left';
    isAnimating = true;
    updateTabs(pageId);

    if (oldPage && cubeStage) {
        const height = oldPage.offsetHeight;
        if (height) cubeStage.style.minHeight = `${height}px`;
        oldPage.classList.remove('active-page');
        oldPage.hidden = false;
        oldPage.classList.add(direction === 'right' ? 'cube-out-right' : 'cube-out-left');
    }

    newPage.hidden = false;
    newPage.style.opacity = '0';
    newPage.style.pointerEvents = 'none';
    newPage.classList.add(direction === 'right' ? 'cube-in-right' : 'cube-in-left');

    window.setTimeout(() => {
        oldPage?.classList.remove('cube-out-right', 'cube-out-left');
        if (oldPage) {
            oldPage.style.opacity = '';
            oldPage.style.pointerEvents = '';
            oldPage.hidden = true;
        }
        newPage.classList.remove('cube-in-right', 'cube-in-left');
        newPage.classList.add('active-page');
        newPage.style.opacity = '';
        newPage.style.pointerEvents = '';
        newPage.hidden = false;
        cubeStage?.style.removeProperty('min-height');
        currentPageId = pageId;
        isAnimating = false;
        prepareReveal(newPage);
        window.dispatchEvent(new CustomEvent('pagechange', { detail: { pageId } }));
    }, 510);
}

function initTheme() {
    const themeBtn = document.getElementById('globalThemeSwitch');
    if (!themeBtn) return;
    const apply = (dark) => {
        document.body.classList.toggle('dark', dark);
        localStorage.setItem('theme', dark ? 'dark' : 'light');
        themeBtn.innerHTML = dark ? '<i class="fas fa-sun" aria-hidden="true"></i>' : '<i class="fas fa-moon" aria-hidden="true"></i>';
        themeBtn.setAttribute('aria-label', dark ? '切换浅色模式' : '切换深色模式');
        if (window.ColorThemeModule?.reapply) window.ColorThemeModule.reapply();
        if (window.GitHubModule?.refreshTheme) window.GitHubModule.refreshTheme();
    };
    apply(localStorage.getItem('theme') === 'dark');
    themeBtn.addEventListener('click', () => apply(!document.body.classList.contains('dark')));
}

function initColorTheme() {
    if (!window.ColorThemeModule || !window.APP_CONFIG) return;
    const avatarUrl = `https://q.qlogo.cn/headimg_dl?dst_uin=${APP_CONFIG.QQ_NUMBER}&spec=140&t=${Date.now()}`;
    window.ColorThemeModule.initFromAvatar(avatarUrl).catch(() => console.info('[ColorTheme] 使用默认动态色'));
}

function initLiquidGlassHover() {
    const container = document.getElementById('pagesContainer');
    if (!container || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    let rafId = 0;
    let activeEl = null;
    let pendingX = 0;
    let pendingY = 0;

    container.addEventListener('pointerover', event => {
        const card = event.target.closest('.glass-card, .featured-project-card');
        if (!card || !container.contains(card)) return;
        activeEl = card;
        let highlight = card.querySelector(':scope > .lg-hover-highlight');
        if (!highlight) {
            highlight = document.createElement('div');
            highlight.className = 'lg-hover-highlight';
            card.appendChild(highlight);
        }
    });

    container.addEventListener('pointermove', event => {
        if (!activeEl) return;
        const rect = activeEl.getBoundingClientRect();
        pendingX = event.clientX - rect.left;
        pendingY = event.clientY - rect.top;
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
            if (activeEl) {
                activeEl.style.setProperty('--lg-x', `${pendingX}px`);
                activeEl.style.setProperty('--lg-y', `${pendingY}px`);
                const highlight = activeEl.querySelector(':scope > .lg-hover-highlight');
                highlight?.style.setProperty('transform', `translate3d(${pendingX}px,${pendingY}px,0) translate(-50%,-50%)`);
            }
            rafId = 0;
        });
    }, { passive: true });

    container.addEventListener('pointerout', event => {
        if (activeEl && !activeEl.contains(event.relatedTarget)) activeEl = null;
    });
}

function initPointerAtmosphere() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    let rafId = 0;
    let x = 50;
    let y = 35;
    window.addEventListener('pointermove', event => {
        x = (event.clientX / window.innerWidth) * 100;
        y = (event.clientY / window.innerHeight) * 100;
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
            document.documentElement.style.setProperty('--pointer-x', `${x}%`);
            document.documentElement.style.setProperty('--pointer-y', `${y}%`);
            rafId = 0;
        });
    }, { passive: true });
}

function initRipples() {
    document.addEventListener('pointerdown', event => {
        const target = event.target.closest('.tab-btn, .contact-btn, .filter-chip, .theme-toggle, .skill-badge, .game-bubble, .video-modal-btn, .avatar-circle-big');
        if (!target || target.disabled) return;
        const rect = target.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'md-ripple';
        ripple.style.left = `${event.clientX - rect.left}px`;
        ripple.style.top = `${event.clientY - rect.top}px`;
        target.appendChild(ripple);
        window.setTimeout(() => ripple.remove(), 540);
    });
}

function escapeHTML(value) {
    const div = document.createElement('div');
    div.textContent = value;
    return div.innerHTML;
}

window.addEventListener('load', () => {
    window.setTimeout(hideLoading, 250);
});

document.addEventListener('DOMContentLoaded', () => {
    loadingOverlay = document.getElementById('loading-overlay');
    buildTabs();
    buildPages();
    initTheme();
    initLiquidGlassHover();
    initPointerAtmosphere();
    initRipples();
    initColorTheme();
});

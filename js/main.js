// 页面定义列表 (顺序决定tab显示顺序)
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

function showLoading(msg = '初始化模块') {
    if (!loadingOverlay) loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        const detailSpan = loadingOverlay.querySelector('#loading-detail');
        if (detailSpan) detailSpan.textContent = msg;
        loadingOverlay.style.display = 'flex';
    }
}

function hideLoading() {
    if (loadingOverlay) loadingOverlay.style.display = 'none';
}

function buildTabs() {
    const tabsContainer = document.getElementById('pageTabs');
    if (!tabsContainer) {
        console.error('找不到 #pageTabs 容器');
        return;
    }
    tabsContainer.innerHTML = '';
    PAGE_MODULES.forEach(page => {
        const btn = document.createElement('button');
        btn.className = 'tab-btn';
        if (page.id === currentPageId) btn.classList.add('active');
        btn.setAttribute('data-page', page.id);
        btn.innerHTML = `<i class="${page.icon}"></i><span> ${page.name}</span>`;
        btn.addEventListener('click', () => switchPage(page.id));
        tabsContainer.appendChild(btn);
    });
    console.log('✅ 标签页构建完成');
}

function buildPages() {
    const pagesContainer = document.getElementById('pagesContainer');
    if (!pagesContainer) {
        console.error('找不到 #pagesContainer 容器');
        return;
    }
    pagesContainer.innerHTML = '';

    // Create cube stage
    const cubeStage = document.createElement('div');
    cubeStage.className = 'cube-stage';
    cubeStage.id = 'cubeStage';
    pagesContainer.appendChild(cubeStage);

    PAGE_MODULES.forEach(page => {
        const pageDiv = document.createElement('div');
        pageDiv.id = `${page.id}Page`;
        pageDiv.className = 'page';
        if (page.id === currentPageId) pageDiv.classList.add('active-page');
        cubeStage.appendChild(pageDiv);
    });
    console.log('📄 页面容器创建完成，开始初始化各模块...');

    PAGE_MODULES.forEach(page => {
        showLoading(`正在加载 ${page.name} 模块...`);
        if (page.module && typeof page.module.init === 'function') {
            try {
                page.module.init(`${page.id}Page`);
                console.log(`✅ 模块 ${page.id} 初始化成功`);
            } catch (err) {
                console.error(`❌ 模块 ${page.id} 初始化失败:`, err);
                const pageDiv = document.getElementById(`${page.id}Page`);
                if (pageDiv) {
                    pageDiv.innerHTML = `<div class="glass-card" style="color:red; text-align:center;">模块加载失败，请检查控制台<br>${err.message}</div>`;
                }
            }
        } else {
            console.warn(`⚠️ 模块 ${page.id} 未定义或缺少 init 方法`);
            const pageDiv = document.getElementById(`${page.id}Page`);
            if (pageDiv) {
                pageDiv.innerHTML = `<div class="glass-card" style="text-align:center;">模块未就绪，请刷新页面</div>`;
            }
        }
    });
    hideLoading();
}

function getPageIndex(pageId) {
    return PAGE_MODULES.findIndex(p => p.id === pageId);
}

function switchPage(pageId) {
    if (pageId === currentPageId || isAnimating) return;
    isAnimating = true;

    const oldIndex = getPageIndex(currentPageId);
    const newIndex = getPageIndex(pageId);
    const direction = newIndex > oldIndex ? 'right' : 'left';

    const oldPage = document.getElementById(`${currentPageId}Page`);
    const newPage = document.getElementById(`${pageId}Page`);
    const cubeStage = document.getElementById('cubeStage');

    // Lock container height during animation to prevent layout shift
    if (oldPage && cubeStage) {
        const oldHeight = oldPage.offsetHeight;
        if (oldHeight > 0) cubeStage.style.minHeight = oldHeight + 'px';
    }

    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.getAttribute('data-page') === pageId) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    // Cube out animation for old page
    if (oldPage) {
        oldPage.classList.remove('active-page');
        oldPage.classList.add(direction === 'right' ? 'cube-out-right' : 'cube-out-left');
    }

    // Prepare and cube in new page
    if (newPage) {
        // Make new page visible for animation
        newPage.style.opacity = '0';
        newPage.style.pointerEvents = 'none';
        newPage.classList.add(direction === 'right' ? 'cube-in-right' : 'cube-in-left');

        // After animation completes
        setTimeout(() => {
            if (oldPage) {
                oldPage.classList.remove('cube-out-right', 'cube-out-left');
                oldPage.style.opacity = '';
                oldPage.style.pointerEvents = '';
            }
            if (newPage) {
                newPage.classList.remove('cube-in-right', 'cube-in-left');
                newPage.classList.add('active-page');
                newPage.style.opacity = '';
                newPage.style.pointerEvents = '';
            }
            if (cubeStage) cubeStage.style.minHeight = '';
            currentPageId = pageId;
            isAnimating = false;
        }, 600);
    } else {
        if (cubeStage) cubeStage.style.minHeight = '';
        currentPageId = pageId;
        isAnimating = false;
    }
}

function initTheme() {
    const themeBtn = document.getElementById('globalThemeSwitch');
    if (!themeBtn) return;
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark');
        themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        themeBtn.innerHTML = '<i class="fas fa-moon"></i>';
    }
    themeBtn.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        themeBtn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        // 重新应用莫奈取色（暗色模式下颜色会加深）
        if (window.ColorThemeModule) window.ColorThemeModule.reapply();
        if (window.GitHubModule && window.GitHubModule.refreshTheme) {
            window.GitHubModule.refreshTheme();
        }
    });
}

/**
 * 头像莫奈动态取色
 * 页面加载时从头像提取主色调，应用到背景和强调色
 */
function initColorTheme() {
    if (!window.ColorThemeModule || !window.APP_CONFIG) return;
    const avatarUrl = `https://q.qlogo.cn/headimg_dl?dst_uin=${APP_CONFIG.QQ_NUMBER}&spec=140&t=${Date.now()}`;
    // 异步执行，不阻塞页面渲染
    window.ColorThemeModule.initFromAvatar(avatarUrl).catch(() => {
        console.log('[ColorTheme] 使用默认配色');
    });
}

/**
 * 液态玻璃鼠标跟随高光
 * 使用事件委托 + rAF 节流，仅在卡片内移动时更新
 */
function initLiquidGlassHover() {
    const container = document.getElementById('pagesContainer');
    if (!container) return;

    let rafId = null;
    let pendingX = 0, pendingY = 0;
    let activeEl = null;

    container.addEventListener('mouseover', (e) => {
        const card = e.target.closest('.glass-card, .featured-project-card');
        if (!card || activeEl === card) return;
        activeEl = card;
        if (!card.querySelector('.lg-hover-highlight')) {
            const hl = document.createElement('div');
            hl.className = 'lg-hover-highlight';
            card.appendChild(hl);
        }
    });

    container.addEventListener('mousemove', (e) => {
        if (!activeEl) return;
        const rect = activeEl.getBoundingClientRect();
        pendingX = e.clientX - rect.left;
        pendingY = e.clientY - rect.top;
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
            const hl = activeEl.querySelector('.lg-hover-highlight');
            if (hl) hl.style.transform = `translate(${pendingX}px, ${pendingY}px) translate(-50%, -50%)`;
            rafId = null;
        });
    });

    container.addEventListener('mouseout', (e) => {
        if (activeEl && !activeEl.contains(e.relatedTarget)) {
            activeEl = null;
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM 加载完成，开始构建页面...');
    loadingOverlay = document.getElementById('loading-overlay');
    buildTabs();
    buildPages();
    initTheme();
    initLiquidGlassHover();
    initColorTheme();
});

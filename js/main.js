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
    PAGE_MODULES.forEach(page => {
        const pageDiv = document.createElement('div');
        pageDiv.id = `${page.id}Page`;
        pageDiv.className = 'page';
        if (page.id === currentPageId) pageDiv.classList.add('active-page');
        pagesContainer.appendChild(pageDiv);
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

function switchPage(pageId) {
    currentPageId = pageId;
    PAGE_MODULES.forEach(page => {
        const pageDiv = document.getElementById(`${page.id}Page`);
        if (pageDiv) {
            if (page.id === pageId) pageDiv.classList.add('active-page');
            else pageDiv.classList.remove('active-page');
        }
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.getAttribute('data-page') === pageId) btn.classList.add('active');
        else btn.classList.remove('active');
    });
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
        if (window.GitHubModule && window.GitHubModule.refreshTheme) {
            window.GitHubModule.refreshTheme();
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM 加载完成，开始构建页面...');
    loadingOverlay = document.getElementById('loading-overlay');
    buildTabs();
    buildPages();
    initTheme();
});
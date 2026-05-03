// 页面定义列表
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
        window.addError('页面结构错误', '找不到 #pageTabs 容器，请检查 HTML', true);
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
        window.addError('页面结构错误', '找不到 #pagesContainer 容器', true);
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
    console.log('📄 页面容器创建完成');

    let hasFatal = false;
    PAGE_MODULES.forEach(page => {
        showLoading(`正在加载 ${page.name} 模块...`);
        if (page.module && typeof page.module.init === 'function') {
            try {
                page.module.init(`${page.id}Page`);
                console.log(`✅ 模块 ${page.id} 初始化成功`);
            } catch (err) {
                hasFatal = true;
                const errorDetail = `文件: js/modules/${page.id}.js\n错误: ${err.message}\n堆栈: ${err.stack}`;
                window.addError(`模块 ${page.name} 初始化失败`, errorDetail, true);
                const pageDiv = document.getElementById(`${page.id}Page`);
                if (pageDiv) {
                    pageDiv.innerHTML = `<div class="glass-card" style="color:red; text-align:center;">${page.name} 模块加载失败<br>请在底部错误面板查看详情</div>`;
                }
            }
        } else {
            hasFatal = true;
            const errorDetail = `模块对象 window.${page.id.charAt(0).toUpperCase() + page.id.slice(1)}Module 不存在。\n请确认 js/modules/${page.id}.js 已正确加载并导出该对象。`;
            window.addError(`模块 ${page.name} 未定义`, errorDetail, true);
            const pageDiv = document.getElementById(`${page.id}Page`);
            if (pageDiv) {
                pageDiv.innerHTML = `<div class="glass-card" style="text-align:center;">${page.name} 模块未就绪</div>`;
            }
        }
    });

    hideLoading();
    if (hasFatal) {
        console.warn('部分模块初始化失败，请查看底部错误面板');
    } else {
        console.log('🎉 所有模块初始化完成');
    }
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

// 全局资源加载错误监听
window.addEventListener('error', (event) => {
    const target = event.target;
    if (target && (target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
        const url = target.src || target.href;
        window.addError('资源加载失败', `无法加载: ${url}\n请检查文件路径或网络`, true);
    }
});

// 未捕获的 Promise 错误
window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    let errorMsg = '未知异步错误';
    if (reason instanceof Error) errorMsg = reason.message;
    else if (typeof reason === 'string') errorMsg = reason;
    window.addError('异步操作错误', errorMsg, false);
});

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM 加载完成');
    loadingOverlay = document.getElementById('loading-overlay');
    buildTabs();
    buildPages();
    initTheme();
});
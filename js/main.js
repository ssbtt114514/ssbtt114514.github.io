// 页面定义列表 (顺序决定tab显示顺序)
const PAGE_MODULES = [
    { id: 'profile', name: '主页', icon: 'fas fa-user-astronaut', module: ProfileModule },
    { id: 'skills', name: '技能', icon: 'fas fa-laptop-code', module: SkillsModule },
    { id: 'games', name: '游戏', icon: 'fas fa-gamepad', module: GamesModule },
    { id: 'identity', name: '身份', icon: 'fas fa-id-card', module: IdentityModule },
    { id: 'experience', name: '经历', icon: 'fas fa-history', module: ExperienceModule },
    { id: 'github', name: '仓库', icon: 'fab fa-github', module: GitHubModule },
    { id: 'bilibili', name: '项目', icon: 'fas fa-code-branch', module: BilibiliModule },
    { id: 'contact', name: '联系', icon: 'fas fa-address-card', module: ContactModule }
];

let currentPageId = 'profile';

function buildTabs() {
    const tabsContainer = document.getElementById('pageTabs');
    if (!tabsContainer) return;
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
}

function buildPages() {
    const pagesContainer = document.getElementById('pagesContainer');
    if (!pagesContainer) return;
    pagesContainer.innerHTML = '';
    PAGE_MODULES.forEach(page => {
        const pageDiv = document.createElement('div');
        pageDiv.id = `${page.id}Page`;
        pageDiv.className = 'page';
        if (page.id === currentPageId) pageDiv.classList.add('active-page');
        pagesContainer.appendChild(pageDiv);
    });
    // 初始化各个模块
    PAGE_MODULES.forEach(page => {
        if (page.module && page.module.init) {
            page.module.init(`${page.id}Page`);
        }
    });
}

function switchPage(pageId) {
    currentPageId = pageId;
    // 更新页面显示
    PAGE_MODULES.forEach(page => {
        const pageDiv = document.getElementById(`${page.id}Page`);
        if (pageDiv) {
            if (page.id === pageId) pageDiv.classList.add('active-page');
            else pageDiv.classList.remove('active-page');
        }
    });
    // 更新tab样式
    document.querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.getAttribute('data-page') === pageId) btn.classList.add('active');
        else btn.classList.remove('active');
    });
}

function initTheme() {
    const themeBtn = document.getElementById('globalThemeSwitch');
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
        // 通知GitHub模块刷新主题（重新构建滤镜颜色）
        if (GitHubModule.refreshTheme) GitHubModule.refreshTheme();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    buildTabs();
    buildPages();
    initTheme();
});
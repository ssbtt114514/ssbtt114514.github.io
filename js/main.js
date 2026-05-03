// 存储全局数据
let currentPage = 'profile';
let allRepos = [];
let biliVideos = [];
let biliUserInfo = null;

// 页面容器和模块映射
const pagesContainer = document.getElementById('pagesContainer');
const pageTabs = document.getElementById('pageTabs');
const modules = {};

// 注册模块
function registerModule(id, renderFn, initFn) {
    modules[id] = { render: renderFn, init: initFn };
}

// 渲染所有页面
function renderAllPages() {
    let pagesHtml = '';
    let tabsHtml = '';
    
    CONFIG.MODULES.forEach(module => {
        pagesHtml += `<div id="${module.id}Page" class="page" data-page="${module.id}">${modules[module.id]?.render() || ''}</div>`;
        tabsHtml += `<button class="tab-btn ${module.id === currentPage ? 'active' : ''}" data-page="${module.id}"><i class="${module.icon}"></i><span> ${module.name}</span></button>`;
    });
    
    pagesContainer.innerHTML = pagesHtml;
    pageTabs.innerHTML = tabsHtml;
    
    // 初始化各模块
    CONFIG.MODULES.forEach(module => {
        if (modules[module.id]?.init) {
            setTimeout(() => {
                const page = document.getElementById(`${module.id}Page`);
                if (page && (!page.classList.contains('active-page') || module.id === currentPage)) {
                    modules[module.id].init();
                }
            }, 50);
        }
    });
}

// 切换页面
function switchPage(pageId) {
    CONFIG.MODULES.forEach(mod => {
        const page = document.getElementById(`${mod.id}Page`);
        if (page) page.classList.remove('active-page');
    });
    const activePage = document.getElementById(`${pageId}Page`);
    if (activePage) activePage.classList.add('active-page');
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.getAttribute('data-page') === pageId) btn.classList.add('active');
        else btn.classList.remove('active');
    });
    
    currentPage = pageId;
    
    // 延迟加载模块数据
    if (pageId === 'github' && allRepos.length === 0) loadGitHubData();
    if (pageId === 'bilibili' && biliVideos.length === 0) loadBiliData();
}

// 加载GitHub数据
async function loadGitHubData() {
    const repos = await fetchGitHubRepos();
    allRepos = repos;
    // 触发GitHub模块重新渲染
    if (window.renderGithub && document.getElementById('githubPage')?.classList.contains('active-page')) {
        window.renderGithub(allRepos);
    }
}

// 加载B站数据
async function loadBiliData() {
    biliUserInfo = await fetchBiliUserInfo();
    biliVideos = await fetchAllBiliVideos(CONFIG.BUILTIN_BV_LIST);
    // 触发Bilibili模块重新渲染
    if (window.renderBilibili && document.getElementById('bilibiliPage')?.classList.contains('active-page')) {
        window.renderBilibili(biliVideos, biliUserInfo);
    }
}

// 主题切换
function initTheme() {
    const themeBtn = document.getElementById('globalThemeSwitch');
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark');
        themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
    }
    themeBtn.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        themeBtn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    });
}

// 注册所有模块（确保在HTML渲染前注册）
registerModule('profile', renderProfile, initProfile);
registerModule('skills', renderSkills, initSkills);
registerModule('games', renderGames, initGames);
registerModule('identity', renderIdentity, initIdentity);
registerModule('experience', renderExperience, initExperience);
registerModule('github', () => renderGithub(allRepos), initGithub);
registerModule('bilibili', () => renderBilibili(biliVideos, biliUserInfo), initBilibili);
registerModule('contact', renderContact, initContact);

// 初始化
function init() {
    renderAllPages();
    initTheme();
    
    // 绑定页面切换事件
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchPage(btn.getAttribute('data-page')));
    });
    
    // 加载初始页面数据
    loadGitHubData();
    loadBiliData();
}

document.addEventListener('DOMContentLoaded', init);
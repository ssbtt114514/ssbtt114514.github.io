// ========== 配置区域 ==========
const CONFIG = {
    QQ_NUMBER: '1973737092',
    BILI_UID: '3546557150399113',
    WECHAT_ID: 'ssbtt114514',
    GITHUB_API_URL: 'https://api.github.com/users/ssbtt114514/repos?sort=updated&per_page=100',
    GITHUB_HOMEPAGE: 'https://github.com/ssbtt114514',
    QQ_ZONE_URL: 'https://user.qzone.qq.com/',
    BILI_SPACE_URL: 'https://space.bilibili.com/',
    BILI_USER_API: 'https://api.bilibili.com/x/space/acc/info?mid=3546557150399113',
    CORS_PROXY: 'https://cors-anywhere.herokuapp.com/',
    CONFIG_JSON_URL: './config.json'   // 著名项目配置文件
};

// 全局变量
let allRepos = [];
let currentRepoLang = 'all';
let currentSearchText = '';

let featuredProjects = [];
let projectSearchText = '';
let projectFilter = 'all';

const repoContainer = document.getElementById('repoGridContainer');
const langFilterContainer = document.getElementById('langFilterPage');
const searchInput = document.getElementById('repoSearchPage');
const LEVEL_EXP_TABLE = [0, 200, 1500, 4500, 10800, 28800, 0];
const MOCK_BILI_USER = { level: 5, current_exp: 18500, coins: 234, videos_count: 24, next_level_exp: 28800 };

// 辅助函数
function escapeHtml(str) { if(!str) return ''; return str.replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m])); }
function formatNumber(num) { if (num >= 10000) return (num / 10000).toFixed(1) + '万'; if (num >= 1000) return (num / 1000).toFixed(1) + 'k'; return num.toString(); }

// ========== GitHub 仓库功能 (保持不变) ==========
async function fetchRepos() {
    if (!repoContainer) return;
    repoContainer.innerHTML = '<div style="grid-column: span 2; text-align:center;"><i class="fas fa-spinner fa-pulse"></i> 正在同步 GitHub 数据...</div>';
    try {
        const res = await fetch(CONFIG.GITHUB_API_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const repos = await res.json();
        allRepos = repos;
        buildLanguageFilters();
        renderRepoGrid();
    } catch(e) {
        repoContainer.innerHTML = '<div style="grid-column: span 2; text-align:center;">⚠️ 仓库加载失败，请检查网络</div>';
        console.error(e);
    }
}

function buildLanguageFilters() {
    if (!langFilterContainer) return;
    const langSet = new Set(['all']);
    allRepos.forEach(repo => { const lang = repo.language || 'Mixed'; langSet.add(lang); });
    const sorted = Array.from(langSet).sort((a,b) => a === 'all' ? -1 : (b === 'all' ? 1 : a.localeCompare(b)));
    langFilterContainer.innerHTML = '';
    sorted.forEach(lang => {
        const chip = document.createElement('span');
        chip.className = 'filter-chip';
        chip.innerHTML = lang === 'all' ? '📁 全部' : `💻 ${lang}`;
        if (currentRepoLang === lang) { chip.style.background = '#6c8dff'; chip.style.color = 'white'; }
        chip.addEventListener('click', () => {
            currentRepoLang = lang;
            renderRepoGrid();
            document.querySelectorAll('#langFilterPage .filter-chip').forEach(c => { c.style.background = ''; c.style.color = ''; });
            chip.style.background = '#6c8dff'; chip.style.color = 'white';
        });
        langFilterContainer.appendChild(chip);
    });
}

function renderRepoGrid() {
    if (!repoContainer) return;
    let filtered = [...allRepos];
    if (currentRepoLang !== 'all') filtered = filtered.filter(r => (r.language || 'Mixed') === currentRepoLang);
    if (currentSearchText.trim()) { const kw = currentSearchText.toLowerCase(); filtered = filtered.filter(r => r.name.toLowerCase().includes(kw) || (r.description && r.description.toLowerCase().includes(kw))); }
    if (filtered.length === 0) { repoContainer.innerHTML = '<div style="grid-column: span 2; text-align:center; padding:40px;"><i class="fas fa-search"></i> 没有匹配的仓库～</div>'; return; }
    repoContainer.innerHTML = '';
    filtered.forEach(repo => {
        const card = document.createElement('a'); card.className = 'repo-tile'; card.href = repo.html_url; card.target = '_blank';
        const desc = repo.description ? repo.description.substring(0, 80) + (repo.description.length > 80 ? '…' : '') : '无描述';
        const date = new Date(repo.updated_at).toLocaleDateString('zh-CN');
        card.innerHTML = `<div style="font-weight:700; margin-bottom:8px;"><i class="fab fa-github"></i> ${escapeHtml(repo.name)}</div><div style="font-size:0.75rem; opacity:0.85; margin-bottom:8px;">📄 ${escapeHtml(desc)}</div><div style="font-size:0.7rem; display:flex; gap:12px;"><span>⭐ ${repo.stargazers_count}</span><span>📅 ${date}</span><span>🏷️ ${repo.language || 'Mixed'}</span></div>`;
        repoContainer.appendChild(card);
    });
}
if (searchInput) searchInput.addEventListener('input', (e) => { currentSearchText = e.target.value; renderRepoGrid(); });

// ========== 著名项目板块 (基于 config.json) ==========
async function fetchProgramList() {
    const grid = document.getElementById('projectGrid');
    if (!grid) return;
    grid.innerHTML = '<div class="bili-loading"><i class="fas fa-spinner fa-pulse"></i> 正在从 config.json 加载项目配置...</div>';

    try {
        const configRes = await fetch(CONFIG.CONFIG_JSON_URL);
        if (!configRes.ok) throw new Error('无法读取 config.json');
        const configData = await configRes.json();
        const projectsConfig = configData.projects || [];

        if (projectsConfig.length === 0) {
            grid.innerHTML = '<div class="bili-empty"><i class="fas fa-folder-open"></i><p>config.json 中没有项目</p></div>';
            return;
        }

        featuredProjects = [];
        
        for (let i = 0; i < projectsConfig.length; i++) {
            const proj = projectsConfig[i];
            grid.innerHTML = `<div class="bili-loading"><i class="fas fa-spinner fa-pulse"></i> 正在加载项目 (${i+1}/${projectsConfig.length})...</div>`;
            
            try {
                const parts = new URL(proj.url).pathname.split('/').filter(Boolean);
                if (parts.length < 2) {
                    console.error('❌ URL格式错误:', proj.url);
                    continue;
                }
                
                const owner = parts[0];
                const repo = parts[1];
                const apiRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
                
                if (!apiRes.ok) {
                    if (apiRes.status === 403) {
                        console.warn('⚠️ GitHub API 速率限制');
                    } else if (apiRes.status === 404) {
                        console.warn('⚠️ 仓库不存在:', proj.url);
                    }
                    continue;
                }
                
                const data = await apiRes.json();

                let category = 'Tool';
                const n = data.name.toLowerCase();
                const d = (data.description || "").toLowerCase();
                if (n.includes('engine') || d.includes('engine') || n.includes('source')) category = 'Engine';
                else if (n.includes('web') || n.includes('github.io') || d.includes('website')) category = 'Web';
                else if (n.includes('game') || d.includes('game')) category = 'Game';

                featuredProjects.push({
                    ...data,
                    category,
                    config: proj
                });
                
                renderProjects();
            } catch (e) {
                console.error(`❌ 加载失败: ${proj.url}`, e);
                continue;
            }
        }

        if (featuredProjects.length === 0) {
            grid.innerHTML = '<div class="bili-empty"><i class="fas fa-exclamation-triangle"></i><p>所有项目加载失败，请检查网络或 GitHub 状态</p></div>';
        }
    } catch (e) {
        console.error('❌ 配置文件加载失败:', e);
        grid.innerHTML = `<div class="bili-empty"><i class="fas fa-exclamation-triangle"></i><p>加载失败: ${e.message}</p></div>`;
    }
}

function renderProjects() {
    const grid = document.getElementById('projectGrid');
    if (!grid) return;

    let filtered = featuredProjects.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(projectSearchText.toLowerCase()) || 
                           (p.description && p.description.toLowerCase().includes(projectSearchText.toLowerCase()));
        const matchFilter = projectFilter === 'all' || p.category === projectFilter;
        return matchSearch && matchFilter;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="bili-empty"><i class="fas fa-search"></i><p>未找到匹配的项目</p></div>`;
        return;
    }

    grid.innerHTML = '';
    filtered.forEach(p => {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.onclick = () => openProjectModal(p);

        const previewImg = `https://opengraph.githubassets.com/1/${p.full_name}`;

        card.innerHTML = `
            <div class="video-thumb-wrap">
                <img class="video-thumbnail" src="${previewImg}" alt="${p.name}" loading="lazy" 
                     onerror="this.src='https://github.githubassets.com/images/modules/open_graph/github-logo.png'">
                <span class="video-duration">${p.language || 'Mixed'}</span>
            </div>
            <div class="video-info">
                <div class="video-title">${p.name}</div>
                <div class="video-meta"><i class="fas fa-star"></i> Stars: ${p.stargazers_count} | <i class="fas fa-code-branch"></i> Forks: ${p.forks_count}</div>
                <div class="video-stats">
                    <span class="video-stat">${p.description ? p.description.substring(0, 45) + '...' : '暂无项目描述'}</span>
                </div>
                <span class="video-tag">${p.category.toUpperCase()}</span>
            </div>
        `;
        grid.appendChild(card);
    });
}

// 打开项目详情模态框 (支持自定义按钮)
function openProjectModal(p) {
    const modal = document.getElementById('videoModal');

    document.getElementById('modalThumb').src = `https://opengraph.githubassets.com/1/${p.full_name}`;
    document.getElementById('modalTitle').textContent = p.name;

    const dateStr = new Date(p.updated_at).toLocaleDateString('zh-CN');
    document.getElementById('modalStats').innerHTML = `
        <span class="video-modal-stat"><i class="fas fa-star"></i> ${p.stargazers_count} Stars</span>
        <span class="video-modal-stat"><i class="fas fa-code-branch"></i> ${p.forks_count} Forks</span>
        <span class="video-modal-stat"><i class="fas fa-exclamation-circle"></i> ${p.open_issues_count} Issues</span>
        <span class="video-modal-stat"><i class="far fa-calendar-alt"></i> 更新: ${dateStr}</span>`;

    document.getElementById('modalDesc').innerHTML = `
        <p style="margin-bottom:12px;">${p.description || '暂无详细描述'}</p>
        <p style="font-size:0.8rem; opacity:0.7;"><i class="fas fa-balance-scale"></i> 许可协议: ${p.license ? p.license.spdx_id : '未设置'}</p>
    `;

    // 默认“前往仓库”按钮
    const linkBtn = document.getElementById('modalLink');
    linkBtn.href = p.html_url;
    linkBtn.innerHTML = '<i class="fab fa-github"></i> 前往 GitHub 仓库';

    // 复制链接按钮
    document.getElementById('modalCopy').onclick = () => {
        navigator.clipboard.writeText(p.html_url).then(() => alert('链接已复制'));
    };

    // ---------- 动态自定义按钮 ----------
    const actionsContainer = document.querySelector('.video-modal-actions');
    if (actionsContainer) {
        // 清除之前添加的自定义按钮
        actionsContainer.querySelectorAll('.custom-btn').forEach(el => el.remove());

        const projectConfig = p.config;
        if (projectConfig && projectConfig.button && projectConfig.buttons) {
            projectConfig.buttons.forEach(btn => {
                const customBtn = document.createElement('a');
                customBtn.className = 'video-modal-btn secondary custom-btn';
                customBtn.href = btn.link;
                customBtn.target = '_blank';
                customBtn.style.background = btn.color;
                customBtn.style.color = '#fff';  // 确保文字可见
                customBtn.innerHTML = `<i class="${btn.icon}"></i> ${btn.text}`;

                customBtn.addEventListener('click', function(e) {
                    this.style.background = btn.activeColor;
                });

                actionsContainer.appendChild(customBtn);
            });
        }
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeVideoModal() { 
    document.getElementById('videoModal').classList.remove('active'); 
    document.body.style.overflow = ''; 
}
document.getElementById('modalClose')?.addEventListener('click', closeVideoModal);
document.getElementById('videoModal')?.addEventListener('click', (e) => { 
    if (e.target === document.getElementById('videoModal')) closeVideoModal(); 
});

// 项目搜索
document.getElementById('projectSearchInput')?.addEventListener('input', (e) => {
    projectSearchText = e.target.value;
    renderProjects();
});

// 分类筛选 (你需要保证 HTML 中存在相应的 filter 元素，若没有可忽略)
document.querySelectorAll('#projectFilterRow .filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
        document.querySelectorAll('#projectFilterRow .filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        projectFilter = chip.dataset.filter;
        renderProjects();
    });
});

// ========== B站用户信息 (保持不变) ==========
async function fetchBiliData() {
    try {
        const proxyUrl = CONFIG.CORS_PROXY;
        const userRes = await fetch(proxyUrl + CONFIG.BILI_USER_API, { 
            headers: { 'Referer': 'https://space.bilibili.com' } 
        });
        const userData = await userRes.json();
        if (userData.code === 0) {
            const info = {
                level: userData.data.level,
                current_exp: userData.data.level_exp?.current_exp || 0,
                coins: userData.data.coins || 0,
                videos_count: userData.data.videos || 0,
                next_level_exp: userData.data.level_exp?.next_exp || LEVEL_EXP_TABLE[userData.data.level] || 0
            };
            renderBiliProfile(info);
        } else throw new Error();
    } catch(e) { 
        renderBiliProfile(MOCK_BILI_USER); 
    }
}

function renderBiliProfile(info) { 
    document.getElementById('biliLevel').textContent = `LV${info.level}`;
    document.getElementById('biliExp').textContent = info.current_exp.toLocaleString();
    document.getElementById('biliCoins').textContent = info.coins.toLocaleString();
    document.getElementById('biliVideos').textContent = info.videos_count;
    document.getElementById('levelBadge').textContent = `LV ${info.level}`;
    const nextExp = info.next_level_exp || LEVEL_EXP_TABLE[info.level] || 0;
    const prevExp = LEVEL_EXP_TABLE[info.level-1] || 0;
    const totalNeed = nextExp - prevExp;
    const currentInLevel = info.current_exp - prevExp;
    const progress = totalNeed > 0 ? Math.min(100, (currentInLevel / totalNeed) * 100) : 100;
    document.getElementById('expText').textContent = `${info.current_exp.toLocaleString()} / ${nextExp.toLocaleString()}`;
    document.getElementById('levelProgress').style.width = `${progress}%`;
    document.getElementById('nextLevelText').textContent = info.level >= 6 ? '已达到最高等级！' : `距离 LV${info.level+1} 还需 ${(nextExp - info.current_exp).toLocaleString()} 经验`;
}

// ========== 页面切换 ==========
const pages = ['profile', 'skills', 'games', 'identity', 'experience', 'github', 'bilibili', 'contact'];
function switchPage(pageId) {
    pages.forEach(p => { const el = document.getElementById(`${p}Page`); if (el) el.classList.remove('active-page'); });
    const activePage = document.getElementById(`${pageId}Page`); if (activePage) activePage.classList.add('active-page');
    document.querySelectorAll('.tab-btn').forEach(btn => { 
        if (btn.getAttribute('data-page') === pageId) btn.classList.add('active'); 
        else btn.classList.remove('active'); 
    });

    if (pageId === 'github' && allRepos.length === 0) fetchRepos();
    if (pageId === 'bilibili' && featuredProjects.length === 0) fetchProgramList();
}
document.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', () => switchPage(btn.getAttribute('data-page'))));

// ========== 社交与头像 ==========
function openQQHomepage(qq) { 
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent); 
    if(isMobile) { 
        window.location.href = `mqq://card/show_pslcard?uin=${qq}`; 
        setTimeout(() => { if(confirm('未唤起QQ，复制QQ号?')) navigator.clipboard.writeText(qq); }, 500); 
    } else { 
        window.open(`${CONFIG.QQ_ZONE_URL}${qq}`, '_blank'); 
    } 
}
function openBilibili(uid) { window.open(`${CONFIG.BILI_SPACE_URL}${uid}`, '_blank'); }
function copyWechat() { 
    navigator.clipboard.writeText(CONFIG.WECHAT_ID).then(() => alert(`微信号 ${CONFIG.WECHAT_ID} 已复制`)).catch(() => alert('手动复制：'+CONFIG.WECHAT_ID)); 
}
function initAvatar() { 
    const avatarDiv = document.getElementById('avatarShake'); 
    if(avatarDiv) avatarDiv.addEventListener('click', () => { 
        avatarDiv.style.transform = `translate(${(Math.random()-0.5)*40}px, ${(Math.random()-0.5)*30}px) scale(1.02)`; 
        setTimeout(() => avatarDiv.style.transform = '', 400); 
    }); 
    const img = document.getElementById('dynamic-qq-avatar'); 
    if(img) img.src = `https://q.qlogo.cn/headimg_dl?dst_uin=${CONFIG.QQ_NUMBER}&spec=140&t=${Date.now()}`; 
}
function initButtons() { 
    document.getElementById('ghBtn')?.addEventListener('click', () => window.open(CONFIG.GITHUB_HOMEPAGE, '_blank')); 
    document.getElementById('biliBtn')?.addEventListener('click', () => openBilibili(CONFIG.BILI_UID)); 
    document.getElementById('qqBtn')?.addEventListener('click', () => openQQHomepage(CONFIG.QQ_NUMBER)); 
    document.getElementById('wxBtn')?.addEventListener('click', copyWechat); 
    document.querySelectorAll('.skill-badge[data-url]').forEach(el => { 
        el.addEventListener('click', (e) => { e.stopPropagation(); window.open(el.getAttribute('data-url'), '_blank'); }); 
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
        if (allRepos.length) { buildLanguageFilters(); renderRepoGrid(); } 
    }); 
}

function init() { 
    initTheme(); 
    initAvatar(); 
    initButtons(); 
    fetchRepos(); 
    fetchBiliData(); 
    fetchProgramList();  // 页面加载时预加载著名项目
}
document.addEventListener('DOMContentLoaded', init);
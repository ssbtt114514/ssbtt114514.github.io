window.BilibiliModule = {
    projects: [],
    searchText: '',
    categoryFilter: 'all',
    container: null,
    searchInput: null,
    filterRow: null,
    modal: null,

    init(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        this.renderStructure();
        this.searchInput = document.getElementById('projectSearchInput');
        this.filterRow = document.getElementById('projectFilterRow');
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.searchText = e.target.value;
                this.renderProjects();
            });
        }
        if (this.filterRow) {
            this.filterRow.querySelectorAll('.filter-chip').forEach(chip => {
                chip.addEventListener('click', () => {
                    this.filterRow.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');
                    this.categoryFilter = chip.dataset.filter;
                    this.renderProjects();
                });
            });
        }
        this.modal = document.getElementById('videoModal');
        document.getElementById('modalClose')?.addEventListener('click', () => this.closeModal());
        this.modal?.addEventListener('click', (e) => { if (e.target === this.modal) this.closeModal(); });
        this.loadProjects();
    },
    renderStructure() {
        this.container.innerHTML = `
            <div class="glass-card">
                <div class="section-title"><i class="fas fa-code-branch"></i> 著名项目 · Showcase</div>
                <div class="bili-search-box">
                    <input type="text" id="projectSearchInput" placeholder="🔍 搜索项目名称 / 描述 / 技术栈...">
                </div>
                <div class="bili-filter-row" id="projectFilterRow">
                    <span class="filter-chip active" data-filter="all">📁 全部</span>
                    <span class="filter-chip" data-filter="Engine">⚙️ 引擎</span>
                    <span class="filter-chip" data-filter="Web">🌐 网页</span>
                    <span class="filter-chip" data-filter="Tool">🛠️ 工具</span>
                    <span class="filter-chip" data-filter="Game">🎮 游戏</span>
                </div>
                <div id="projectGrid" class="video-grid"><div class="bili-loading"><i class="fas fa-spinner fa-pulse"></i> 正在从 config.json 同步项目数据...</div></div>
            </div>
        `;
        this.projectGrid = document.getElementById('projectGrid');
    },
    async loadProjects() {
        if (!this.projectGrid) return;
        this.projectGrid.innerHTML = '<div class="bili-loading"><i class="fas fa-spinner fa-pulse"></i> 正在从 config.json 同步项目数据...</div>';
        try {
            const projectsConfig = await API.fetchProjectsConfig();
            this.projects = [];
            for (let i = 0; i < projectsConfig.length; i++) {
                const proj = projectsConfig[i];
                try {
                    const urlParts = new URL(proj.url).pathname.split('/').filter(Boolean);
                    if (urlParts.length < 2) continue;
                    const owner = urlParts[0], repo = urlParts[1];
                    const data = await API.fetchRepoDetail(owner, repo);
                    let category = 'Tool';
                    const n = data.name.toLowerCase(), d = (data.description || "").toLowerCase();
                    if (n.includes('engine') || d.includes('engine') || n.includes('source')) category = 'Engine';
                    else if (n.includes('web') || n.includes('github.io') || d.includes('website')) category = 'Web';
                    else if (n.includes('game') || d.includes('game')) category = 'Game';
                    this.projects.push({ ...data, category, config: proj });
                } catch(e) { console.warn(`加载项目失败: ${proj.url}`, e); }
            }
            this.renderProjects();
        } catch(e) {
            this.projectGrid.innerHTML = `<div class="bili-empty"><i class="fas fa-exclamation-triangle"></i><p>配置文件加载失败: ${e.message}</p></div>`;
        }
    },
    renderProjects() {
        if (!this.projectGrid) return;
        let filtered = this.projects.filter(p => {
            const matchSearch = p.name.toLowerCase().includes(this.searchText.toLowerCase()) ||
                (p.description && p.description.toLowerCase().includes(this.searchText.toLowerCase()));
            const matchFilter = this.categoryFilter === 'all' || p.category === this.categoryFilter;
            return matchSearch && matchFilter;
        });
        if (filtered.length === 0) {
            this.projectGrid.innerHTML = `<div class="bili-empty"><i class="fas fa-search"></i><p>未找到匹配的项目</p></div>`;
            return;
        }
        this.projectGrid.innerHTML = '';
        filtered.forEach(p => {
            const card = document.createElement('div');
            card.className = 'video-card';
            card.onclick = () => this.openProjectModal(p);
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
            this.projectGrid.appendChild(card);
        });
    },
    openProjectModal(p) {
        if (!this.modal) return;
        document.getElementById('modalThumb').src = `https://opengraph.githubassets.com/1/${p.full_name}`;
        document.getElementById('modalTitle').textContent = p.name;
        const dateStr = Utils.formatDate(p.updated_at);
        document.getElementById('modalStats').innerHTML = `
            <span class="video-modal-stat"><i class="fas fa-star"></i> ${p.stargazers_count} Stars</span>
            <span class="video-modal-stat"><i class="fas fa-code-branch"></i> ${p.forks_count} Forks</span>
            <span class="video-modal-stat"><i class="fas fa-exclamation-circle"></i> ${p.open_issues_count} Issues</span>
            <span class="video-modal-stat"><i class="far fa-calendar-alt"></i> 更新: ${dateStr}</span>`;
        document.getElementById('modalDesc').innerHTML = `
            <p style="margin-bottom:12px;">${p.description || '暂无详细描述'}</p>
            <p style="font-size:0.8rem; opacity:0.7;"><i class="fas fa-balance-scale"></i> 许可协议: ${p.license ? p.license.spdx_id : '未设置'}</p>
        `;
        const actionsContainer = document.getElementById('modalActions');
        actionsContainer.innerHTML = '';
        // 默认GitHub按钮
        const ghBtn = document.createElement('a');
        ghBtn.className = 'video-modal-btn primary';
        ghBtn.href = p.html_url;
        ghBtn.target = '_blank';
        ghBtn.innerHTML = '<i class="fab fa-github"></i> 前往 GitHub 仓库';
        actionsContainer.appendChild(ghBtn);
        // 自定义按钮
        if (p.config && p.config.button && p.config.buttons) {
            p.config.buttons.forEach(btn => {
                const customBtn = document.createElement('a');
                customBtn.className = 'video-modal-btn secondary custom-btn';
                customBtn.href = btn.link;
                customBtn.target = '_blank';
                customBtn.style.background = btn.color;
                customBtn.style.color = '#fff';
                customBtn.innerHTML = `<i class="${btn.icon}"></i> ${btn.text}`;
                actionsContainer.appendChild(customBtn);
            });
        }
        // 复制链接按钮
        const copyBtn = document.createElement('button');
        copyBtn.className = 'video-modal-btn secondary';
        copyBtn.innerHTML = '<i class="fas fa-share-alt"></i> 复制链接';
        copyBtn.onclick = () => { navigator.clipboard.writeText(p.html_url); alert('链接已复制'); };
        actionsContainer.appendChild(copyBtn);

        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    },
    closeModal() {
        if (this.modal) this.modal.classList.remove('active');
        document.body.style.overflow = '';
    }
};
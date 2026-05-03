window.GitHubModule = {
    allRepos: [],
    currentLang: 'all',
    currentSearch: '',
    container: null,
    filterContainer: null,
    searchInput: null,

    init(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        this.renderStructure();
        this.filterContainer = document.getElementById('langFilterPage');
        this.searchInput = document.getElementById('repoSearchPage');
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.currentSearch = e.target.value;
                this.renderRepoGrid();
            });
        }
        this.fetchAndRender();
    },
    renderStructure() {
        this.container.innerHTML = `
            <div class="glass-card">
                <div class="section-title"><i class="fab fa-github-alt"></i> 动态仓库 · 实时同步</div>
                <div class="search-box" style="margin-bottom: 16px;"><input type="text" id="repoSearchPage" placeholder="🔍 搜索仓库名称 / 描述..."></div>
                <div class="filter-wrapper" id="langFilterPage" style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px;"></div>
                <div id="repoGridContainer" class="repo-grid"><div style="padding: 20px;">加载仓库中 <i class="fas fa-spinner fa-pulse"></i></div></div>
            </div>
        `;
        this.repoGridContainer = document.getElementById('repoGridContainer');
    },
    async fetchAndRender() {
        if (!this.repoGridContainer) return;
        this.repoGridContainer.innerHTML = '<div style="grid-column: span 2; text-align:center;"><i class="fas fa-spinner fa-pulse"></i> 正在同步 GitHub 数据...</div>';
        try {
            this.allRepos = await API.fetchGitHubRepos();
            this.buildLanguageFilters();
            this.renderRepoGrid();
        } catch(e) {
            this.repoGridContainer.innerHTML = '<div style="grid-column: span 2; text-align:center;">⚠️ 仓库加载失败，请检查网络</div>';
            console.error(e);
        }
    },
    buildLanguageFilters() {
        if (!this.filterContainer) return;
        const langSet = new Set(['all']);
        this.allRepos.forEach(repo => { const lang = repo.language || 'Mixed'; langSet.add(lang); });
        const sorted = Array.from(langSet).sort((a,b) => a === 'all' ? -1 : (b === 'all' ? 1 : a.localeCompare(b)));
        this.filterContainer.innerHTML = '';
        sorted.forEach(lang => {
            const chip = document.createElement('span');
            chip.className = 'filter-chip';
            chip.innerHTML = lang === 'all' ? '📁 全部' : `💻 ${lang}`;
            if (this.currentLang === lang) { chip.style.background = '#6c8dff'; chip.style.color = 'white'; }
            chip.addEventListener('click', () => {
                this.currentLang = lang;
                this.renderRepoGrid();
                document.querySelectorAll('#langFilterPage .filter-chip').forEach(c => { c.style.background = ''; c.style.color = ''; });
                chip.style.background = '#6c8dff'; chip.style.color = 'white';
            });
            this.filterContainer.appendChild(chip);
        });
    },
    renderRepoGrid() {
        if (!this.repoGridContainer) return;
        let filtered = [...this.allRepos];
        if (this.currentLang !== 'all') filtered = filtered.filter(r => (r.language || 'Mixed') === this.currentLang);
        if (this.currentSearch.trim()) {
            const kw = this.currentSearch.toLowerCase();
            filtered = filtered.filter(r => r.name.toLowerCase().includes(kw) || (r.description && r.description.toLowerCase().includes(kw)));
        }
        if (filtered.length === 0) {
            this.repoGridContainer.innerHTML = '<div style="grid-column: span 2; text-align:center; padding:40px;"><i class="fas fa-search"></i> 没有匹配的仓库～</div>';
            return;
        }
        this.repoGridContainer.innerHTML = '';
        filtered.forEach(repo => {
            const card = document.createElement('a'); card.className = 'repo-tile'; card.href = repo.html_url; card.target = '_blank';
            const desc = repo.description ? repo.description.substring(0, 80) + (repo.description.length > 80 ? '…' : '') : '无描述';
            const date = Utils.formatDate(repo.updated_at);
            card.innerHTML = `<div style="font-weight:700; margin-bottom:8px;"><i class="fab fa-github"></i> ${Utils.escapeHtml(repo.name)}</div><div style="font-size:0.75rem; opacity:0.85; margin-bottom:8px;">📄 ${Utils.escapeHtml(desc)}</div><div style="font-size:0.7rem; display:flex; gap:12px;"><span>⭐ ${repo.stargazers_count}</span><span>📅 ${date}</span><span>🏷️ ${repo.language || 'Mixed'}</span></div>`;
            this.repoGridContainer.appendChild(card);
        });
    },
    refreshTheme() {
        if (this.allRepos.length) {
            this.buildLanguageFilters();
            this.renderRepoGrid();
        }
    }
};
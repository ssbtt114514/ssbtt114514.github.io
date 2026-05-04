// config/api.js - 精简版API（只保留GitHub相关）
window.API = {
    // 获取 GitHub 仓库列表
    async fetchGitHubRepos() {
        const res = await fetch(APP_CONFIG.GITHUB_API_URL);
        if (!res.ok) throw new Error(`GitHub API ${res.status}`);
        return await res.json();
    },

    // 加载 config.json 项目配置（项目模块用）
    async fetchProjectsConfig() {
        const res = await fetch(APP_CONFIG.CONFIG_JSON_URL);
        if (!res.ok) throw new Error('config.json 加载失败');
        const data = await res.json();
        return data.projects || [];
    },

    // 获取单个仓库详情（项目模块用）
    async fetchRepoDetail(owner, repo) {
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
        if (!res.ok) throw new Error(`GitHub API ${res.status}`);
        return await res.json();
    }
};
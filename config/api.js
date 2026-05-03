// API 请求封装
window.API = {
    // 获取 GitHub 仓库列表
    async fetchGitHubRepos() {
        const res = await fetch(APP_CONFIG.GITHUB_API_URL);
        if (!res.ok) throw new Error(`GitHub API ${res.status}`);
        return await res.json();
    },

    // 获取 B站用户信息 (通过CORS代理)
    async fetchBiliUserInfo() {
        const proxyUrl = APP_CONFIG.CORS_PROXY;
        const res = await fetch(proxyUrl + APP_CONFIG.BILI_USER_API, {
            headers: { 'Referer': 'https://space.bilibili.com' }
        });
        const data = await res.json();
        if (data.code !== 0) throw new Error('B站API错误');
        return {
            level: data.data.level,
            current_exp: data.data.level_exp?.current_exp || 0,
            coins: data.data.coins || 0,
            videos_count: data.data.videos || 0,
            next_level_exp: data.data.level_exp?.next_exp || APP_CONFIG.LEVEL_EXP_TABLE[data.data.level] || 0
        };
    },

    // 加载 config.json 项目配置
    async fetchProjectsConfig() {
        const res = await fetch(APP_CONFIG.CONFIG_JSON_URL);
        if (!res.ok) throw new Error('config.json 加载失败');
        const data = await res.json();
        return data.projects || [];
    },

    // 获取单个仓库详情 (用于项目模块)
    async fetchRepoDetail(owner, repo) {
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
        if (!res.ok) throw new Error(`GitHub API ${res.status}`);
        return await res.json();
    }
};
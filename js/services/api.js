// GitHub API
async function fetchGitHubRepos() {
    try {
        const res = await fetch(CONFIG.GITHUB_API_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (e) {
        console.error('GitHub API 失败:', e);
        return [];
    }
}

// B站用户信息 API
async function fetchBiliUserInfo() {
    try {
        const url = CONFIG.CORS_PROXY ? CONFIG.CORS_PROXY + CONFIG.BILI_USER_API : CONFIG.BILI_USER_API;
        const res = await fetch(url, { headers: { 'Referer': 'https://space.bilibili.com' } });
        const data = await res.json();
        if (data.code === 0) {
            return {
                level: data.data.level,
                current_exp: data.data.level_exp?.current_exp || 0,
                coins: data.data.coins || 0,
                videos_count: data.data.videos || 0,
                next_level_exp: data.data.level_exp?.next_exp || LEVEL_EXP_TABLE[data.data.level] || 0
            };
        }
        throw new Error();
    } catch (e) {
        console.log('B站用户信息获取失败，使用模拟数据');
        return MOCK_BILI_USER;
    }
}

// B站视频信息 API（单个BV号）
async function fetchBiliVideoInfo(bvid) {
    try {
        const url = CONFIG.CORS_PROXY 
            ? `${CONFIG.CORS_PROXY}https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`
            : `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;
        const res = await fetch(url, { headers: { 'Referer': 'https://space.bilibili.com' } });
        if (!res.ok) throw new Error(`API ${res.status}`);
        const data = await res.json();
        if (data.code !== 0) throw new Error(data.message);
        const v = data.data;
        return {
            bvid: v.bvid,
            title: v.title,
            description: v.desc || '',
            pic: v.pic,
            duration: formatDuration(v.duration),
            pubdate: v.pubdate,
            stat: { view: v.stat?.view || 0, like: v.stat?.like || 0, coin: v.stat?.coin || 0, danmaku: v.stat?.danmaku || 0 },
            tag: inferTag(v.title, v.desc || ''),
            tags: v.tag ? v.tag.split(',') : [v.tname].filter(Boolean)
        };
    } catch (err) {
        console.warn(`获取视频 ${bvid} 失败:`, err);
        return null;
    }
}

// 批量获取B站视频
async function fetchAllBiliVideos(bvList) {
    const limit = 5;
    const allVideos = [];
    for (let i = 0; i < bvList.length; i += limit) {
        const batch = bvList.slice(i, i + limit);
        const batchResults = await Promise.all(batch.map(bvid => fetchBiliVideoInfo(bvid)));
        allVideos.push(...batchResults.filter(v => v !== null));
    }
    return allVideos;
}
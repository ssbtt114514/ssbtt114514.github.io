// config/api.js - 使用公共CORS代理
window.API = {
    // 获取 GitHub 仓库列表
    async fetchGitHubRepos() {
        const res = await fetch(APP_CONFIG.GITHUB_API_URL);
        if (!res.ok) throw new Error(`GitHub API ${res.status}`);
        return await // config/api.js - 完整利用代理配置
window.API = {
    // 获取 GitHub 仓库列表
    async fetchGitHubRepos() {
        const res = await fetch(APP_CONFIG.GITHUB_API_URL);
        if (!res.ok) throw new Error(`GitHub API ${res.status}`);
        return await res.json();
    },

    // 构建带代理的URL
    buildProxyUrl(originalUrl, proxy) {
        if (proxy.type === 'encode') {
            return proxy.url + encodeURIComponent(originalUrl);
        } else {
            return proxy.url + originalUrl;
        }
    },

    // 获取 B站用户信息（使用配置中的代理列表）
    async fetchBiliUserInfo() {
        const uid = APP_CONFIG.BILI_UID;
        const originalUrl = `${APP_CONFIG.BILI_USER_API}?mid=${uid}`;
        
        // 获取要尝试的代理列表
        let proxiesToTry = [...APP_CONFIG.CORS_PROXIES];
        
        // 如果启用了降级，尝试所有代理；否则只尝试默认的
        if (!APP_CONFIG.PROXY_FALLBACK_ENABLED) {
            proxiesToTry = [APP_CONFIG.CORS_PROXIES[APP_CONFIG.DEFAULT_PROXY_INDEX]];
        }
        
        let lastError = null;
        
        for (const proxy of proxiesToTry) {
            try {
                const proxyUrl = this.buildProxyUrl(originalUrl, proxy);
                console.log(`🌐 尝试代理 [${proxy.name}]: ${proxyUrl.substring(0, 80)}...`);
                
                const response = await fetch(proxyUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    console.warn(`⚠️ 代理 [${proxy.name}] 返回 ${response.status}`);
                    continue;
                }
                
                let data = await response.json();
                
                // 某些代理返回的数据格式需要特殊处理
                if (proxy.name === 'allorigins') {
                    // allorigins 返回的数据可能被包装在 contents 中
                    if (data.contents) {
                        data = JSON.parse(data.contents);
                    }
                }
                
                // 验证B站API返回格式
                if (data && data.code === 0 && data.data) {
                    const info = data.data;
                    const currentExp = info.level_exp?.current_exp || 0;
                    const nextExp = info.level_exp?.next_exp || this.getExpForLevel((info.level || 0) + 1);
                    
                    console.log(`✅ B站数据获取成功！使用代理: ${proxy.name}`);
                    console.log(`   - 用户: ${info.name}`);
                    console.log(`   - 等级: Lv.${info.level}`);
                    console.log(`   - 经验: ${currentExp}/${nextExp}`);
                    console.log(`   - 硬币: ${info.coins}`);
                    console.log(`   - 视频: ${info.videos}`);
                    
                    return {
                        level: info.level || 0,
                        current_exp: currentExp,
                        coins: info.coins || 0,
                        videos_count: info.videos || 0,
                        next_level_exp: nextExp,
                        name: info.name || '',
                        face: info.face || '',
                        sex: info.sex || '',
                        sign: info.sign || ''
                    };
                }
            } catch (e) {
                console.warn(`❌ 代理 [${proxy.name}] 请求失败:`, e.message);
                lastError = e;
                continue;
            }
        }
        
        // 所有代理都失败，返回模拟数据
        console.warn('⚠️ 所有代理都失败，使用模拟数据');
        console.warn('最后错误:', lastError);
        return this.getMockBiliData();
    },
    
    // 获取指定等级所需经验
    getExpForLevel(level) {
        const expTable = {
            1: 200,
            2: 1500,
            3: 4500,
            4: 10800,
            5: 28800,
            6: 0
        };
        return expTable[level] || 28800;
    },
    
    // 模拟数据（可作为降级或测试用）
    getMockBiliData() {
        return {
            level: 5,
            current_exp: 18500,
            coins: 234,
            videos_count: 24,
            next_level_exp: 28800,
            name: 'ssbtt',
            face: '',
            sex: '保密',
            sign: '代码爱好者'
        };
    },

    // 测试代理是否可用
    async testProxy(proxyIndex = 0) {
        const proxy = APP_CONFIG.CORS_PROXIES[proxyIndex];
        if (!proxy) return false;
        
        try {
            const testUrl = 'https://httpbin.org/get';
            const proxyUrl = this.buildProxyUrl(testUrl, proxy);
            const res = await fetch(proxyUrl);
            return res.ok;
        } catch {
            return false;
        }
    },

    // 加载 config.json 项目配置
    async fetchProjectsConfig() {
        const res = await fetch(APP_CONFIG.CONFIG_JSON_URL);
        if (!res.ok) throw new Error('config.json 加载失败');
        const data = await res.json();
        return data.projects || [];
    },

    // 获取单个仓库详情
    async fetchRepoDetail(owner, repo) {
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
        if (!res.ok) throw new Error(`GitHub API ${res.status}`);
        return await res.json();
    }
};();
    },

    // 获取 B站用户信息（使用多个代理轮询）
    async fetchBiliUserInfo() {
        const uid = APP_CONFIG.BILI_UID;
        
        // 可用的CORS代理列表（按稳定性排序）
        const proxies = [
            {
                url: `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://api.bilibili.com/x/space/acc/info?mid=${uid}`)}`,
                parse: (data) => data
            },
            {
                url: `https://cors-anywhere.herokuapp.com/https://api.bilibili.com/x/space/acc/info?mid=${uid}`,
                parse: (data) => data
            },
            {
                url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(`https://api.bilibili.com/x/space/acc/info?mid=${uid}`)}`,
                parse: (data) => data
            },
            {
                url: `https://cors-proxy.htmldriven.com/?url=${encodeURIComponent(`https://api.bilibili.com/x/space/acc/info?mid=${uid}`)}`,
                parse: (data) => data
            }
        ];
        
        for (const proxy of proxies) {
            try {
                console.log(`尝试代理: ${proxy.url.substring(0, 60)}...`);
                
                const response = await fetch(proxy.url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                
                if (!response.ok) {
                    console.warn(`代理返回 ${response.status}`);
                    continue;
                }
                
                let data = await response.json();
                
                // 某些代理返回的数据可能被包装
                if (proxy.parse) {
                    data = proxy.parse(data);
                }
                
                // 检查B站API返回格式
                if (data && data.code === 0 && data.data) {
                    const info = data.data;
                    const currentExp = info.level_exp?.current_exp || 0;
                    const nextExp = info.level_exp?.next_exp || this.getExpForLevel((info.level || 0) + 1);
                    
                    console.log('✅ B站数据获取成功', {
                        level: info.level,
                        exp: currentExp,
                        coins: info.coins
                    });
                    
                    return {
                        level: info.level || 0,
                        current_exp: currentExp,
                        coins: info.coins || 0,
                        videos_count: info.videos || 0,
                        next_level_exp: nextExp,
                        name: info.name || '',
                        face: info.face || ''
                    };
                }
            } catch (e) {
                console.warn('代理请求失败:', e.message);
                continue;
            }
        }
        
        // 所有代理都失败，返回模拟数据
        console.warn('⚠️ 所有代理都失败，使用模拟数据');
        return this.getMockBiliData();
    },
    
    // 获取指定等级所需经验
    getExpForLevel(level) {
        const expTable = {
            1: 200,
            2: 1500,
            3: 4500,
            4: 10800,
            5: 28800,
            6: 0
        };
        return expTable[level] || 28800;
    },
    
    // 模拟数据（作为降级方案）
    getMockBiliData() {
        return {
            level: 5,
            current_exp: 18500,
            coins: 234,
            videos_count: 24,
            next_level_exp: 28800,
            name: 'ssbtt',
            face: ''
        };
    },

    // 加载 config.json 项目配置
    async fetchProjectsConfig() {
        const res = await fetch(APP_CONFIG.CONFIG_JSON_URL);
        if (!res.ok) throw new Error('config.json 加载失败');
        const data = await res.json();
        return data.projects || [];
    },

    // 获取单个仓库详情
    async fetchRepoDetail(owner, repo) {
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
        if (!res.ok) throw new Error(`GitHub API ${res.status}`);
        return await res.json();
    }
};
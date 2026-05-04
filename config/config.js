// config/config.js - 完整的代理配置
window.APP_CONFIG = {
    // 基础信息
    QQ_NUMBER: '1973737092',
    BILI_UID: '3546557150399113',
    WECHAT_ID: 'ssbtt114514',
    
    // GitHub配置
    GITHUB_API_URL: 'https://api.github.com/users/ssbtt114514/repos?sort=updated&per_page=100',
    GITHUB_HOMEPAGE: 'https://github.com/ssbtt114514',
    
    // B站配置
    BILI_SPACE_URL: 'https://space.bilibili.com/',
    BILI_USER_API: 'https://api.bilibili.com/x/space/acc/info',
    
    // 项目配置
    CONFIG_JSON_URL: './config.json',
    
    // 经验值对照表
    LEVEL_EXP_TABLE: [0, 200, 1500, 4500, 10800, 28800, 0],
    
    // ========== CORS代理配置（重要） ==========
    // 可用的CORS代理列表（按优先级排序）
    CORS_PROXIES: [
        {
            name: 'allorigins',
            url: 'https://api.allorigins.win/raw?url=',
            type: 'encode'
        },
        {
            name: 'corsproxy',
            url: 'https://corsproxy.io/?',
            type: 'encode'
        },
        {
            name: 'cors-anywhere',
            url: 'https://cors-anywhere.herokuapp.com/',
            type: 'direct'
        },
        {
            name: 'codetabs',
            url: 'https://api.codetabs.com/v1/proxy?quest=',
            type: 'encode'
        },
        {
            name: 'thingproxy',
            url: 'https://thingproxy.freeboard.io/fetch/',
            type: 'direct'
        }
    ],
    
    // 默认使用的代理索引（0表示第一个）
    DEFAULT_PROXY_INDEX: 0,
    
    // 是否启用代理降级（失败后自动尝试下一个）
    PROXY_FALLBACK_ENABLED: true
};
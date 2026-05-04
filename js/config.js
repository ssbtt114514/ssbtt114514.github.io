// 全局配置
const CONFIG = {
    QQ_NUMBER: '1973737092',
    BILI_UID: '3546557150399113',
    WECHAT_ID: 'ssbtt114514',
    GITHUB_API_URL: 'https://api.github.com/users/ssbtt114514/repos?sort=updated&per_page=100',
    GITHUB_HOMEPAGE: '// config/config.js - 精简版配置
window.APP_CONFIG = {
    // ========== 基础信息 ==========
    QQ_NUMBER: '1973737092',
    WECHAT_ID: 'ssbtt114514',
    
    // ========== GitHub配置 ==========
    GITHUB_API_URL: 'https://api.github.com/users/ssbtt114514/repos?sort=updated&per_page=100',
    GITHUB_HOMEPAGE: 'https://github.com/ssbtt114514',
    
    // ========== 项目配置 ==========
    CONFIG_JSON_URL: './config.json',
    
    // ========== QQ空间（联系模块用） ==========
    QQ_ZONE_URL: 'https://user.qzone.qq.com/'
};',
    QQ_ZONE_URL: 'https://user.qzone.qq.com/',
    BILI_SPACE_URL: 'https://space.bilibili.com/',
    BILI_USER_API: 'https://api.bilibili.com/x/space/acc/info?mid=3546557150399113',
    
    // CORS 代理（可选，如不需要可设为空字符串）
    CORS_PROXY: 'https://cors-anywhere.herokuapp.com/',
    
    // 内置 BV 号列表（在此处添加/删除，无需修改其他文件）
    BUILTIN_BV_LIST: [
        "BV1qC4y1Q7wX",
        "BV18T4y1Z79u",
        "BV1F54y1U7Yp"
    ],
    
    // 板块列表（按顺序显示，在此处添加新板块）
    MODULES: [
        { id: 'profile', name: '主页', icon: 'fas fa-user-astronaut' },
        { id: 'skills', name: '技能', icon: 'fas fa-laptop-code' },
        { id: 'games', name: '游戏', icon: 'fas fa-gamepad' },
        { id: 'identity', name: '身份', icon: 'fas fa-id-card' },
        { id: 'experience', name: '经历', icon: 'fas fa-history' },
        { id: 'github', name: '仓库', icon: 'fab fa-github' },
        { id: 'bilibili', name: '视频', icon: 'fab fa-bilibili' },
        { id: 'contact', name: '联系', icon: 'fas fa-address-card' }
    ]
};
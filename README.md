# 个人主页板块扩展教程

恭喜您成功运行了个人主页！本教程将教您如何轻松添加新的板块（页面）。

## 一、文件结构回顾

```

项目根目录/
├── index.html              # 主入口
├── config.json             # 项目配置文件
├── config/
│   ├── config.js           # 全局配置常量
│   └── api.js              # API请求封装
├── css/
│   └── main.css            # 全局样式
├── js/
│   ├── utils.js            # 工具函数
│   ├── main.js             # 主入口逻辑（板块注册处）
│   └── modules/            # 所有板块模块存放目录
│       ├── profile.js
│       ├── skills.js
│       ├── games.js
│       ├── identity.js
│       ├── experience.js
│       ├── github.js
│       ├── bilibili.js
│       └── contact.js

```

## 二、添加新板块的3个步骤

### 步骤1：创建板块模块文件

在 `js/modules/` 目录下新建一个 `.js` 文件，例如 `blog.js`。

**模块文件模板：**

```javascript
// js/modules/blog.js
window.BlogModule = {
    // 初始化函数（必须存在，系统会自动调用）
    init(containerId) {
        // 获取系统传入的容器元素
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // 渲染HTML内容
        container.innerHTML = `
            <div class="glass-card">
                <div class="section-title">
                    <i class="fas fa-blog"></i> 我的博客
                </div>
                <div class="blog-list">
                    <div class="blog-item">
                        <h3>📝 文章标题一</h3>
                        <p>发布时间：2026-01-01</p>
                        <a href="#" target="_blank">阅读全文 →</a>
                    </div>
                    <div class="blog-item">
                        <h3>📝 文章标题二</h3>
                        <p>发布时间：2026-01-15</p>
                        <a href="#" target="_blank">阅读全文 →</a>
                    </div>
                </div>
            </div>
        `;
        
        // 可选：加载动态数据
        this.loadData();
    },
    
    // 可选：自定义方法，加载远程数据
    async loadData() {
        // 示例：从API获取数据
        // const res = await fetch('https://api.example.com/posts');
        // const data = await res.json();
        // 然后更新DOM...
        console.log('数据加载完成');
    },
    
    // 可选：响应主题切换（如果需要特殊处理）
    refreshTheme() {
        // 暗色模式切换时会自动调用
        console.log('主题已切换');
    }
};
```

步骤2：在主配置中注册板块

编辑 js/main.js，找到 PAGE_MODULES 数组，在末尾添加新条目：

```javascript
// js/main.js 中的 PAGE_MODULES 数组
const PAGE_MODULES = [
    { id: 'profile', name: '主页', icon: 'fas fa-user-astronaut', module: window.ProfileModule },
    { id: 'skills', name: '技能', icon: 'fas fa-laptop-code', module: window.SkillsModule },
    { id: 'games', name: '游戏', icon: 'fas fa-gamepad', module: window.GamesModule },
    { id: 'identity', name: '身份', icon: 'fas fa-id-card', module: window.IdentityModule },
    { id: 'experience', name: '经历', icon: 'fas fa-history', module: window.ExperienceModule },
    { id: 'github', name: '仓库', icon: 'fab fa-github', module: window.GitHubModule },
    { id: 'bilibili', name: '项目', icon: 'fas fa-code-branch', module: window.BilibiliModule },
    { id: 'contact', name: '联系', icon: 'fas fa-address-card', module: window.ContactModule },
    // 👇 添加新板块（注意每行末尾要有逗号）
    { id: 'blog', name: '博客', icon: 'fas fa-blog', module: window.BlogModule }
];
```

字段说明：

字段 说明 示例
id 板块唯一标识，会生成 blogPage 容器ID 'blog'
name 标签页上显示的文字 '博客'
icon Font Awesome 图标类名 'fas fa-blog'
module 对应的模块对象（必须与文件名中的对象名一致） window.BlogModule

步骤3：在 index.html 中引入模块

编辑 index.html，在 </body> 前添加新的 script 标签：

```html
<!-- 现有模块 -->
<script src="js/modules/contact.js"></script>
<!-- 👇 添加新模块，注意顺序 -->
<script src="js/modules/blog.js"></script>
<script src="js/main.js"></script>
```

三、完成效果

刷新页面后，您会看到：

1. 标签栏出现新的"博客"按钮
2. 点击按钮可切换到对应内容

四、高级扩展示例

示例1：添加“友链”板块

```javascript
// js/modules/links.js
window.LinksModule = {
    init(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = `
            <div class="glass-card">
                <div class="section-title"><i class="fas fa-link"></i> 友情链接</div>
                <div class="links-grid" style="display: flex; flex-wrap: wrap; gap: 12px;">
                    <a href="https://github.com" target="_blank" class="contact-btn" style="flex:1; min-width:120px;">🐙 GitHub</a>
                    <a href="https://stackoverflow.com" target="_blank" class="contact-btn" style="flex:1; min-width:120px;">📚 Stack Overflow</a>
                </div>
            </div>
        `;
    }
};
```

示例2：添加“相册”板块（带图片网格）

```javascript
// js/modules/gallery.js
window.GalleryModule = {
    init(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const images = [
            'https://picsum.photos/id/1015/300/200',
            'https://picsum.photos/id/104/300/200',
            'https://picsum.photos/id/106/300/200',
            'https://picsum.photos/id/107/300/200'
        ];
        
        const galleryHtml = images.map(url => 
            `<img src="${url}" style="width:100%; aspect-ratio:16/9; object-fit:cover; border-radius:12px;">`
        ).join('');
        
        container.innerHTML = `
            <div class="glass-card">
                <div class="section-title"><i class="fas fa-images"></i> 摄影作品</div>
                <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:12px;">
                    ${galleryHtml}
                </div>
            </div>
        `;
    }
};
```

示例3：添加带API数据的“名言”板块

```javascript
// js/modules/quotes.js
window.QuotesModule = {
    init(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        this.render();
        this.fetchQuote();
    },
    
    render() {
        this.container.innerHTML = `
            <div class="glass-card" style="text-align: center;">
                <div class="section-title"><i class="fas fa-quote-left"></i> 每日一言</div>
                <div id="quote-text" style="font-size:1.2rem; font-style:italic; padding:20px;">加载中...</div>
                <div id="quote-author" style="opacity:0.7;"></div>
                <button id="refresh-quote" class="filter-chip" style="margin-top:16px;">换一句 🔄</button>
            </div>
        `;
        
        document.getElementById('refresh-quote')?.addEventListener('click', () => this.fetchQuote());
    },
    
    async fetchQuote() {
        try {
            // 使用免费名言API
            const res = await fetch('https://api.quotable.io/random');
            const data = await res.json();
            document.getElementById('quote-text').textContent = `"${data.content}"`;
            document.getElementById('quote-author').textContent = `—— ${data.author}`;
        } catch(e) {
            document.getElementById('quote-text').textContent = '✨ 保持热爱，奔赴山海 ✨';
            document.getElementById('quote-author').textContent = '—— ssbtt';
        }
    }
};
```

五、模块模板速查

```javascript
window.YourModuleName = {
    // 数据存储（可选）
    data: null,
    
    // 初始化函数（必选）
    init(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        this.render();
        this.bindEvents();   // 可选
        this.fetchData();    // 可选
    },
    
    // 渲染HTML（建议）
    render() {
        this.container.innerHTML = `你的HTML内容`;
    },
    
    // 绑定事件（可选）
    bindEvents() {
        // 给按钮等绑定点击事件
    },
    
    // 获取数据（可选）
    async fetchData() {
        try {
            const res = await fetch('你的API地址');
            const data = await res.json();
            this.data = data;
            this.updateUI();
        } catch(e) {
            console.error('数据加载失败', e);
        }
    },
    
    // 更新UI（可选）
    updateUI() {
        // 用 this.data 更新DOM
    },
    
    // 主题刷新回调（可选）
    refreshTheme() {
        // 暗色模式切换时自动调用
    }
};
```

六、可用的 Font Awesome 图标

类别 图标类 显示效果
通用 fas fa-home 🏠 主页
通用 fas fa-info-circle ℹ️ 关于
技术 fas fa-code 💻 代码
技术 fas fa-database 🗄️ 数据库
文档 fas fa-file-alt 📄 文档
文档 fas fa-newspaper 📰 文章
社交 fab fa-twitter 🐦 Twitter
社交 fab fa-telegram ✈️ Telegram
媒体 fas fa-music 🎵 音乐
媒体 fas fa-video 🎬 视频
工具 fas fa-cog ⚙️ 设置
工具 fas fa-chart-line 📈 统计

更多图标请访问：Font Awesome Icons

七、注意事项

要点 说明
模块命名 必须使用 window.XXXModule 格式，XXX 首字母大写
init 方法 每个模块必须有一个 init(containerId) 方法
容器ID containerId 是系统自动传入的，格式为 {id}Page
响应式 按钮和卡片样式已适配移动端，新内容建议使用 glass-card 类
暗色模式 系统会自动为 .dark body 下的元素应用暗色样式，无需额外处理
文件大小 每个模块文件应保持独立，不要在一个文件里定义多个模块
异步操作 在模块中使用 async/await 时注意错误处理，避免影响其他模块

八、快速清单

添加新板块时，请确认以下3点：

· 在 js/modules/ 中创建了 xxx.js 文件
· 文件中定义了 window.XxxModule 对象，且有 init 方法
· 在 js/main.js 的 PAGE_MODULES 数组中添加了配置项
· 在 index.html 中用 <script> 标签引入了 xxx.js

完成以上4步，刷新页面即可看到新板块！

九、常见问题

Q: 添加新板块后标签栏没出现？
A: 检查 main.js 中的 PAGE_MODULES 数组是否添加了配置，以及 index.html 是否引入了模块文件。

Q: 点击新板块显示空白？
A: 检查模块的 init 方法中 container 是否获取成功，以及是否正确设置了 innerHTML。

Q: 模块内的样式不生效？
A: 可以复使用已有的 glass-card、badge-group、contact-btn 等类名，或在 css/main.css 中添加自定义样式。

Q: 模块内的按钮点击无效？
A: 在 render() 之后调用 bindEvents() 方法绑定事件，或者在 init 中直接绑定。

---

祝您扩展愉快！如有问题，欢迎通过 GitHub Issue 反馈。

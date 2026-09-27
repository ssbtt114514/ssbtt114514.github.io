# ssbtt 个人主页 · Material You UI Refactor

这是一个纯前端静态个人主页，使用 HTML / CSS / JavaScript 构建。当前版本完成了整套 UI 重构，视觉方向采用 **Google Material 3 / Material You inspired** 的设计语言：大圆角、tonal surface、动态色、低阴影、胶囊式导航，以及有节制的 Expressive Motion。

> 说明：本项目是对 Material 3 / Material You 设计理念的前端风格化实现，并非 Google 官方 UI 组件库。

## 主要变化

### 1. 整体 UI 重构

旧版以“玻璃卡片 + 渐变按钮”为主，新版改成统一设计 token：

- 顶部 App Bar：品牌、页面状态、主题切换集中到同一层。
- 胶囊 Tab 导航：桌面端完整显示文字，移动端自动转为图标模式。
- Tonal Surface：卡片不再依赖厚重阴影，而是用表面色阶建立层级。
- 大圆角：`32 / 24 / 18 / 14px` 四级圆角体系。
- 动态色：页面主色、玻璃高光、按钮、进度条和背景共同使用头像提取的色彩。
- 深色模式：重新设计暗色 surface，不再使用全局 `* { color: white !important; }`。

### 2. 动态莫奈取色

`js/modules/colortheme.js` 负责头像动态取色，目标不是简单找一个“最常见颜色”，而是获得可以长期作为 UI 主题使用的一组色彩。

处理流程：

```text
头像
 ↓
48×48 降采样
 ↓
颜色量化
 ↓
过滤极黑 / 极白 / 低信息灰色
 ↓
按频率 + 饱和度 + 亮度评分
 ↓
增加色相间距，避免取到一堆近似色
 ↓
生成 4 色 Monet Palette
 ↓
驱动背景 / Primary / Glass / Glow / Progress
```

当前页面同时使用：

- `--monet-1` … `--monet-4`：背景和装饰色
- `--primary`：主按钮、激活 Tab、重点图标
- `--primary-glow`：动态光晕
- `--surface-tonal`：Material You 风格色调表面

### 3. 液态玻璃重新设计

新版没有继续无脑增加 `backdrop-filter: blur()`，而是采用多层轻量材质：

```text
透明 surface
 + 顶部反射
 + 鼠标局部高光
 + 边缘线
 + Monet 色彩反射
 + 低强度 backdrop blur
```

这样视觉上更接近“液态玻璃 / 半透明系统 UI”，同时控制滤镜开销。

移动端会自动降低 `backdrop-filter` 强度，并关闭鼠标跟随高光。

## 动画系统

动画保留，并做了分层处理：

### 已加入

1. **页面切换动画**
   - 保留 3D Cube 思路，但从 90° 大翻页改成轻量 `rotateY + translate + scale`。
   - 约 0.5 秒完成，降低页面切换时的视觉压迫感。

2. **内容 Stagger Reveal**
   - 页面中的卡片依次出现。
   - 延迟以 24ms 递增，并限制最大延迟，避免“逐个加载太久”。

3. **Material Ripple**
   - Tab、按钮、筛选芯片、技能标签支持点击涟漪。
   - 动画只使用 `transform / opacity`。

4. **头像动态光环**
   - 头像使用渐变环和旋转高光。
   - 点击、长按、三击彩蛋逻辑保留。

5. **Monet 浮动光团**
   - 背景的 3 个彩色光团持续缓慢漂移。
   - 仅动画 `transform`，不逐帧重写背景色。

6. **液态玻璃鼠标跟随**
   - 鼠标进入卡片时创建一次高光层。
   - `requestAnimationFrame` 节流更新位置。
   - 移动端自动关闭。

7. **图片缩放**
   - 项目 / 视频卡片的封面使用轻微 hover zoom。
   - 避免大幅缩放造成抖动。

8. **Loading Motion**
   - 初始加载遮罩改成 Material surface。
   - 增加呼吸图标和进度扫描条。

### 推荐继续加入的动画

这些效果建议按“增强体验”而不是“动画越多越好”的原则添加：

| 动画 | 推荐用途 | 实现方式 | 性能 |
|---|---|---|---|
| Shared Element Transition | 项目卡 → 项目详情 | View Transitions API | ★★★★☆ |
| Morph Navigation | Tab 切换 | transform + clip-path | ★★★★☆ |
| Scroll Reveal | 长页面模块 | IntersectionObserver | ★★★★★ |
| Magnetic Button | CTA / 联系按钮 | pointer + transform | ★★★★☆ |
| Image Parallax | Hero / 项目封面 | rAF + transform | ★★★★☆ |
| Skeleton Loading | API 数据 | CSS gradient | ★★★★★ |
| Number Counter | Stars / 数据统计 | requestAnimationFrame | ★★★★★ |
| Shared Avatar | 头像 → 详情 | transform / clip-path | ★★★☆☆ |
| Card Tilt | 项目卡 | 低角度 rotateX/Y | ★★★☆☆ |
| Ambient Gradient | 空背景 | 低频 transform | ★★★★★ |

不建议继续增加大量全屏 `filter: blur()`、高频 `box-shadow` 动画或同时运行的粒子系统，这些通常会直接增加 GPU / 合成压力。

## 性能策略

### 页面模块按需初始化

`js/main.js` 现在会：

1. 首先初始化当前页面。
2. 其他模块交给 `requestIdleCallback`（不支持时使用 `setTimeout`）。
3. 用户在后台初始化完成前点击 Tab，会立即初始化目标模块。

### 动画属性优先级

推荐遵循：

```text
transform / opacity
        ↓
clip-path / filter（低频）
        ↓
layout properties（尽量避免）
```

尽量不要在 `pointermove` / `scroll` 中持续修改：

- `width / height`
- `top / left`
- `margin / padding`
- `backdrop-filter`
- 大范围 `background`

### 动态取色只在必要时运行

头像取色属于初始化任务，不参与逐帧动画。背景动画通过已经计算出的 CSS 变量执行，不会不断重新计算调色板。

## 项目结构

```text
ssbtt114514.github.io/
├── index.html                  # 主页面
├── config.json                 # 项目 / 网站数据
├── CNAME                       # GitHub Pages 域名配置
├── avatar.jpg                  # 本地头像资源
│
├── config/
│   ├── config.js               # 全局配置
│   └── api.js                  # GitHub / 项目 API 封装
│
├── css/
│   ├── base.css                # Design Tokens / 基础 reset
│   ├── layout.css              # App Bar / 页面舞台 / 网格布局
│   ├── components.css          # 卡片 / Tab / Modal / 输入框等
│   ├── liquid-glass.css        # 液态玻璃材质
│   ├── animations.css          # 页面 / reveal / ripple / Monet 动画
│   ├── themes.css              # Light / Dark Theme
│   └── responsive.css          # 移动端适配
│
├── js/
│   ├── main.js                 # 应用入口、Tab、主题、Motion
│   ├── utils.js                # 通用工具
│   └── modules/                # 功能模块
│       ├── profile.js
│       ├── skills.js
│       ├── games.js
│       ├── identity.js
│       ├── experience.js
│       ├── github.js
│       ├── bilibili.js
│       ├── contact.js
│       └── colortheme.js
│
├── easter-egg.html             # 头像彩蛋页面
├── module.html                  # 模块开发示例
└── test.html                    # 测试页面
```

## 添加新模块

### 1. 创建模块

例如 `js/modules/blog.js`：

```javascript
window.BlogModule = {
    init(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="glass-card">
                <div class="section-title">
                    <i class="fas fa-blog"></i>
                    我的博客
                </div>
                <div class="badge-group">
                    <span class="skill-badge">HTML</span>
                    <span class="skill-badge">CSS</span>
                </div>
            </div>
        `;
    }
};
```

### 2. 在 `js/main.js` 注册

```javascript
const PAGE_MODULES = [
    // ...
    {
        id: 'blog',
        name: '博客',
        icon: 'fas fa-blog',
        module: window.BlogModule
    }
];
```

### 3. 在 `index.html` 引入

放在 `js/main.js` 前：

```html
<script src="js/modules/blog.js"></script>
<script src="js/main.js"></script>
```

## 自定义动态色

可以在控制台临时覆盖主题：

```javascript
document.documentElement.style.setProperty('--primary', '#6750A4');
document.documentElement.style.setProperty('--monet-1', '#6750A4');
document.documentElement.style.setProperty('--monet-2', '#7D5260');
document.documentElement.style.setProperty('--monet-3', '#006A6A');
document.documentElement.style.setProperty('--monet-4', '#386A20');
```

实际部署时推荐让 `ColorThemeModule` 统一管理这些变量。

## 深色模式

主题保存在 `localStorage.theme`：

```javascript
localStorage.setItem('theme', 'dark');
localStorage.setItem('theme', 'light');
```

页面启动时会自动读取，并通知动态色模块和 GitHub 模块重新渲染。

## 无障碍与动效偏好

项目支持：

```css
@media (prefers-reduced-motion: reduce) {
    /* 自动降低动画时长并取消持续性装饰动画 */
}
```

这意味着系统设置“减少动态效果”的用户不会被强制播放持续动画。

Tab 导航同时提供：

- `role="tablist"`
- `role="tab"`
- `role="tabpanel"`
- `ArrowLeft / ArrowRight`
- `Home / End`
- `aria-selected`
- `aria-controls`

## 部署

这是静态站点，可以直接部署到：

- GitHub Pages
- Cloudflare Pages
- Vercel
- Netlify
- 任意静态 HTTP 服务器

GitHub Pages 部署通常只需要把仓库内容推送到指定分支即可。

## 兼容性

核心特性：

- CSS Custom Properties
- CSS Grid / Flexbox
- `backdrop-filter`
- `color-mix()`（带 fallback）
- `requestAnimationFrame`
- `IntersectionObserver` 可用于继续扩展
- `requestIdleCallback`（有 fallback）

对于不支持 `backdrop-filter` 或 `color-mix()` 的浏览器，页面仍会保持正常布局，只是玻璃材质和动态色混合效果降低。

## 当前版本建议

本次重构优先解决的是：

```text
视觉统一
  ↓
动态色统一
  ↓
动画统一
  ↓
玻璃材质减负
  ↓
移动端适配
  ↓
无障碍 / Reduced Motion
```

后续继续扩展时，建议优先增加“有反馈价值”的 Motion，而不是简单增加持续运动元素。

---

**© 2026 ssbtt**

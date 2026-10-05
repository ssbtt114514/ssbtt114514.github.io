# StudyMap · Markmap 思维导图框架 v3

一个纯前端、可静态部署的高中学科思维导图框架。

## 目录

```text
index.html
js/
  mind.js          # 主框架
  mind-data.js     # file:// 本地打开时使用的内置 Markdown 副本
mind/
  math/main.md
  biology/main.md
  english/main.md
  chinese/main.md
  physics/main.md
  chemistry/main.md
  history/main.md
  geography/main.md
  */assets/       # 章节图片
css/
  style.css
other/
  # 第三方库说明
```

## 三种运行方式

### 1. 直接双击 index.html

浏览器禁止 `file://` 页面通过 `fetch()` 读取同目录 Markdown，这是浏览器安全模型，不是 Markdown 本身的问题。

v3 不再在 `file://` 模式下 fetch `mind/**/*.md`，而是使用 `js/mind-data.js` 中自动生成的内置副本，因此双击页面可以直接看到内置示例。

### 2. 本地静态服务器

推荐：

```bash
python -m http.server 8000
```

然后打开 `http://localhost:8000/`。

此模式会优先读取真正的 `mind/**/main.md` 文件，因此你修改 Markdown 后刷新页面即可看到变化。

### 3. 直接部署到静态服务器

可直接部署到 GitHub Pages、Nginx、Apache、Cloudflare Pages 等静态托管环境。

要求保持相对目录结构：

```text
index.html
js/
css/
mind/
other/
```

## 本地目录加载

页面提供“加载本地目录”按钮。选择项目根目录或 `mind` 目录后，浏览器会通过文件选择器读取实际 Markdown 和 `assets/` 图片，不需要后端。

## Markdown 图片

例如：

```md
![示意图](assets/example.svg)
```

图片路径相对于当前 Markdown 文件解析。HTTP/HTTPS 模式直接使用真实相对 URL；本地目录模式使用 Blob URL；`file://` 内置模式使用内置 data URL。

## 数学公式

Markmap 的 KaTeX 插件支持常见的 `$...$` 行内公式与 `$$...$$` 块公式，例如：

```md
- 基本不等式：$\frac{a+b}{2} \geq \sqrt{ab}$（$a>0,b>0$）
- 常用形式：$a+b \geq 2\sqrt{ab}$
```

## v3 修复

- 修复 `file:///.../mind/math/main.md` 被 CORS 拦截导致整张图为空。
- 修复 `lineWidth is not a function`：Markmap View 的低层 `lineWidth` 选项需要传函数，所以现在使用 `lineWidth: () => 2`。
- 增加 `file://` 内置 Markdown 副本。
- 增加整个 `mind` 文件夹导入。
- 本地图片、静态服务器图片统一处理。

## v5 折叠控制修复

使用 Markmap 0.18.x 的 `INode.payload.fold` 控制节点折叠状态。
“展开”会展开整棵树；“折叠”会保留根节点和第一层分支，其余节点折叠。
按钮操作不会重新调用 `setData()`，因此不会被 `initialExpandLevel` 恢复到初始状态。


## SVG / 图片支持

Markdown 中可以直接使用：

```md
![示意图](assets/example.svg)
```

V5 不再在 Markdown 解析阶段把本地图片替换成 `data:` / `blob:` URL，而是在 Markmap 完成 Markdown 转换后再替换最终节点 HTML，因此本地 SVG、PNG、JPG 在 `file://`、本地目录导入和 HTTP/HTTPS 静态部署三种模式下都可以使用。

同时会等待图片加载完成后重新计算 Markmap 布局，避免 SVG 已加载但节点尺寸仍为 0 导致“图片不显示/布局错误”。


## V6 图片修复

V6 增加了渲染后的 DOM 图片兜底处理：当浏览器在 `file://` 下仍把 Markdown 图片解析成相对路径时，会在 Markmap 创建完成后把 SVG/PNG/JPG 路径重新映射到内置 `data:` URL 或本地目录的 Blob URL，从而避免 `ERR_FILE_NOT_FOUND`。HTTP/HTTPS 静态部署则继续使用项目相对路径。

`Tracking Prevention blocked access to storage` 属于 Edge 对第三方 CDN 资源的存储隔离提示，不是 Markdown/SVG 文件路径错误。本项目核心图片加载不依赖第三方站点存储。

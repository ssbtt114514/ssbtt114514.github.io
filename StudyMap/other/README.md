# 第三方库

本项目使用 Markmap 渲染 Markdown 思维导图。

当前 `index.html` 使用固定版本 CDN：

- D3 `7.9.0`
- markmap-lib `0.18.12`
- markmap-view `0.18.12`

数学公式由 Markmap 的内置 KaTeX 插件按需加载。Markmap 官方文档说明，`Transformer` 会返回转换结果及 `features`，再通过 `getUsedAssets(features)` 获取插件所需的 CSS / JS，之后由 `markmap-view` 的 `loadCSS` / `loadJS` 注入页面。

如果要完全离线部署，可以把上述依赖的浏览器构建文件放进本目录，再把 `index.html` 的 `<script>` 改为本地相对路径。这样整个项目仍然是纯静态文件，不需要 Node.js、PHP、Python 后端。

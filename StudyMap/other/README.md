# 第三方库

本项目使用 Markmap 渲染 Markdown 思维导图，并使用三个可交互组件库。

## 1. Markmap（思维导图核心）

当前 `index.html` 使用固定版本 CDN：

- D3 `7.9.0`
- markmap-lib `0.18.12`
- markmap-view `0.18.12`

数学公式由 Markmap 的内置 KaTeX 插件按需加载。Markmap 官方文档说明，`Transformer` 会返回转换结果及 `features`，再通过 `getUsedAssets(features)` 获取插件所需的 CSS / JS，之后由 `markmap-view` 的 `loadCSS` / `loadJS` 注入页面。

## 2. JSXGraph（可交互数学图形）

- CDN：`https://cdn.jsdelivr.net/npm/jsxgraph@1.8.0/distrib/jsxgraphcore.js`
- 在 Markdown 中使用（注意整行、单引号包裹 JSON）：

```md
- <div class="jxg-board" data-graph='{"bounds":[-5,10,5,-2],"slider":{"name":"a","min":0.5,"max":6,"start":2,"fn":"x+a/x"},"label":"拖动滑块 a 观察最小值变化"}'></div>
```

- 初始化逻辑见 `js/jsxgraph-boards.js`（扫描 + MutationObserver + 学科切换清理）。

## 3. WebMolKit（分子结构渲染）

- CDN（官方 GitHub bundle，全局命名空间 `WebMolKit`）：

```html
<script src="https://cdn.jsdelivr.net/gh/aclarkxyz/web_molkit@master/dist/webmolkit.js"></script>
```

- 项目信息：npm `webmolkit@2.0.8` · GitHub `aclarkxyz/web_molkit` · Apache-2.0
- 在 Markdown 中使用（静态 SVG 分子结构图，`mol` 为内置预设名）：

```md
- <div class="wmk-mol" data-mol='{"mol":"h2o","label":"水分子 H₂O"}' style="width:300px;height:220px"></div>
```

- 交互式结构式编辑器（Sketcher）：

```md
- <div class="wmk-mol" data-mol='{"sketch":true,"mol":"h2o","box":"300,240","label":"尝试画结构式"}' style="width:300px;height:240px"></div>
```

- 内置分子预设（23 个，MOL V2000 数据在 `js/webmolkit-boards.js`）：
  h2o co2 nh3 ch4 n2 o2 cl2 hcl ccl4 so2 so3 h2so4 hno3 h2o2 nacl naoh na2o na2o2 na2co3 nahco3 fe2o3 fe3o4 al2o3
- 说明：
  - WebMolKit 为 Apache-2.0 许可的纯前端化学信息学工具包，无第三方依赖；
  - 渲染采用 `EmbedMolecule`（纯 SVG、只读、适合打印）；`sketch:true` 时启用 `Sketcher` 交互编辑器；
  - 数据为内置预设，不依赖网络请求，离线部署同样可用。

## 4. Rapier（物理引擎）

- CDN（官方 ES Module 兼容包，WASM 已内联为 base64，无需单独请求 `.wasm`）：

```html
<script type="module" src="js/rapier-loader.js"></script>
```

- 加载器内容：

```js
import * as RAPIER from 'https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.21.0/dist/rapier.mjs';
```

- 项目信息：npm `@dimforge/rapier3d-compat@0.21.0` · GitHub `dimforge/rapier` · Apache-2.0
- 在 Markdown 中使用（`data-sim` 为演示预设名）：

```md
- <div class="rp-demo" data-sim="freefall" style="width:320px;height:244px"></div>
```

- 内置演示预设（8 个，对应人教版物理必修第一册）：
  - `freefall` 自由落体（2.3）
  - `upthrow` 竖直上抛（2.2）
  - `slide` 刹车 / 匀减速（2.2 典型例题）
  - `spring` 弹簧振子·胡克定律（3.1）
  - `inclined` 斜面滑块·力的分解（3.4/3.5）
  - `push` 恒力推动·F=ma（4.3）
  - `elevator` 电梯超重失重（4.6）
  - `collision` 弹性碰撞（拓展）
- 说明：
  - 物理模拟由 Rapier WASM 引擎驱动，使用内置 `DebugRenderPipeline` 绘制到 2D Canvas；
  - 每个演示带「重置」按钮，支持展开/折叠后自动重新初始化；
  - 兼容包将 WASM 内联，`file://` 双击打开与静态部署均可用。

## 完全离线部署

如需完全离线部署，可以把上述依赖的浏览器构建文件放进本目录，再把 `index.html` 的 `<script>` 改为本地相对路径。这样整个项目仍然是纯静态文件，不需要 Node.js、PHP、Python 后端。

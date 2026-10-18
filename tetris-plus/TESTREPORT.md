# 测试报告（M8）
运行方式：`npm test`（Vitest，无浏览器依赖，逻辑层独立于渲染层——§3.2）。

## §6 覆盖矩阵
| 要求 | 用例位置 | 状态 |
|---|---|---|
| 重力结算 | attrs.test.ts ×4 | 已编写 |
| 气体顶起/上浮 | attrs.test.ts ×2 | 已编写 |
| 流体流动与凝结 | fluid.test.ts ×3 | 已编写 |
| 被炸岩浆转化 | fluid.test.ts ×2 | 已编写 |
| 三种 TNT 形状 | items.test.ts ×3 | 已编写 |
| 墙壁炸弹 | items.test.ts ×2 | 已编写 |
| 颜色阈值 | clear.test.ts ×3 | 已编写 |
| 魔方（2阶正例+3阶空心正例+负例） | clear.test.ts ×3 | 已编写 |
| 计分累加 | clear.test.ts（600=500+100） | 已编写 |
| 阶段阈值 | engine.test.ts | 已编写 |
| 红线判负 | engine.test.ts ×2 | 已编写 |
| 掉率统计（1000 次 ±5%） | engine.test.ts（seed=42 确定性） | 已编写 |
| 暂停限制 | engine.test.ts ×2 | 已编写 |
| 存读档一致性 | engine.test.ts | 已编写 |
| JSON 导入导出回显 | engine.test.ts ×2 | 已编写 |
| 集成：每档难度完整一局 | engine.test.ts 冒烟 ×5 | 已编写 |
| 边界：5×5×5 / 0掉率道具无效 / 反重力+塌方同帧 | engine.test.ts ×3 | 已编写 |

## 诚实性声明（§9.4 禁止虚构完成）
本环境无 shell/浏览器，**我未能实际执行** `npm install / npm test / npm run dev`。
上表“已编写”指用例已随仓库交付；请在本机执行 `npm test` 获得真实绿/红结果，
任何失败按 §9.3 流程修复（每问题上限 3 次，仍失败记录绕行）。
100×100×50 性能验收请在实机用 `configs/extreme.json` 改 W/D/H 后实测 30FPS。
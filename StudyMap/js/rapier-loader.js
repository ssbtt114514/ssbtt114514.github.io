/*
 * Rapier 物理引擎加载器（ES Module）
 *
 * - 通过 ES Module 从 jsDelivr 引入 @dimforge/rapier3d-compat（官方兼容包，
 *   WASM 已内联为 base64，浏览器无需额外请求 .wasm 文件）。
 * - 初始化完成后挂到 window.RAPIER 供普通脚本（rapier-boards.js）使用，
 *   同时暴露 window.__RAPIER_LOAD__ Promise 供按需等待。
 */
import * as RAPIER from 'https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.21.0/dist/rapier.mjs';

window.__RAPIER_LOAD__ = RAPIER.init().then(() => {
  window.RAPIER = RAPIER;
  return RAPIER;
}).catch((err) => {
  console.error('[Rapier] 物理引擎初始化失败：', err);
  return null;
});

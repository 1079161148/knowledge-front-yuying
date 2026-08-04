// 解决 MkDocs Material SPA（navigation.instant）切换页面时
// Mermaid 代码块不重新渲染、退化为纯文本的问题。
// 监听内容区变化，对新出现的未渲染 .mermaid 节点调用 mermaid.run()。
(function () {
  'use strict';

  function isRendered(el) {
    // 已渲染的节点会被 Mermaid 替换为包含 <svg> 的元素
    return el.querySelector('svg') !== null;
  }

  function renderPending() {
    if (!window.mermaid || typeof window.mermaid.run !== 'function') return;
    var nodes = document.querySelectorAll('pre.mermaid, div.mermaid, code.mermaid, .mermaid');
    var pending = [];
    for (var i = 0; i < nodes.length; i++) {
      if (!isRendered(nodes[i])) pending.push(nodes[i]);
    }
    if (pending.length === 0) return;
    try {
      window.mermaid.run({ nodes: pending });
    } catch (e) {
      // 忽略单次渲染异常，避免阻塞后续
      console.warn('[mermaid-render] run failed:', e);
    }
  }

  // 初次加载后渲染（兜底）
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderPending);
  } else {
    renderPending();
  }

  // SPA 切换 / 任意内容变化：用 MutationObserver 兜底
  if (typeof MutationObserver !== 'undefined') {
    var debounce = null;
    var observer = new MutationObserver(function () {
      if (debounce) cancelAnimationFrame(debounce);
      debounce = requestAnimationFrame(renderPending);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // 暴露手动触发入口，便于调试
  window.__renderMermaid = renderPending;
})();

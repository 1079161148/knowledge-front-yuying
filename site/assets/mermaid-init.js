// 初始化 Mermaid（深色主题，匹配 Material slate 配色）
window.mermaid = window.mermaid || {};
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
});
mermaid.run();

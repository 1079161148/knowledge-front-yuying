# 前端 PC 业务实战（总览）

这里是 **PC 中后台 / Web 应用天天会撞上的真实难点**，每个案例都配一个**浏览器打开即跑的 HTML demo**（无需构建、无需后端），用社区与市场验证的**最佳实践**拆解。

> 原则：**实战征服纸上谈兵**。每个难点都给你能交互的 demo + 关键代码思路 + 生产级踩坑，看完直接能用。

## 案例清单（点击展开左侧子菜单）

**高频基础（每个项目必写一遍）**
- [万行表格虚拟滚动](pc-virtual-table.md) — 大数据表格不卡死的唯一正解
- [复杂动态表单](pc-dynamic-form.md) — 增删行 / 联动 / 逐行校验
- [请求层：无感刷新 + 取消 + 重试](pc-request-layer.md) — 401 单飞刷新、AbortController
- [按钮级权限控制](pc-permission.md) — 前端隐藏 ≠ 后端不校验
- [大文件断点续传](pc-resume-upload.md) — 分片 + hash + 断点

**进阶亮点（拉开差距的实战）**
- [可拖拽看板 + 拖拽排序](pc-drag-kanban.md) — 原生拖拽 / Pointer 事件 / SortableJS 选型
- [富文本编辑器痛点拆解](pc-richtext.md) — contenteditable 光标/XSS/粘贴脏样式
- [可编辑树形表格](pc-editable-tree-table.md) — 树展开 + 父行汇总 + 失焦保存
- [瀑布流无限滚动](pc-masonry-infinite.md) — CSS columns vs 绝对定位、IO 触底
- [Web Worker 大数据计算](pc-webworker.md) — 主线程不卡死、分块进度、terminate
- [音视频处理（播放/截帧/压缩）](pc-media-processing.md) — canvas 截帧、MediaRecorder、WebCodecs 兼容
- [直播（WebRTC / HLS / FLV 低延迟）](pc-live.md) — 推流/拉流选型、延迟对比、flv.js/hls.js

## 怎么跑
- 直接在文档内嵌 `iframe` 交互；或打开 `docs/demos/pc-*.html` 源文件。
- 生产级库：虚拟滚动用 `el-table-v2` / `@tanstack/virtual`；拖拽用 `SortableJS` / `dnd-kit`；富文本用 `TipTap` / `Lexical`；请求层用 `Axios` 拦截器封装。

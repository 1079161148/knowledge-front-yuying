# 🏗️ 技术栈决策

**日期：** 2026-07-30

## 目的

记录本项目中技术选择的理由。

---

## 核心技术选择

### 1. 格式：Markdown (.md)

**为什么：**
- ✅ 通用支持（所有编辑器、所有平台）
- ✅ 人类可读且机器可解析
- ✅ Git-friendly（diff 清晰）
- ✅ 后期可转换为 HTML/PDF 等格式

**文件：** `docs/` 和 `setup/` 中的 `.md` 文件

---

### 2. 版本控制：Git + GitHub

**为什么：**
- ✅ 免费托管，无限公开仓库
- ✅ 内置协作功能
- ✅ 自动版本历史
- ✅ 集成 GitHub Pages 实现免费托管

**配置：**
```bash
git config --global user.name "lhl"
git config --global user.email "1079161148@qq.com"
```

---

### 3. 本地编辑器：Obsidian

**为什么：**
- ✅ 强大的本地 Markdown 编辑器
- ✅ 优秀的图谱视图，可视化连接关系
- ✅ 笔记间的双向链接
- ✅ 通过 Git/GitHub 同步
- ✅ 个人使用免费

**同步策略：**
1. 在 Obsidian 中本地编辑
2. 本地提交更改（`git add .`, `git commit`）
3. 推送到 GitHub（`git push origin main`）

---

### 4. 包管理工具：pnpm（可选）

**用于未来的 Web 增强功能：**

**为什么：**
- ✅ 比 npm/yarn 更快
- ✅ 节省磁盘空间（硬链接）
- ✅ 适合 monorepo

**使用示例：**
```bash
pnpm init
pnpm install -D typescript @types/node
```

---

## 未来增强技术

这些功能可以按需添加：

| 技术 | 用途 | 优先级 |
|------|------|--------|
| **Docusaurus** | 漂亮的静态文档站点 | 中 |
| **Algolia** | 全文搜索 | 高 |
| **Fuse.js** | 客户端搜索（轻量级） | 中 |
| **Tailwind CSS** | 样式和主题 | 低 |
| **Vercel/Netlify** | 部署托管 | 低 |

---

## Claude Skills 集成

以下技能可以增强本知识库：

| 技能 | 功能 | 如何使用 |
|------|------|----------|
| `duckdb-skills` | 将 markdown 当作 SQL 查询 | 附加 DuckDB 数据库，运行查询 |
| `dataviz` | 创建可视化 | 从知识数据生成图表 |
| `review` | 审查文档质量 | 检查一致性和完整性 |
| `workflow` | 自动化任务 | 创建备份/合并工作流 |
| `cron` | 调度自动化 | 每日自动备份 |

---

## 总结

该技术栈提供了灵活、强大且成本效益高的知识系统基础。核心组件（Markdown + Git + GitHub）确保了长期可持续性，而可选增强功能可以根据需求随时添加。

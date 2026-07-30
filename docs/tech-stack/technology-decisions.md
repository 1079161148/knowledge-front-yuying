# 🏗️ 技术栈决策

## 日期：2026-07-30

## 目的

记录本知识库项目在技术选型背后的考量与理由。

---

## 核心技术选型

### 1. 格式：Markdown（.md）

**原因：**
- ✅ 通用性好（所有编辑器、所有平台均支持）
- ✅ 人类可读，机器也可解析
- ✅ 对 Git 友好（差异对比清晰）
- ✅ 后续可转换为 HTML / PDF 等其他格式

**文件：** `docs/` 与 `setup/` 中统一使用 `.md`

---

### 2. 版本控制：Git + GitHub

**原因：**
- ✅ 无限公开仓库，免费托管
- ✅ 内置协作功能
- ✅ 自动记录版本历史
- ✅ 可结合 GitHub Pages 免费托管站点

**配置：**
```bash
git config --global user.name "lhl"
git config --global user.email "1079161148@qq.com"
```

---

### 3. 本地编辑器：Obsidian

**原因：**
- ✅ 强大的本地 Markdown 编辑器
- ✅ 优秀的图谱视图，便于可视化知识关联
- ✅ 笔记间支持双向链接
- ✅ 可通过 Git / GitHub 同步
- ✅ 个人使用免费

**同步策略：**
1. 在 Obsidian 中本地编辑
2. 本地提交变更（`git add .`、`git commit`）
3. 推送到 GitHub（`git push origin master`）

---

### 4. 包管理器：pnpm（可选）

**用于未来的 Web 端增强：**

**原因：**
- ✅ 比 npm / yarn 更快
- ✅ 节省磁盘空间（使用硬链接）
- ✅ 非常适合 monorepo

**使用示例：**
```bash
pnpm init
pnpm install -D typescript @types/node
```

---

## 未来可增强的技术

可按需后续引入：

| 技术 | 用途 | 优先级 |
|------|------|--------|
| **Docusaurus** | 美观的静态文档站点 | 中 |
| **Algolia** | 全文搜索 | 高 |
| **Fuse.js** | 客户端轻量搜索 | 中 |
| **Tailwind CSS** | 样式与主题 | 低 |
| **Vercel / Netlify** | 托管部署 | 低 |

---

## Claude Skills 集成

以下技能可增强本知识库：

| 技能 | 功能 | 使用方式 |
|------|------|----------|
| `duckdb-skills` | 以 SQL 查询 Markdown | 挂载 DuckDB 数据库后执行查询 |
| `dataviz` | 创建可视化图表 | 基于知识数据生成图表 |
| `review` | 审查文档质量 | 检查一致性与完整性 |
| `workflow` | 自动化任务 | 创建备份 / 合并工作流 |
| `cron` | 定时自动化 | 每日自动提交备份 |

---

## 总结

该技术栈为构建全面的知识系统提供了灵活、强大且高性价比的基础。核心组件（Markdown + Git + GitHub）保证了长期可持续性，而可选增强可随需求逐步引入。

# 🏗️ 知识前端基地

![Knowledge Base](https://via.placeholder.com/150)

## 🔍 关于本项目

这是一个全面的知识库系统设计，用于记录技术决策、安装流程和架构选择，适用于全栈开发项目。仓库使用 Markdown 文件作为内容，便于在任何编辑器（包括 Obsidian）中编辑。

---

## 🚀 快速入门

### 1. 克隆仓库
```bash
git clone https://github.com/1079161148/knowledge-front-yuying.git
cd knowledge-front-yuying
```

### 2. 在编辑器中打开
- **VS Code**: `code .`
- **Obsidian**: 将该文件夹打开为 vault
- **其他 Markdown 编辑器**：任何兼容 markdown 的编辑器

### 3. 开始编写文档
在 `docs/` 文件夹中创建新的 markdown 文件：
```
docs/
├── index.md           # 主入口页面
└── tutorials/         # 教程文章
    ├── guide-1.md
    └── guide-2.md
```

---

## 📂 目录结构

| 文件夹 | 用途 |
|--------|------|
| `setup/` | 安装文档和安装记录 |
| `tech-stack/` | 技术决策和比较 |
| `docs/` | 实际知识内容（Markdown 文件） |
| `scripts/` | 自动化脚本（备份、同步等） |
| `configs/` | 配置文件（.gitignore、设置） |

---

## 🛠️ 工具与技能集成

本知识库可与各种 Claude 技能集成：

```markdown
### DuckDB 集成
使用 DuckDB 将 markdown 内容当作数据库查询：
```sql
SELECT title FROM knowledge_base WHERE category = 'tutorial'
```

### Dataviz 可视化
使用 dataviz 技能创建图表，展示主题间的连接关系。

### Workflow 自动化
使用 workflow 技能自动执行备份和维护任务。
```

---

## 🤝 贡献指南

欢迎贡献！请参见 [CONTRIBUTING.md](CONTRIBUTING.md) 中的指导方针。

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE)

---

*使用 ❤️ + Markdown + Git + Claude Skills 构建*

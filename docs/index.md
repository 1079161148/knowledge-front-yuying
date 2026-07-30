# 📚 知识主页

欢迎来到知识库！这里是你所有技术文档、教程与参考资料的中心存储库。

---

## 🗂️ 主分类

| 分类 | 位置 | 描述 |
|------|------|------|
| **教程** | `docs/tutorials/` | 逐步指南 |
| **参考** | `docs/reference/` | API 文档、规范 |
| **常见问题** | `docs/faq/` | 常见问题解答 |
| **案例研究** | `docs/case-studies/` | 实际示例 |
| **内部** | `docs/internal/` | 团队特定笔记 |

---

## 🚀 入门指南

1. **浏览** `docs/` 文件夹中的各个分类
2. **创建新文档**，遵循 [贡献指南](https://github.com/1079161148/knowledge-front-yuying/blob/master/CONTRIBUTING.md)
3. **同步更改**，使用 `scripts/sync.bat`（Windows）或等效脚本

---

## 🔧 Claude Skills 集成

本知识库可与多种 Claude 技能集成，进一步扩展能力：

### 使用 DuckDB 技能
将 Markdown 内容作为数据库进行查询：

```bash
/duckdb-skills:attach-db path/to/knowledge-base
```

### 使用 Dataviz 技能
可视化各主题之间的关系：

```bash
/datavize:generate-knowledge-graph
```

### 使用 Workflow 技能
自动化日常维护任务：

```bash
/workflow:schedule-daily-backup
```

---

## 📁 目录结构

```
knowledge-front-yuying/
├── docs/               # 所有知识内容
│   ├── index.md        # 知识库入口
│   ├── setup/          # 搭建文档
│   └── tech-stack/     # 技术决策
├── scripts/            # 自动化脚本
└── configs/            # 配置文件
```

---

*Happy documenting!* ✍️

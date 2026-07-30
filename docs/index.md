# 📚 Knowledge Base Home

Welcome to the Knowledge Base! This is your central repository for all technical documentation, tutorials, and reference materials.

---

## 🗂️ Main Categories

| Category | Location | Description |
|----------|----------|-------------|
| **Tutorials** | `docs/tutorials/` | Step-by-step guides |
| **Reference** | `docs/reference/` | API docs, specifications |
| **FAQ** | `docs/faq/` | Frequently asked questions |
| **Case Studies** | `docs/case-studies/` | Real-world examples |
| **Internal** | `docs/internal/` | Team-specific notes |

---

## 🚀 Getting Started

1. **Browse categories** in the `docs/` folder
2. **Create new documents** following the [contribution guidelines](../CONTRIBUTING.md)
3. **Sync changes** using `scripts/sync.bat` (Windows) or equivalent script

---

## 🔧 Integration with Claude Skills

This knowledge base can be enhanced using various Claude skills:

```markdown
### Using DuckDB Skills
Attach DuckDB to query markdown content as a database:
```bash
/duckdb-skills:attach-db path/to/knowledge-base
```

### Using Dataviz Skill
Visualize connections between topics:
```bash
/datavize:generate-knowledge-graph
```

### Using Workflow Skill
Automate maintenance tasks:
```bash
/workflow:schedule-daily-backup
```
```

---

## 📁 Directory Structure

```
knowledge-front-yuying/
├── docs/               # All knowledge content
├── setup/              # Setup documentation
├── tech-stack/         # Technology decisions
├── scripts/            # Automation scripts
└── configs/            # Configuration files
```

---

*Happy documenting!* ✍️

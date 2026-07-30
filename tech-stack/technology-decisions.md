# 🏗️ Technology Stack Decisions

## Date: 2026-07-30

## Purpose

Document the rationale behind technology choices for this knowledge base project.

---

## Core Technology Choices

### 1. Format: Markdown (.md)

**Why:**
- ✅ Universal support (all editors, all platforms)
- ✅ Human-readable and machine-parsable
- ✅ Git-friendly (diffs are clean)
- ✅ Convertible to HTML/PDF/other formats later

**Files:** `.md` throughout `docs/` and `setup/`

---

### 2. Version Control: Git + GitHub

**Why:**
- ✅ Free hosting with unlimited public repos
- ✅ Built-in collaboration features
- ✅ Automatic version history
- ✅ Integrates with GitHub Pages for free hosting

**Configuration:**
```bash
git config --global user.name "lhl"
git config --global user.email "1079161148@qq.com"
```

---

### 3. Local Editor: Obsidian

**Why:**
- ✅ Powerful local markdown editor
- ✅ Excellent graph view for visualizing connections
- ✅ Bi-directional linking between notes
- ✅ Sync via Git/GitHub
- ✅ Free for personal use

**Sync Strategy:**
1. Edit locally in Obsidian
2. Commit changes locally (`git add .`, `git commit`)
3. Push to GitHub (`git push origin main`)

---

### 4. Package Manager: pnpm (Optional)

**For future web-based enhancements:**

**Why:**
- ✅ Faster than npm/yarn
- ✅ Saves disk space (hard links)
- ✅ Great for monorepos

**Usage Example:**
```bash
pnpm init
pnpm install -D typescript @types/node
```

---

## Future Enhancement Technologies

These can be added later as needed:

| Tech | Use Case | Priority |
|------|----------|----------|
| **Docusaurus** | Beautiful static site docs | Medium |
| **Algolia** | Full-text search search | High |
| **Fuse.js** | Client-side search (lightweight) | Medium |
| **Tailwind CSS** | Styling and theming | Low |
| **Vercel/Netlify** | Hosting deployment | Low |

---

## Claude Skills Integration

The following skills can enhance this knowledge base:

| Skill | Function | How to Use |
|-------|----------|------------|
| `duckdb-skills` | Query markdown as SQL | Attach DuckDB DB, run queries |
| `dataviz` | Create visualizations | Generate charts from knowledge data |
| `review` | Review documentation quality | Check for consistency and completeness |
| `workflow` | Automate tasks | Create backup/merge workflows |
| `cron` | Schedule automation | Auto-commit daily backups |

---

## Summary

This technology stack provides a flexible, powerful, and cost-effective foundation for building a comprehensive knowledge system. The core components (Markdown + Git + GitHub) ensure long-term sustainability while optional enhancements can be added as needs evolve.

# 🌿 版本控制（Git）

> 版本控制 = 记录每一次改动、支持协作与回滚。本篇覆盖 **Git 工作流、分支模型、提交规范、rebase/merge 取舍、常见撤销操作**，全部基于 Git 官方最佳实践。
>
> 权威来源：[Git 官方文档](https://git-scm.com/doc)、[Conventional Commits](https://www.conventionalcommits.org/)、[GitHub Flow](https://docs.github.com/en/get-started/quickstart/github-flow)、[Git Flow（nvie）](https://nvie.com/posts/a-successful-git-branching-model/)。

---

## 1. 术语表

- **Commit**：一次快照，含作者、时间、父指针、变更 diff。
- **Branch**：指向某个 commit 的轻量指针，切换成本极低。
- **HEAD**：当前所在位置（某分支或某 commit）。
- **Rebase**：把当前分支的提交"重放"到目标分支之后，历史线性。
- **Merge**：生成一个新"合并提交"，保留分支分叉历史。
- **Fast-forward**：目标分支无新提交时，直接移动指针，不产生合并提交。

---

## 2. 三种主流工作流

| 工作流 | 结构 | 适用 |
|--------|------|------|
| **GitHub Flow** | 只有 `main` + 短命功能分支，PR 合并即上线 | 持续部署的 Web 应用（最推荐） |
| **Git Flow** | `main`/`develop`/`feature`/`release`/`hotfix` | 有版本发布节奏的客户端/大型项目 |
| **Trunk-Based** | 所有人短频快合 `main`，几乎不开长分支 | 高效能团队、CI 成熟 |

!!! tip "绝大多数前端团队选 GitHub Flow"
    简单：`main` 受保护，功能开 `feature/*` 分支，PR 经 review + CI 通过后合并。无需维护 `develop`/`release` 的复杂度。

---

## 3. 日常操作速查

```bash
git clone <url>                 # 克隆
git checkout -b feature/login   # 开功能分支
git add -p                       # 交互式暂存（只加部分改动）
git commit -m "feat: 登录表单"   # 规范提交
git fetch origin                 # 拉取远端信息（不合并）
git rebase origin/main           # 把本地提交重放到最新 main 之后
git push -u origin feature/login
```

!!! danger "提交前必做"
    - 先 `git pull --rebase`（或 `fetch + rebase`）再 push，避免无谓的合并提交。
    - 用 `git add -p` 检查每一块改动，别 `git add .` 把调试代码/密钥一并提交。

---

## 4. 提交信息规范（Conventional Commits）

```
<type>(<scope>): <subject>
```
| type | 含义 |
|------|------|
| `feat` | 新功能 |
| `fix` | 修 bug |
| `docs` | 文档 |
| `style` | 格式（不影响逻辑） |
| `refactor` | 重构 |
| `test` | 测试 |
| `chore` | 构建/依赖等杂务 |
| `perf` | 性能 |
| `revert` | 回滚 |

!!! danger "提交流水线联动"
    `feat`/`fix` 会被 [语义化版本](https://semver.org/lang/zh-CN/) 工具识别自动升版本号；`BREAKING CHANGE:` 触发大版本升级。别乱写 type，否则发版号乱掉。

---

## 5. rebase vs merge 取舍

| 场景 | 推荐 |
|------|------|
| 本地未 push 的提交整理 | `rebase`（历史干净） |
| 已 push 的共享分支 | **禁止 force rebase**，用 `merge` |
| 功能分支合回 main | GitHub Flow 用 `rebase + squash merge` 最佳 |

!!! danger "绝对不要对已经推送到远端、别人可能基于它的分支做 rebase"
    rebase 会改写 commit hash，他人 pull 会产生"分叉历史地狱"。只能 rebase **你自己的、未共享**的本地提交。

---

## 6. 常见撤销操作（救命清单）

```bash
git restore <file>              # 丢弃工作区改动（未 add）
git restore --staged <file>     # 取消暂存（保留改动）
git commit --amend              # 改最近一次提交（未 push 时）
git reset --soft HEAD~1         # 回退提交但保留改动到暂存
git revert <hash>               # 生成一个"反向提交"撤销（已 push 安全做法）
git reflog                      # 查看 HEAD 所有移动，找回误删提交
```

!!! danger "reset 是危险操作"
    `git reset --hard` 会**永久丢弃**工作区与暂存区改动，且一旦超过 reflog 保留期无法找回。误删后用 `git reflog` + `git checkout <hash>` 抢救，别慌着重来。

---

## 7. 自检清单

- [ ] 我用功能分支开发，不直接推 `main`
- [ ] 提交信息遵循 Conventional Commits
- [ ] 推送前先 rebase 到最新 main
- [ ] 我知道已 push 的分支不能强推 rebase
- [ ] 我会用 `git restore` / `revert` / `reflog` 安全撤销
- [ ] 密钥/大文件不进仓库（用 `.gitignore` + 环境变量）

---

## 8. 下一步

- 提交规范如何自动卡口 → [静态代码分析](../code-quality/index.md)
- push 后自动构建测试 → [CI/CD](../cicd/index.md)
- 多包仓库怎么管 → [Monorepo](../monorepo/index.md)

# 🚀 持续集成 / 持续部署（CI/CD）

> CI/CD = 每次 push 自动「构建 → 测试 → 部署」，把人工重复劳动变成流水线。本篇覆盖 **CI 流程设计、GitHub Actions / GitLab CI 配置、缓存与矩阵、产物上传、部署策略**。
>
> 权威来源：[GitHub Actions 文档](https://docs.github.com/actions)、[GitLab CI 文档](https://docs.gitlab.com/ee/ci/)、[The Twelve-Factor App（构建/发布/运行）](https://12factor.net/)。

---

## 1. 术语表

- **CI（持续集成）**：频繁合并代码并自动构建+测试，尽早发现冲突/回归。
- **CD（持续部署 / 交付）**：通过 CI 后自动/一键发布到环境。
- **Artifact（产物）**：流水线生成的可被下载/部署的文件（dist、镜像）。
- **Runner**：执行流水线任务的机器（GitHub 托管或自托管）。
- **Cache / Artifact**：Cache 跨运行加速依赖；Artifact 跨 job 传递文件。

---

## 2. 一条标准 CI 流水线

```
代码 push
  └─ 安装依赖（带缓存）
       └─ Lint + 类型检查
            └─ 单元测试 + 覆盖率
                 └─ 构建产物
                      └─ （CD）部署到预览/生产
```

!!! danger "CI 必须卡住的红线"
    - Lint/类型检查失败 → 阻止合并。
    - 单元测试不达标（或覆盖率下降过多）→ 阻止合并。
    - 构建失败 → 不部署。
    否则 CI 形同虚设。

---

## 3. GitHub Actions 实战

```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [main]
  pull_request:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint && pnpm typecheck
      - run: pnpm test -- --coverage
      - run: pnpm build
      - uses: actions/upload-artifact@v4
        with: { name: dist, path: dist }
```

!!! tip "关键优化"
    - `cache: 'pnpm'` + `--frozen-lockfile`：锁定依赖、复用缓存，安装更快更稳。
    - 用 `pull_request` 触发可在合并前就拦问题。

---

## 4. 部署策略

| 策略 | 说明 | 风险 |
|------|------|------|
| **蓝绿（Blue/Green）** | 两套环境，流量瞬间切到新版本 | 需双倍资源 |
| **金丝雀（Canary）** | 先放 5% 流量，观察后再全量 | 需要路由/网关支持 |
| **滚动（Rolling）** | 逐批替换实例 | 过渡期新旧并存 |

!!! danger "部署前必做"
    - 环境变量用 Secrets 管理，**绝不写进仓库**（见 [文档与环境](../docs-and-env/index.md)）。
    - 生产部署配健康检查 + 自动回滚（部署失败/健康检查不通过自动撤）。
    - 静态站点用 `actions/deploy-pages` 或推到对象存储/CDN。

---

## 5. 矩阵构建（多环境验证）

```yaml
strategy:
  matrix:
    node: [18, 20]
    os: [ubuntu-latest, windows-latest]
```

---

## 6. 自检清单

- [ ] push/PR 自动触发 Lint + 测试 + 构建
- [ ] 依赖用 lockfile + 缓存，安装可复现
- [ ] 测试不通过则流水线失败、阻止合并
- [ ] 产物作为 artifact 上传或被部署消费
- [ ] 部署用 Secrets 管理密钥，有健康检查与回滚
- [ ] 知道蓝绿/金丝雀/滚动三种策略的取舍

---

## 7. 下一步

- 卡口规范怎么配 → [静态代码分析](../code-quality/index.md)
- 测试怎么写 → [测试](../testing/index.md)
- 构建产物怎么来 → [构建工具](../build-tools/index.md)

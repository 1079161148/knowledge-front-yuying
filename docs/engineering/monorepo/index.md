# 📚 Monorepo 与依赖管理

> 单仓多包（Monorepo）= 一个仓库管多个可独立发布/使用的包/应用。本篇覆盖 **pnpm workspace、Turborepo/Nx 任务编排、依赖治理、版本发布（changesets）**，基于官方最佳实践。
>
> 权威来源：[pnpm workspace](https://pnpm.io/workspaces)、[Turborepo](https://turbo.build/repo/docs)、[Nx](https://nx.dev/)、[Changesets](https://github.com/changesets/changesets)。

---

## 1. 术语表

- **Monorepo**：多包同仓，共享配置与工具链。
- **Workspace**：包管理器识别的多包根（pnpm/yarn/npm workspaces）。
- **任务编排（Orchestration）**：按依赖关系并行/缓存地跑 build/test。
- **Phantom Dependency**：能 import 未声明依赖（扁平 node_modules 的副作用）。
- **Changesets**：基于 PR 描述自动算出版本号与 changelog。

---

## 2. pnpm workspace 搭建

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

```bash
pnpm install                 # 统一装全部依赖
pnpm -F web dev              # 只跑 web 应用
pnpm -r build                # 递归构建所有包
pnpm -F @repo/ui add vue     # 给 ui 包加依赖
```

!!! tip "pnpm 严格隔离的好处"
    pnpm 用软链接 + 全局 store，依赖是**严格**的。import 没声明的包直接报错（逼你显式声明），从根上消灭 phantom dependency。

---

## 3. 任务编排：Turborepo / Nx

```json
// turbo.json
{
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "test": { "dependsOn": ["^build"] }
  }
}
```

```bash
turbo run build --filter=web        # 只构建 web 及其依赖
turbo run test --cache               # 命中缓存直接复用结果
```

!!! danger "缓存的正确姿势"
    - `outputs` 必须声明产物目录，否则缓存无法复用。
    - CI 里把 `node_modules/.turbo` 或远端缓存配好，本地与 CI 共享缓存才提速。

---

## 4. 依赖治理

- **公共依赖提升**：把 `vue`/`react` 等放到根 `package.json` 的 `devDependencies`，避免各包版本漂移。
- **版本策略**：
  - **固定版本（pinned）**：所有包同一版本（如 `@repo/ui` 全 `1.2.0`）→ 用 workspace `*` + changesets 统一升。
  - **独立版本（independent）**：各包独立发版。
- **锁文件**：单一 `pnpm-lock.yaml` 保证全员依赖一致。

!!! danger "Monorepo 反面"
    - 把**不该共享**的大依赖（如某 app 专属 SDK）塞进根依赖 → 所有人 node_modules 变胖。
    - 包之间循环依赖（A 依赖 B，B 又依赖 A）→ 构建死锁，用 `madge` 检测。

---

## 5. 发布：Changesets

```bash
pnpm add -D @changesets/cli
npx changeset        # 选包 + 写 semver 类型（patch/minor/major）
npx changeset version  # 按 changeset 升版本 + 写 changelog
npx changeset publish  # 发布到 npm
```

---

## 6. 自检清单

- [ ] 我用 workspace 管理多包，根依赖收敛公共库
- [ ] 用 Turborepo/Nx 做任务编排与缓存
- [ ] turbo outputs 正确声明产物目录
- [ ] 无循环依赖（madge 检测）
- [ ] 发布用 changesets 自动算版本与 changelog
- [ ] 单一 lockfile 保证依赖一致

---

## 7. 下一步

- 包之间怎么共享模块 → [模块化](../modularization/index.md)
- 构建产物怎么来 → [构建工具](../build-tools/index.md)
- 提交如何联动版本 → [版本控制](../version-control/index.md)

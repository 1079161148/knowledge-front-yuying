# 🧰 开发素养：环境搭建 + Git + DevTools + 包管理（新人落地必会）

> 接续 [知识库大纲与路线](../roadmap.md)。本篇补齐培训机构第一节就讲的"工程素养三件套"——**环境搭建、Git 版本控制、Chrome DevTools 调试、包管理器(npm/pnpm)**。这些是新人从"会写代码"到"能进团队"的门槛。依据 **Node.js 官方文档**、**Git 官方文档**、**Chrome DevTools 文档**、**npm/pnpm 官方文档**。
>
> 适用：**全等级**——新人照做、中级规范协作、高级定 CI 流程。前置：无（零门槛）。
>
> 更详细的零基础安装向导 → [新手第一课：从 0 搭建你的第一个网页](../getting-started/quickstart.md)

---

## 零、环境搭建：安装 Node.js

Node.js 是所有前端工程化的基础——Vite、Webpack、ESLint、Prettier 全部运行在 Node.js 上。

### 0.1 下载

前往 [https://nodejs.org](https://nodejs.org)，选择 **LTS（长期支持版）**。左侧按钮一般标着 `20.18.x LTS` 或类似。

### 0.2 安装（按系统）

=== "Windows"

    1. 双击 `.msi` 安装包
    2. 一路 **Next**，所有默认选项都是正确的
    3. 到 `Tools for Native Modules` 时 **勾选**复选框
    4. 安装完成后**重启终端**（或重启电脑）

=== "macOS"

    1. 双击 `.pkg` 安装包
    2. 一路 Continue → Agree → Install
    3. 输入开机密码完成安装

=== "Linux (Ubuntu/Debian)"

    ```bash
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```

### 0.3 验证

打开终端（Windows: `Win+R` → `cmd`；macOS: 打开"终端"App），输入：

```bash
node -v    # 预期：v20.18.x
npm -v     # 预期：10.x.x
```

### 0.4 npm 换国内镜像（中国大陆推荐）

```bash
npm config set registry https://registry.npmmirror.com
```

安装速度从分钟级变成秒级。

!!! danger "别跳过锁文件"
    `package-lock.json` / `pnpm-lock.yaml` 必须提交到 Git，保证团队装同一版本。详见下方包管理章节。

---

## 一、Git：版本控制与协作

### 1.1 日常七步曲

```bash
git init                      # 仅首次：初始化仓库
git clone <url>               # 拉取已有仓库
git status                    # 看改了什么
git add .                     # 暂存
git commit -m "feat: 新增登录"  # 提交（约定式提交见下）
git pull --rebase             # 先拉再推，保持线性
git push                      # 推到远程
```

!!! danger "死角 1：别 `git push --force` 到 main/master"
    强制推送会覆盖他人历史，团队协作灾难。用 `--force-with-lease` 或走 PR/MR 评审。

### 1.2 分支与协作模型

```bash
git checkout -b feature/login   # 开功能分支
git switch -c fix/bug-123       # 新方法（Git 2.23+）
git merge feature/login         # 合并回主干
git rebase main                 # 变基，保持历史干净
```

!!! tip "约定式提交（Conventional Commits）"
    `feat:` 新功能 / `fix:` 修复 / `docs:` 文档 / `refactor:` 重构 / `test:` 测试 / `chore:` 杂务。配合 [工程化·Commitlint](../engineering/index.md) 自动校验。

### 1.3 `.gitignore` 必须的

```
node_modules/
dist/
.env
*.log
.DS_Store
```

---

## 二、Chrome DevTools：调试实战

### 2.1 必会四块

| 面板 | 用途 |
|------|------|
| Elements | 看 DOM/CSS，实时改样式 |
| Console | 打日志、`$0` 引用当前选中元素、`copy(obj)` 复制对象 |
| Sources | 打断点、单步执行、看调用栈 |
| Network | 看请求/响应、Timing 分析慢请求、过滤 XHR |

### 2.2 调试技巧

```js
console.table(users);          // 表格化输出
console.dir(obj);              // 展开对象结构
debugger;                      // 代码里埋断点
// Sources 面板条件断点：右键行号 → Add conditional breakpoint
```

!!! danger "死角 2：生产别留 debugger / console.log"
    上线前清掉调试语句，或用 [工程化](../engineering/index.md) 的构建压缩（生产会自动剔除 `console` 视配置）。敏感信息（token）**绝不**打进 `console`。

!!! warning "安全关联"
    DevTools 的 `Application` 面板可看 `localStorage`/`Cookie`——敏感 token 别存 `localStorage`（XSS 可偷），见 [前端安全全集](../security/index.md)（OWASP）。

---

## 三、包管理：npm / pnpm / yarn

### 3.1 核心命令

```bash
npm init -y                   # 初始化 package.json
npm install vue               # 装依赖（写入 dependencies）
npm install -D vite           # 装开发依赖
npm run dev                   # 跑 scripts 里的 dev
pnpm install                  # pnpm：快、省磁盘（硬链接）
```

### 3.2 npm vs pnpm（选型）

| 工具 | 特点 |
|------|------|
| npm | 默认、生态最广；`node_modules` 嵌套 |
| pnpm | 快、磁盘占用低、严格（幽灵依赖报错）；现代项目首选 |
| yarn | 经典替代，已渐被 pnpm 取代 |

!!! danger "死角 3：幽灵依赖（phantom dependency）"
    `package.json` 没写但能 `import` 到的包（靠 npm 扁平提升）。pnpm 默认禁止，暴露真实依赖关系，避免"删了别人依赖我代码挂掉"。详见 [工程化·包管理](../engineering/index.md)。

!!! danger "死角 4：锁文件必须提交"
    `package-lock.json` / `pnpm-lock.yaml` 锁定版本，保证团队/CI 装同一版本。**别加进 `.gitignore`**，否则"在我机上能跑"横行。

---

## 四、开发素养自检清单

- [ ] 会 clone / add / commit / pull --rebase / push
- [ ] 知道 `push --force` 的危险，走分支+评审
- [ ] 会用 DevTools 断点调试、看 Network Timing
- [ ] 知道生产环境清 debugger/console
- [ ] 会用 npm/pnpm 装依赖、区分 devDependencies
- [ ] 提交锁文件、理解幽灵依赖

> 衔接：构建/Monorepo/CI 见 [工程化](../engineering/index.md)；约定式提交与 Commitlint 见同篇；安全存储见 [前端安全全集](../security/index.md)。

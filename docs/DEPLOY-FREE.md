# 免费静态托管部署指引（国内可访问）

本知识库为 mkdocs 静态站点，构建产物在 `site/` 目录。以下三家平台均**免费**且对国内访问相对友好，
均通过连接 GitHub 仓库实现 push 自动部署。

> 统一构建命令（CI 与各平台一致，封装在 `package.json` 的 `build:site`）：
> `npm ci && npm run vendor:sync && mkdocs build --strict`
> 输出目录：`site`

---

## 方案 A：GitHub Actions 一处 push 四处上线（推荐）

仓库已内置 `.github/workflows/deploy.yml`，**构建一次产物**，并行部署到：

- GitHub Pages（Actions 内置）
- Cloudflare Pages（wrangler CLI）
- Vercel（vercel CLI）
- Netlify（netlify-cli）

各平台 Job 通过 `if: ${{ env.XXX != '' }}` 控制：未配置对应 Secret 时自动跳过，不会报错，
因此你可以先只配置一家，逐步开启。

### 需要配置的 Secrets（仓库 Settings → Secrets and variables → Actions → New repository secret）

| Secret 名 | 用途 | 获取位置 |
|-----------|------|----------|
| `CF_API_TOKEN` | Cloudflare API Token（需 Pages:Edit 权限） | dash.cloudflare.com → My Profile → API Tokens |
| `CF_ACCOUNT_ID` | Cloudflare 账户 ID | 右侧账号首页 |
| `CF_PROJECT_NAME` | Cloudflare Pages 项目名 | Pages 项目设置 |
| `VERCEL_TOKEN` | Vercel 访问令牌 | vercel.com → Settings → Tokens |
| `VERCEL_ORG_ID` | 团队 ID | `npx vercel teams ls` 或项目设置 |
| `VERCEL_PROJECT_ID` | 项目 ID | Vercel 项目 Settings → General |
| `NETLIFY_AUTH_TOKEN` | Netlify 个人访问令牌 | app.netlify.com → User settings → Applications |
| `NETLIFY_SITE_ID` | Netlify Site ID | 站点 Settings → Site details |

> 只需配置你想启用的平台对应的 Secret 即可，未配置的 Job 会自动跳过。

---

## 方案 B：各平台后台直接连 GitHub 自动部署（备选/独立）

若不想用 Actions 统一部署，也可在各平台后台连接本仓库，构建命令与上面一致。

### 1. Cloudflare Pages（国内速度通常最快最稳）

1. 登录 https://dash.cloudflare.com/ → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. 授权并选择仓库 `1079161148/knowledge-front-yuying`
3. 构建设置：
   - **Framework preset**: `None`
   - **Build command**: `npm ci && npm run vendor:sync && mkdocs build --strict`
   - **Build output directory**: `site`
4. 部署完成后获得 `https://knowledge-front-yuying.pages.dev`
5. 也可使用 `wrangler.toml`（仓库已提供），通过 `npx wrangler pages deploy site` 手动部署

### 2. Vercel

1. 登录 https://vercel.com/ → **Add New** → **Project** → 导入 GitHub 仓库
2. 构建设置：
   - **Framework Preset**: `Other`
   - **Build Command**: `npm ci && npm run vendor:sync && mkdocs build --strict`
   - **Output Directory**: `site`
3. 仓库根已包含 `vercel.json`，Vercel 会自动读取
4. 部署后获得 `https://knowledge-front-yuying.vercel.app`

### 3. Netlify

1. 登录 https://app.netlify.com/ → **Add new site** → **Import an existing project** → 连接 GitHub
2. 构建设置：
   - **Build command**: `npm ci && npm run vendor:sync && mkdocs build --strict`
   - **Publish directory**: `site`
3. 仓库根已包含 `netlify.toml`，Netlify 会自动读取
4. 部署后获得 `https://<随机>.netlify.app`

---

## 备注

- 三家均免费、支持自动 HTTPS、全球 CDN、push 触发部署。
- 国内访问速度参考：Cloudflare Pages ≈ 最快最稳；Vercel / Netlify 次之（个别地区偶尔限速）。
- 用方案 A 时，GitHub Pages 由 Actions 部署，三家由各自 CLI 部署，互不冲突。
- 如需自定义域名，三家都支持绑定（Cloudflare / Vercel / Netlify 后台 Custom domains）。

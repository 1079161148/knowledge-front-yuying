# 免费静态托管部署指引（国内可访问）

本知识库为 mkdocs 静态站点，构建产物在 `site/` 目录。以下三家平台均**免费**且对国内访问相对友好，
均通过连接 GitHub 仓库实现 push 自动部署。

> 通用构建命令（三家一致）：
> `npm install && npm run vendor:sync && mkdocs build --strict`
> 输出目录：`site`

---

## 1. Cloudflare Pages（国内速度通常最快最稳）

1. 登录 https://dash.cloudflare.com/ → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. 授权并选择仓库 `1079161148/knowledge-front-yuying`
3. 构建设置：
   - **Framework preset**: `None`
   - **Build command**: `npm install && npm run vendor:sync && mkdocs build --strict`
   - **Build output directory**: `site`
4. 部署完成后获得 `https://knowledge-front-yuying.pages.dev`（可在 Custom domains 绑自己的域名）
5. 后续每次 push 自动重新部署

> 也可使用 `wrangler.toml`（仓库已提供），通过 `npx wrangler pages deploy site` 手动部署。

---

## 2. Vercel

1. 登录 https://vercel.com/ → **Add New** → **Project** → 导入 GitHub 仓库
2. 构建设置：
   - **Framework Preset**: `Other`
   - **Build Command**: `npm install && npm run vendor:sync && mkdocs build --strict`
   - **Output Directory**: `site`
3. 仓库根已包含 `vercel.json`，Vercel 会自动读取，无需手动填
4. 部署后获得 `https://knowledge-front-yuying.vercel.app`
5. 后续每次 push 自动重新部署

---

## 3. Netlify

1. 登录 https://app.netlify.com/ → **Add new site** → **Import an existing project** → 连接 GitHub
2. 构建设置：
   - **Build command**: `npm install && npm run vendor:sync && mkdocs build --strict`
   - **Publish directory**: `site`
3. 仓库根已包含 `netlify.toml`，Netlify 会自动读取
4. 部署后获得 `https://<随机>.netlify.app`
5. 后续每次 push 自动重新部署

---

## 备注

- 三家均免费、支持自动 HTTPS、全球 CDN、push 触发部署。
- 国内访问速度参考：Cloudflare Pages ≈ 最快最稳；Vercel / Netlify 次之（个别地区偶尔限速）。
- GitHub Pages 仍保留（`.github/workflows/deploy.yml`），作为备用镜像。
- 如需自定义域名，三家都支持绑定（Cloudflare / Vercel / Netlify 后台 Custom domains）。

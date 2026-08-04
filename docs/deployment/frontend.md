# 前端部署指南：Vue / React / 静态站点

> 面向：纯前端项目——Vue 3 SPA、React SPA、Vite 构建的静态站点、甚至纯 HTML 文件。本文覆盖 **Vercel（推荐新手）、Netlify、Nginx、Docker** 四种方式。

---

## 一、构建你的项目

部署前需要把开发态代码打包为生产可用的静态文件：

```bash
# Vue 3 + Vite
npm run build      # 产物在 dist/

# React + Vite
npm run build      # 产物在 dist/

# React + CRA
npm run build      # 产物在 build/

# 纯静态（直接部署文件夹）
# 无需构建
```

!!! warning "构建前先确认路径配置"
    如果是部署到子路径（如 `https://example.com/my-app/`），需要配置 `base`：

    **Vite (`vite.config.js`)**：
    ```js
    export default defineConfig({
      base: '/my-app/',   // 部署到子路径
    })
    ```

    **CRA (`package.json`)**：
    ```json
    { "homepage": "https://example.com/my-app" }
    ```

    如果部署到根域名（`https://example.com/`），`base` 设为 `'/'` 或省略默认值。

---

## 二、方式 1：Vercel（推荐新人）

Vercel 是部署前端项目最简单的平台，免费、自带 CDN、自动 HTTPS、关联 Git 后推送即部署。

### 2.1 部署步骤

1. 注册 [Vercel](https://vercel.com)，建议用 GitHub 账号登录
2. 把项目推到 GitHub（公开或私有仓库）：

```bash
git init
git add .
git commit -m "first commit"
git remote add origin https://github.com/你的用户名/项目名.git
git branch -M main
git push -u origin main
```

3. 在 Vercel 控制台点击 **Add New** → **Project**
4. 选择你的 GitHub 仓库
5. Vercel 自动识别框架（Vite/React），填写构建配置：

| 配置项 | Vite | CRA |
|--------|------|-----|
| Framework Preset | Vite | Create React App |
| Build Command | `npm run build` | `npm run build` |
| Output Directory | `dist` | `build` |

6. 点击 **Deploy**，等待 30 秒

### 2.2 自定义域名

1. Vercel 项目 → Settings → Domains
2. 添加你的域名（如 `www.example.com`）
3. 在域名 DNS 中添加 CNAME 记录指向 `cname.vercel-dns.com`

### 2.3 SPA 路由配置（重要）

SPA 使用前端路由（Vue Router / React Router），需要在 Vercel 处理 404 回退。

在项目根目录创建 `vercel.json`：

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### 2.4 环境变量

Vercel 项目 → Settings → Environment Variables，添加：

```
VITE_API_BASE = https://api.example.com    # Vite 项目用 VITE_ 前缀
REACT_APP_API_BASE = https://api.example.com  # CRA 项目用 REACT_APP_ 前缀
```

!!! danger "不要把密钥暴露在前端环境变量"
    `VITE_*` 和 `REACT_APP_*` 开头的变量会被打包进前端代码，任何人打开浏览器都能看到。真正的密钥放后端。

---

## 三、方式 2：Netlify

### 3.1 部署步骤

1. 注册 [Netlify](https://netlify.com)
2. 点击 **Add new site** → **Import an existing project** → GitHub
3. 选择仓库，填写构建配置：

| 配置项 | 值 |
|--------|-----|
| Build command | `npm run build` |
| Publish directory | `dist` 或 `build` |

4. 点击 **Deploy site**

### 3.2 SPA 路由配置

在 `public/` 目录下创建 `_redirects` 文件：

```
/*    /index.html   200
```

或在项目根目录创建 `netlify.toml`：

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## 四、方式 3：Nginx 手动部署（VPS/云服务器）

### 4.1 前提

- 已有一台云服务器（阿里云 / 腾讯云 / AWS 等）
- 已安装 Nginx（`apt install nginx` 或 `yum install nginx`）
- 域名已解析到服务器 IP

### 4.2 上传静态文件

将 `dist/` 目录上传到服务器（假设放 `/var/www/my-site/`）：

```bash
# 本地打包
npm run build

# 上传到服务器（rsync 更好，但 scp 也能用）
scp -r dist/* root@你的服务器IP:/var/www/my-site/
```

### 4.3 Nginx 配置

创建 `/etc/nginx/sites-available/my-site`（或 `/etc/nginx/conf.d/my-site.conf`）：

```nginx
server {
    listen 80;
    server_name example.com www.example.com;

    root /var/www/my-site;
    index index.html;

    # gzip 压缩（减小传输体积）
    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    gzip_min_length 256;
    gzip_comp_level 6;

    # 静态资源缓存（1年，因为 Vite/Webpack 产物体带了 hash）
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA 路由回退：找不到文件时返回 index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    # CSP 按需配置，见 security/csp.md
}
```

启用配置并重载：

```bash
ln -s /etc/nginx/sites-available/my-site /etc/nginx/sites-enabled/
nginx -t              # 检查配置语法
systemctl reload nginx
```

### 4.4 配置 HTTPS（Let's Encrypt 免费证书）

```bash
# 安装 certbot
apt install certbot python3-certbot-nginx

# 自动配置 SSL
certbot --nginx -d example.com -d www.example.com

# 设置自动续期
systemctl enable certbot.timer
```

---

## 五、方式 4：Docker + Nginx

适合容器化部署、配合 CI/CD。

### 5.1 创建多阶段 Dockerfile

项目根目录新建 `Dockerfile`：

```dockerfile
# ---------- 阶段 1：构建 ----------
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---------- 阶段 2：运行 ----------
FROM nginx:alpine
# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html
# 复制 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 5.2 Nginx 配置文件

项目根目录新建 `nginx.conf`：

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    gzip_min_length 256;

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
}
```

### 5.3 构建并运行

```bash
docker build -t my-frontend .
docker run -d -p 8080:80 --name my-frontend my-frontend
```

访问 `http://服务器IP:8080`。

---

## 六、方式 5：GitHub Pages

适合个人项目、文档站点、Demo 展示。

### 6.1 配置

**Vite (`vite.config.js`)**：

```js
export default defineConfig({
  base: '/仓库名/',
})
```

### 6.2 使用 GitHub Actions 自动部署

在项目 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - id: deployment
        uses: actions/deploy-pages@v4
```

推送代码后，GitHub Actions 自动部署。项目 Settings → Pages 中会显示访问地址。

---

## 七、部署后验证清单

| 验证项 | 方法 |
|--------|------|
| 页面能打开 | 浏览器访问域名/URL |
| 路由切换正常 | 点导航、刷新页面确认不 404 |
| API 能调通 | 检查 Network 面板 |
| HTTPS 生效 | 地址栏显示锁图标 |
| 静态资源加载正常 | DevTools Network 面板无 404 |
| 安全头已配置 | `curl -I https://你的域名` 检查响应头 |
| 性能评分 | Lighthouse 跑一下 |

---

## 八、安全要点（前端部署专属）

| 要点 | 说明 |
|------|------|
| `.env` 不进构建 | Vite 的 `VITE_*` 变量会打包进 JS——不要放密钥 |
| sourcemap 不上传生产 | `vite.config.js` 中 `build.sourcemap: false`（默认） |
| CSP 头 | 限制 script 来源，防 XSS，见 [CSP](../security/csp.md) |
| 子资源完整性（SRI） | 加载外部 CDN 脚本时加 `integrity` 属性 |
| 定期依赖更新 | `npm outdated` + `npm audit` 检查漏洞，见 [供应链安全](../security/supply-chain.md) |

---

> **下一篇**：有后端 API 一起部署 → [全栈组合部署方案](fullstack-combinations.md) | **安全基础** → [安全与性能](../security/index.md)

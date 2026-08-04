# 全栈组合部署方案

> 面向：前后端分离项目——把前端（Vue/React）和后端（Node/Nest/Java）一起部署到同一台服务器或分别托管。本文覆盖 6 种主流组合。

---

## 一、组合速查表

| 组合 | 前端部署 | 后端部署 | API 代理方式 | 难度 |
|------|---------|---------|-------------|:--:|
| Vue + Express | Vercel/Netlify 或 Nginx 静态 | VPS + PM2 | Nginx proxy_pass 或 Vite proxy（生产用 Nginx） | ⭐⭐ |
| React + NestJS | Vercel/Netlify 或 Nginx 静态 | VPS + PM2 或 Docker | Nginx proxy_pass | ⭐⭐⭐ |
| Vue + Spring Boot | Nginx 静态 | VPS + Systemd 或 Docker | Nginx proxy_pass | ⭐⭐⭐ |
| React + Spring Boot | Nginx 静态 | VPS + Systemd 或 Docker | Nginx proxy_pass | ⭐⭐⭐ |
| Vue + Node.js (同仓库) | Nginx 静态 + Node 动态 | Docker Compose 一体部署 | Nginx 容器内代理 | ⭐⭐⭐ |
| React + NestJS (同仓库) | Nginx 静态 + Nest 动态 | Docker Compose 一体部署 | Nginx 容器内代理 | ⭐⭐⭐ |

---

## 二、通用架构

```
用户浏览器
    │
    ▼
┌─────────────────────────────────────┐
│  Nginx (80/443)                     │
│                                     │
│  /          → 前端静态文件 (dist/)   │
│  /api/*     → 后端 API (127.0.0.1:3000/8080) │
│  /uploads/* → 静态资源直接返回       │
└─────────────────────────────────────┘
         │                    │
         ▼                    ▼
  前端静态文件 (/var/www/)  后端 API (PM2/Systemd 管理)
```

### 核心原则

1. **Nginx 作为统一入口**：前端静态文件 + 后端 API 都经 Nginx 对外
2. **后端不直接暴露**：后端只监听 `127.0.0.1`，外部只能经 Nginx 访问
3. **一个域名一个站点**：`example.com` → 前端，`example.com/api/*` → 后端

---

## 三、方案一：Vue 3 + Express（最轻量）

### 3.1 项目结构

```
my-fullstack-app/
├── client/              # Vue 3 前端（Vite）
│   ├── src/
│   ├── vite.config.js
│   └── package.json
├── server/              # Express 后端
│   ├── src/
│   │   └── index.js
│   └── package.json
├── nginx.conf
├── docker-compose.yml
└── .env
```

### 3.2 前端 Vite 配置（API 代理开发/生产）

```js
// client/vite.config.js
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',   // 开发时代理到后端
        changeOrigin: true,
      }
    }
  }
})
```

!!! warning "Vite proxy 只用于开发"
    生产环境不能用 Vite proxy！`npm run build` 后只有静态文件，需要在 Nginx 配置真实代理。

### 3.3 Express 后端关键配置

```js
// server/src/index.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,   // 生产环境写死前端域名
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use('/api/', limiter);

// API 路由（统一加 /api 前缀）
app.use('/api', require('./routes'));

// 优雅退出
const server = app.listen(3000, '127.0.0.1', () => {
  console.log('API running on http://127.0.0.1:3000');
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
```

### 3.4 Nginx 统一配置

```nginx
server {
    listen 80;
    server_name example.com;

    # 前端静态文件
    root /var/www/client;
    index index.html;

    # SPA 路由回退
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_read_timeout 60s;
        client_max_body_size 10m;
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=31536000" always;
}
```

### 3.5 Docker Compose 一体部署

```yaml
version: '3.8'
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - ./client/dist:/var/www/client   # 挂载前端构建产物
    depends_on:
      - server

  server:
    build:
      context: ./server
    environment:
      NODE_ENV: production
      FRONTEND_URL: https://example.com
      DB_URL: ${DB_URL}
      JWT_SECRET: ${JWT_SECRET}
    expose:
      - "3000"
    restart: unless-stopped
```

---

## 四、方案二：React + NestJS

### 4.1 关键差异

| 对比项 | React + NestJS | Vue + Express |
|--------|---------------|---------------|
| 前端 framework preset | Vite (React) / CRA | Vite (Vue) |
| 后端 TypeScript 同步 | 前后端都用 TS，可共享类型 | 后端用 JS 或 TS |
| DTO 共享 | 提取 `shared/dto.ts` 统一类型 | 各自定义 |
| 认证方案 | JWT（后端签、前端存、请求带） | 同左 |

### 4.2 共享类型包

```
packages/
├── shared/                 # 共享类型
│   ├── package.json
│   └── src/
│       └── dto.ts
├── client/                 # React 前端
└── server/                 # NestJS 后端
```

```typescript
// packages/shared/src/dto.ts
export interface LoginDto {
  email: string;
  password: string;
}

export interface UserDto {
  id: number;
  email: string;
  name: string;
}
```

### 4.3 Nginx 配置（与方案一相同结构，仅后端端口不同）

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:3000;    # NestJS 默认 3000
}
```

---

## 五、方案三：Vue/React + Spring Boot

### 5.1 关键差异

| 对比项 | Java 后端 | Node.js 后端 |
|--------|----------|-------------|
| 启动方式 | `java -jar app.jar` | `node dist/main.js` |
| 进程管理 | Systemd service | PM2 |
| 默认端口 | 8080 | 3000 |
| 构建 | `mvn package` | `npm run build` |
| 内存占用 | 200MB+ | 50-100MB |

### 5.2 Nginx 配置

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8080;    # Spring Boot 默认 8080
}
```

### 5.3 Spring Boot CORS 配置

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins("https://你的前端域名.com")
            .allowedMethods("GET", "POST", "PUT", "DELETE")
            .allowCredentials(true);
    }
}
```

---

## 六、方案四：Monorepo 单仓库（前端 + 后端 + Nginx 一体）

适合个人项目、小型团队。

```
fullstack-app/
├── package.json                    # root，用 npm workspaces
├── packages/
│   ├── client/                     # 前端
│   │   ├── package.json
│   │   └── vite.config.js
│   └── server/                     # 后端
│       ├── package.json
│       └── tsconfig.json
├── nginx.conf
├── Dockerfile
├── docker-compose.yml
└── .env
```

```json
// package.json (root)
{
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "dev:client": "npm -w client run dev",
    "dev:server": "npm -w server run dev",
    "dev": "concurrently \"npm run dev:client\" \"npm run dev:server\"",
    "build": "npm -w client run build && npm -w server run build"
  }
}
```

### Dockerfile（多服务合一，Nginx 入口）

```dockerfile
# 前端构建
FROM node:20-alpine AS client-builder
WORKDIR /app
COPY packages/client .
RUN npm ci && npm run build

# 后端构建
FROM node:20-alpine AS server-builder
WORKDIR /app
COPY packages/server .
RUN npm ci && npm run build

# 最终 Nginx 镜像
FROM nginx:alpine
COPY --from=client-builder /app/dist /var/www/client
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

---

## 七、CI/CD 自动化部署

### 7.1 GitHub Actions 完整流程

`.github/workflows/deploy.yml`：

```yaml
name: Deploy Fullstack App
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      # 前端测试
      - run: cd client && npm ci && npm run test --if-present
      # 后端测试
      - run: cd server && npm ci && npm run test --if-present

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # 构建前端
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: cd client && npm ci && npm run build
      # 构建后端
      - run: cd server && npm ci && npm run build
      # 部署到服务器
      - name: Deploy to VPS
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_KEY }}
          source: "client/dist/*,server/dist/*"
          target: "/opt/app/"
      - name: Restart services
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /opt/app/server && npm ci --production
            pm2 reload all
            sudo nginx -s reload
```

---

## 八、安全清单（全栈组合专属）

| 检查项 | 说明 |
|--------|------|
| 前后端域名统一 | 如果有条件，前后端用同一域名（`/api` 代理），避免 CORS 配置复杂化 |
| API 请求签名 | 敏感操作加签名验证（防重放攻击） |
| JWT 过期策略 | Access Token 短（15 分钟）、Refresh Token 长（7 天），分别处理 |
| CORS 白名单 | 前后端分离时，后端 CORS 只允许前端域名 |
| 前端不存敏感 token | localStorage 存 JWT 有 XSS 风险，优先 HttpOnly Cookie（同域） |
| API 版本管理 | URL 加 `/api/v1/` 前缀，方便后续升级 |
| 静态资源缓存 | 前端带 hash 的资源长期缓存（1 年），`index.html` 不缓存 |
| 日志分离 | 前端日志用 RUM（Real User Monitoring），后端用结构化日志 |

---

## 九、方案对比决策

```
                    你的前端用什么？
                 /                  \
            Vue 3                 React
           /     \              /      \
    Node.js    Spring Boot   Node.js  Spring Boot
    后端        后端           后端      后端
      │           │              │          │
      ▼           ▼              ▼          ▼
   方案一      方案三         方案二      方案三
 (最简单)   (企业级)      (TS 全栈)  (企业级)
```

| 场景 | 推荐方案 | 理由 |
|------|---------|------|
| 个人项目 / 练手 | Vue + Express | 最轻量、最快上手 |
| TS 全栈、类型安全 | React + NestJS | 前后端共享 DTO，类型贯通 |
| 企业级 / 招工作 | Vue/React + Spring Boot | 国内 Java 岗位最多 |
| 需要 SSR | Next.js / Nuxt 3 | 一体式全栈框架 |

---

> **相关章节**
> - 各框架独立部署 → [前端部署](frontend.md) | [Node.js](backend-node.md) | [NestJS](backend-nestjs.md) | [Java](backend-java.md)
> - SSR 全栈部署 → [Next.js 实战](../fullstack/nextjs-from-scratch.md) | [Nuxt 3 实战](../fullstack/nuxt3-from-scratch.md)

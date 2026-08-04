# Node.js / Express 后端部署指南

> 面向：Node.js 后端 API 服务——Express / Koa / Fastify，部署到 VPS、Docker、或托管平台。

---

## 一、部署前准备

### 1.1 项目结构确认

确保你的 Node.js 项目具备以下要素：

```
my-api/
├── src/
│   ├── index.js          # 入口文件
│   ├── routes/
│   └── middleware/
├── package.json
├── .env.example           # 环境变量模板（不含真实值）
├── .gitignore             # 含 node_modules/ .env dist/
└── ecosystem.config.js    # PM2 配置（可选）
```

### 1.2 关键检查

```bash
# 确认本地能启动
npm install
npm start          # 或 npm run dev
# 测试 API 能正常响应
curl http://localhost:3000/api/health
```

### 1.3 启动脚本规范化

`package.json` 中确保有生产启动命令：

```json
{
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  }
}
```

!!! warning "生产环境不要用 nodemon / ts-node"
    `nodemon` 有文件监听开销，`ts-node` 即时编译慢。生产环境用 `node` + 预编译好的 JS。

---

## 二、方式 1：VPS + PM2（最经典）

### 2.1 服务器环境初始化

```bash
# SSH 登录服务器
ssh root@你的服务器IP

# 安装 Node.js（使用 NodeSource）
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证
node -v   # v20.18.x
npm -v    # 10.x.x
```

### 2.2 上传项目

```bash
# 方法 A：从本地 scp（简单但不适合频繁更新）
npm run build --if-present   # TypeScript 项目先编译
scp -r . root@服务器IP:/opt/my-api/

# 方法 B：服务器上 git clone（推荐，方便更新）
ssh root@服务器IP
cd /opt
git clone https://github.com/你的用户名/my-api.git
cd my-api
npm ci --production     # 只装生产依赖，更快
```

### 2.3 使用 PM2 管理进程

```bash
# 全局安装 PM2
npm install -g pm2

# 启动应用
pm2 start src/index.js --name my-api

# 设置开机自启
pm2 startup systemd
pm2 save

# 常用命令
pm2 list            # 查看所有进程
pm2 logs my-api     # 查看日志
pm2 restart my-api  # 重启
pm2 stop my-api     # 停止
pm2 reload my-api   # 零停机重载（需要 cluster 模式）
```

### 2.4 PM2 高级配置 `ecosystem.config.js`

```js
module.exports = {
  apps: [{
    name: 'my-api',
    script: './src/index.js',
    instances: 'max',           // 充分利用多核 CPU
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    // 零停机重载准备信号
    listen_timeout: 5000,
    kill_timeout: 3000,
    // 内存超限自动重启
    max_memory_restart: '500M',
    // 日志配置
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    // 优雅退出（处理 SIGTERM）
    wait_ready: true,
    shutdown_with_message: true,
  }]
};
```

### 2.5 后端代码优雅退出

`src/index.js` 中处理 SIGTERM：

```js
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// PM2 发 SIGTERM 时优雅关闭
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
  // 超时 10 秒强制退出
  setTimeout(() => process.exit(1), 10000);
});
```

---

## 三、方式 2：Nginx 反向代理

PM2 让 Node.js 进程常驻，Nginx 对外提供 HTTP 入口。

### 3.1 安装 Nginx

```bash
sudo apt update
sudo apt install nginx -y
```

### 3.2 Nginx 反向代理配置

`/etc/nginx/sites-available/my-api`：

```nginx
server {
    listen 80;
    server_name api.example.com;

    # 请求体大小限制（防止大文件攻击）
    client_max_body_size 10m;

    # 安全头
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # 限流（每 IP 每秒 10 个请求，突发 20）
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;

    # 代理到 Node.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态文件直接由 Nginx 返回（不经过 Node.js）
    location /uploads/ {
        alias /opt/my-api/uploads/;
        expires 30d;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/my-api /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 3.3 HTTPS 配置

```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d api.example.com
systemctl enable certbot.timer
```

---

## 四、方式 3：Docker 部署

### 4.1 Dockerfile（多阶段构建）

```dockerfile
# ---------- 构建阶段 ----------
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build --if-present

# ---------- 运行阶段 ----------
FROM node:20-alpine
RUN apk add --no-cache dumb-init   # 正确处理信号
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --production && npm cache clean --force
USER node
EXPOSE 3000
CMD ["dumb-init", "node", "dist/index.js"]
```

### 4.2 `docker-compose.yml`

```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DB_HOST=db          # 容器间用服务名通信
      - DB_PASSWORD=${DB_PASSWORD}
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 3s
      retries: 3

  db:
    image: postgres:16-alpine
    volumes:
      - pg_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: mydb
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 5

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - api

volumes:
  pg_data:
```

### 4.3 .env 文件管理

```
# .env（本地，不进 Git）
DB_PASSWORD=local_dev_password

# .env.example（提交到 Git，不含真实值）
DB_PASSWORD=change_me
```

```bash
# 服务器上，从 .env.example 复制
cp .env.example .env
# 然后手动填入真实密码
vim .env
```

---

## 五、方式 4：托管平台（Railway / Render）

### 5.1 Railway

1. 注册 [Railway](https://railway.app)
2. New Project → Deploy from GitHub repo
3. Railway 自动检测 Node.js，设置 Start Command：`node src/index.js`
4. 在 Variables 页面添加环境变量
5. 自动获得 `*.up.railway.app` 域名

### 5.2 Render

1. 注册 [Render](https://render.com)
2. New → Web Service → 关联 GitHub
3. 配置：
   - Build Command: `npm ci && npm run build --if-present`
   - Start Command: `node dist/index.js`
4. 环境变量在 Environment 页面添加

---

## 六、安全清单（后端部署专属）

### 6.1 服务器层面

| 检查项 | 命令 / 方法 |
|--------|------------|
| 关闭密码登录，只用密钥 | `/etc/ssh/sshd_config`: `PasswordAuthentication no` |
| 配置防火墙 | `ufw allow 22/tcp`; `ufw allow 80,443/tcp`; `ufw enable` |
| 禁止 root 直接 SSH | `/etc/ssh/sshd_config`: `PermitRootLogin no` |
| 非 root 用户运行应用 | `useradd -m app && su app` 或 Dockerfile `USER node` |
| 定期更新系统 | `apt update && apt upgrade -y` |

### 6.2 应用层面

| 检查项 | 实现 |
|--------|------|
| Helmet 安全头 | `npm install helmet` → `app.use(helmet())` |
| 速率限制 | `npm install express-rate-limit` → 每 IP 每 15 分钟 100 次 |
| 请求体大小限制 | `app.use(express.json({ limit: '10mb' }))` |
| CORS 白名单 | 只能是已知域名，不能用 `*` |
| 输入验证 | 用 `zod` / `joi` 校验所有用户输入 |
| SQL 注入防护 | 始终使用参数化查询或 ORM |
| 日志脱敏 | 不打密码、身份证、手机号到日志 |
| 依赖审计 | CI 中加 `npm audit --audit-level=high`（如有则阻断） |

### 6.3 环境与密钥管理

```
❌ 错误做法
const API_KEY = 'sk-abc123...'   // 硬编码在代码里
.env 文件提交到 Git

✅ 正确做法
密钥放在服务器的 .env 中，不进 Git
CI/CD 从 GitHub Secrets / Vault 注入
生产环境 .env 与开发环境 .env 分离
```

---

## 七、监控与日志

### 7.1 基础监控

```bash
# PM2 自带监控
pm2 monit

# 系统资源
htop
df -h    # 磁盘
free -m  # 内存
```

### 7.2 日志管理

```js
// 使用 pino（高性能结构化日志）
const pino = require('pino');
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty' }
    : undefined,
});

logger.info({ route: '/api/users', method: 'GET' }, 'request received');
```

### 7.3 健康检查端点

```js
router.get('/api/health', async (req, res) => {
  const checks = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    db: await checkDatabaseConnection(),
    memory: process.memoryUsage(),
  };
  const allOk = Object.values(checks).every(v => v !== false);
  res.status(allOk ? 200 : 503).json(checks);
});
```

---

> **相关章节**
> - 前端 + 后端一起部署 → [全栈组合部署方案](fullstack-combinations.md)
> - Jest 测试 + CI/CD → [测试体系](../engineering/testing/index.md) | [CI/CD](../engineering/cicd/index.md)
> - 安全深入 → [前端安全全集](../security/index.md)

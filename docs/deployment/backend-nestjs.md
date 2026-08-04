# NestJS 后端部署指南

> 面向：NestJS 后端 API 服务——TypeORM/Prisma + PostgreSQL/MySQL，部署到 VPS、Docker、K8s。

---

## 一、部署前准备

### 1.1 确认编译通过

```bash
npm run build          # 编译 TypeScript → dist/
npm run start:prod     # 本地验证生产模式
```

### 1.2 依赖区分

```json
{
  "dependencies": {
    "@nestjs/core": "^10.0.0",       // 运行时需要
    "@nestjs/typeorm": "^10.0.0",
    "typeorm": "^0.3.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.0",
    "pg": "^8.0.0"                    // 数据库驱动（生产需要）
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",        // 仅开发需要
    "@types/node": "^20.0.0"
  }
}
```

!!! danger "注意"
    `@nestjs/cli`、`@types/*` 放在 `devDependencies`，不要在运行环境中装这些。`pg`（PostgreSQL 驱动）或 `mysql2` 要放在 `dependencies`。

---

## 二、方式 1：VPS + PM2（主流方案）

### 2.1 构建

```bash
npm ci              # 安装依赖
npm run build        # TypeScript 编译到 dist/
# 确认 dist/main.js 存在
```

### 2.2 PM2 启动

```bash
npm install -g pm2

pm2 start dist/main.js --name nest-api --node-args="--max-old-space-size=512"

# 集群模式（利用多核）
pm2 start dist/main.js --name nest-api -i max

pm2 startup systemd
pm2 save
```

### 2.3 优雅关闭

`main.ts` 中处理关闭信号：

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 处理 SIGTERM（PM2 stop/reload 发送此信号）
  app.enableShutdownHooks();

  await app.listen(3000);
  console.log('NestJS running on port 3000');
}
bootstrap();
```

### 2.4 PM2 配置 `ecosystem.config.js`

```js
module.exports = {
  apps: [{
    name: 'nest-api',
    script: 'dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    node_args: '--max-old-space-size=512',
    max_memory_restart: '500M',
    error_file: './logs/err.log',
    out_file: './logs/out.log',

    // NestJS 优雅关闭需要时间处理数据库连接等
    kill_timeout: 10000,
    listen_timeout: 10000,
    shutdown_with_message: true,
    wait_ready: true,
  }]
};
```

---

## 三、方式 2：Nginx 反向代理

```nginx
server {
    listen 80;
    server_name api.example.com;

    client_max_body_size 10m;

    # 安全头
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=31536000" always;

    # IP 限流
    limit_req_zone $binary_remote_addr zone=nest_limit:10m rate=10r/s;
    limit_req zone=nest_limit burst=20 nodelay;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket（NestJS Gateways 需要）
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;

        # 超时配置
        proxy_read_timeout 60s;
        proxy_connect_timeout 10s;
    }
}
```

---

## 四、方式 3：Docker 部署

### 4.1 优化 NestJS 的 Dockerfile

```dockerfile
# ---------- 构建阶段 ----------
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---------- 生产阶段 ----------
FROM node:20-alpine
RUN apk add --no-cache dumb-init
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
USER node
EXPOSE 3000
CMD ["dumb-init", "node", "dist/main.js"]
```

### 4.2 Docker Compose 全栈示例

```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DB_HOST: db
      DB_PORT: 5432
      DB_USERNAME: ${DB_USERNAME}
      DB_PASSWORD: ${DB_PASSWORD}
      DB_DATABASE: ${DB_DATABASE}
      JWT_SECRET: ${JWT_SECRET}
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 5s
      retries: 3

  db:
    image: postgres:16-alpine
    volumes:
      - pg_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql  # 自动建表
    environment:
      POSTGRES_DB: ${DB_DATABASE}
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USERNAME}"]
      interval: 5s
      timeout: 3s
      retries: 5
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - ./certbot/conf:/etc/letsencrypt
    depends_on:
      - api

volumes:
  pg_data:
  redis_data:
```

### 4.3 NestJS 配置适配 Docker

`src/config/database.config.ts`：

```typescript
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  // 生产环境谨慎使用 synchronize，建议用 migration
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV !== 'production',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  // 连接池配置（生产建议值）
  extra: {
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
};
```

---

## 五、TypeORM Migration（生产环境必备）

生产环境不建议用 `synchronize: true`，用 Migration 管理数据库结构变更。

```bash
# 生成 migration 文件
npm run typeorm migration:generate -- -d src/data-source.ts src/migrations/AddUserTable

# 手动执行 migration
npm run typeorm migration:run -- -d src/data-source.ts

# 在 NestJS 启动时自动执行（推荐）
```

`src/app.module.ts` 中配置：

```typescript
TypeOrmModule.forRoot({
  ...databaseConfig,
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  migrationsRun: true,  // 启动时自动执行
})
```

---

## 六、安全清单（NestJS 专属）

### 6.1 内置安全工具

```typescript
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Helmet 安全头
  app.use(helmet());

  // CORS 白名单（不用 *）
  app.enableCors({
    origin: ['https://你的前端域名.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  });

  // 全局速率限制
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 分钟
    max: 100,                     // 每个 IP 上限 100 次
    standardHeaders: true,
    legacyHeaders: false,
  }));

  // 全局校验管道（防御注入）
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,              // 剥离不需要的属性
    forbidNonWhitelisted: true,   // 未知属性报 400
    transform: true,
    disableErrorMessages: process.env.NODE_ENV === 'production',
  }));

  await app.listen(3000);
}
```

### 6.2 认证守卫与 JWT

```typescript
// auth/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

// 按路由粒度保护
@Controller('users')
@UseGuards(JwtAuthGuard)   // 整个控制器都需要认证
export class UsersController {
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
```

### 6.3 生产日志脱敏

```typescript
// 用 NestJS 内置 Logger，不要用 console.log
import { Logger } from '@nestjs/common';

const logger = new Logger('UserService');
// ✅ 正确：不记录密码
logger.log(`User ${user.email} logged in successfully`);
// ❌ 错误：记录了明文密码
logger.log(`User ${user.email} password: ${password}`);
```

---

## 七、NestJS 健康检查

```typescript
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }
}
```

安装依赖：`npm install @nestjs/terminus @nestjs/axios`

---

## 八、排查：常见部署问题

| 问题 | 原因 | 解决 |
|------|------|------|
| `Cannot find module '@nestjs/core'` | 忘了 `npm ci` 或依赖在 devDependencies | 确认 `@nestjs/core` 在 `dependencies` |
| TypeORM 连不上数据库 | 环境变量未传入容器 | 检查 `docker-compose.yml` 的 `environment` |
| `synchronize` 生产删表 | 开了 `synchronize: true` | 改 `false`，用 Migration |
| JWT 签名验证失败 | `JWT_SECRET` 配置不一样 | 环境变量统一 |
| 请求 413 Payload Too Large | 请求体超限 | Nginx `client_max_body_size` + NestJS bodyParser 大小调整 |
| 内存持续增长 | 开连接未释放/ORM 内存泄漏 | 开启 connection pool 清理 + `max_old_space_size` |

---

> **相关章节**
> - 前端一起部署 → [全栈组合部署方案](fullstack-combinations.md)
> - NestJS 后端完整实战 → [NestJS 博客 API 实战](../backend/project-blog-api.md)
> - CI/CD → [持续集成/持续部署](../engineering/cicd/index.md)

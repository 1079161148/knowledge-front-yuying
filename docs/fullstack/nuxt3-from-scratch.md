# Nuxt 3 从零到部署完整实战

> 面向：会用 Vue 3、想要用 Nuxt 3 做全栈项目的开发者。本篇从 `npx nuxi init` 开始，到部署 Vercel / Docker 结束。

---

## 一、Nuxt 3 是什么

Nuxt 3 = Vue 3 + 服务端渲染（SSR）+ 静态生成（SSG）+ API 路由 + 文件路由 + 自动导入，一个框架搞定前端和后端。

**核心能力**：

| 能力 | 一句话解释 |
|------|-----------|
| 文件路由 | `pages/` 下的文件自动成为路由 |
| 自动导入 | `components/`、`composables/`、`utils/` 下无需手动 import |
| API 路由 | `server/api/` 下的文件自动成为 API 端点 |
| SSR/SSG/CSR | 按页面选择渲染模式 |
| 中间件 | 路由级别的请求拦截 |
| Nitro 引擎 | 底层跨平台服务端引擎，部署到任何平台 |
| `useFetch` / `useAsyncData` | 内置的数据获取 composable |

---

## 二、环境准备与项目初始化

### 2.1 前提

```bash
node -v    # 需要 ≥ 18.0
npm -v
```

### 2.2 创建项目

```bash
npx nuxi@latest init my-nuxt-blog
```

按提示选择：

| 提示 | 选择 |
|------|------|
| Package manager | npm / pnpm（选你常用的） |
| Git init | **Yes** |

```bash
cd my-nuxt-blog
npm install
npm run dev
```

打开 `http://localhost:3000`，看到 Nuxt 3 欢迎页。

### 2.3 初始项目结构

```
my-nuxt-blog/
├── app.vue                   # 入口组件
├── nuxt.config.ts            # Nuxt 配置文件
├── tsconfig.json
├── pages/                    # 页面路由（创建后自动生效）
├── components/               # 组件（自动导入）
├── composables/              # Composable（自动导入）
├── server/                   # 服务端
│   └── api/                  # API 路由
├── public/                   # 静态资源
└── package.json
```

!!! tip "自动导入机制"
    Nuxt 3 自动导入 `components/`、`composables/`、`utils/` 目录下的文件，不需要手动写 `import`。但 `pages/` 目录只做路由，不在全局注入。

---

## 三、第一步：搭建博客页面

### 3.1 创建数据模块

`server/utils/posts.ts`（服务端工具，自动导入 server 目录）：

```typescript
export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  content: string;
}

const posts: Post[] = [
  {
    slug: 'hello-world',
    title: 'Hello World —— 我的第一篇博客',
    excerpt: '这是使用 Nuxt 3 搭建的第一篇博客文章。',
    date: '2026-08-01',
    content: `
## 欢迎

这是我的第一篇博客！Nuxt 3 让前后端开发变得非常简单。

### 技术栈

- **框架**: Nuxt 3 (Vue 3 + Nitro)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **部署**: Vercel
    `.trim(),
  },
  {
    slug: 'nuxt3-ssr',
    title: '理解 Nuxt 3 的渲染模式',
    excerpt: 'SSR、SSG、CSR、ISR、SWR——Nuxt 3 的六种渲染方式。',
    date: '2026-08-02',
    content: `
## Nuxt 3 的渲染模式

Nuxt 3 提供了灵活的渲染策略：

- **SSR**（默认）：每次请求在服务器渲染，数据实时
- **SSG**：构建时生成静态 HTML
- **CSR**：纯客户端渲染（SPA 模式）
- **ISR**：静态 + 按需重新生成
- **SWR**：静态缓存 + 后台验证
    `.trim(),
  },
];

export function getAllPosts(): Omit<Post, 'content'>[] {
  return posts.map(({ content, ...rest }) => rest)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getPostBySlug(slug: string): Post | undefined {
  return posts.find(p => p.slug === slug);
}
```

### 3.2 API 端点

`server/api/posts/index.get.ts`：

```typescript
import { getAllPosts } from '../../utils/posts';

export default defineEventHandler(() => {
  return getAllPosts();
});
```

`server/api/posts/[slug].get.ts`：

```typescript
import { getPostBySlug } from '../../utils/posts';

export default defineEventHandler((event) => {
  const slug = getRouterParam(event, 'slug');
  const post = getPostBySlug(slug!);

  if (!post) {
    throw createError({ statusCode: 404, message: '文章不存在' });
  }
  return post;
});
```

### 3.3 首页：文章列表

`pages/index.vue`：

```vue
<template>
  <main class="max-w-2xl mx-auto py-12 px-4">
    <h1 class="text-4xl font-bold mb-2">我的博客</h1>
    <p class="text-gray-500 mb-8">用 Nuxt 3 + TypeScript 搭建</p>

    <div class="space-y-6">
      <article
        v-for="post in data"
        :key="post.slug"
        class="border rounded-lg p-6 hover:shadow-lg transition cursor-pointer"
        @click="navigateTo(`/posts/${post.slug}`)"
      >
        <time class="text-sm text-gray-400">{{ post.date }}</time>
        <h2 class="text-xl font-semibold mt-1">{{ post.title }}</h2>
        <p class="text-gray-500 mt-2">{{ post.excerpt }}</p>
      </article>
    </div>
  </main>
</template>

<script setup lang="ts">
const { data } = await useFetch('/api/posts');
</script>
```

### 3.4 文章详情页

`pages/posts/[slug].vue`：

```vue
<template>
  <main class="max-w-2xl mx-auto py-12 px-4">
    <NuxtLink to="/" class="text-blue-600 hover:underline mb-4 inline-block">
      ← 返回首页
    </NuxtLink>

    <article v-if="data">
      <time class="text-gray-400">{{ data.date }}</time>
      <h1 class="text-3xl font-bold mt-1 mb-6">{{ data.title }}</h1>
      <div class="prose">{{ data.content }}</div>
    </article>

    <div v-else-if="error" class="text-red-500">
      文章加载失败：{{ error.message }}
    </div>
  </main>
</template>

<script setup lang="ts">
const route = useRoute();
const { data, error } = await useFetch(`/api/posts/${route.params.slug}`);
</script>
```

---

## 四、第二步：接数据库（Prisma + SQLite/PostgreSQL）

### 4.1 安装 Prisma

```bash
npm install prisma @prisma/client
npx prisma init
```

### 4.2 定义数据模型

`prisma/schema.prisma`：

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"          # 开发用 SQLite（零配置）
  url      = "file:./dev.db"   # 或 Postgres: env("DATABASE_URL")
}

model Post {
  id        Int      @id @default(autoincrement())
  slug      String   @unique
  title     String
  excerpt   String
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 4.3 生成数据库

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4.4 Prisma 客户端工具

`server/utils/prisma.ts`：

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export default prisma;
```

### 4.5 改造 API 接数据库

`server/api/posts/index.get.ts`：

```typescript
import prisma from '../../utils/prisma';

export default defineEventHandler(async () => {
  return prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    select: { slug: true, title: true, excerpt: true, createdAt: true },
  });
});
```

`server/api/posts/index.post.ts`：

```typescript
import prisma from '../../utils/prisma';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  // 服务端校验
  if (!body.title || !body.slug) {
    throw createError({ statusCode: 400, message: '标题和 slug 必填' });
  }

  return prisma.post.create({
    data: {
      title: body.title,
      slug: body.slug,
      excerpt: body.excerpt || '',
      content: body.content || '',
    },
  });
});
```

---

## 五、第三步：添加发布功能

`pages/new.vue`：

```vue
<template>
  <main class="max-w-2xl mx-auto py-12 px-4">
    <h1 class="text-3xl font-bold mb-6">写文章</h1>
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <input v-model="form.title" placeholder="标题" required class="w-full border p-2 rounded" />
      <input v-model="form.slug" placeholder="slug（如 hello-world）" required class="w-full border p-2 rounded" />
      <textarea v-model="form.excerpt" placeholder="摘要" class="w-full border p-2 rounded" rows="2" />
      <textarea v-model="form.content" placeholder="正文" required class="w-full border p-2 rounded" rows="8" />
      <button type="submit" class="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
        发布
      </button>
    </form>
  </main>
</template>

<script setup lang="ts">
const form = reactive({
  title: '',
  slug: '',
  excerpt: '',
  content: '',
});

async function handleSubmit() {
  const { error } = await useFetch('/api/posts', {
    method: 'POST',
    body: form,
  });

  if (error.value) {
    alert(error.value.message);
  } else {
    await navigateTo('/');
  }
}
</script>
```

---

## 六、第四步：Nuxt 3 中间件（鉴权保护）

`middleware/auth.ts`：

```typescript
export default defineNuxtRouteMiddleware((to) => {
  // 示例：检查是否登录
  const token = useCookie('token');

  if (!token.value && to.path.startsWith('/new')) {
    return navigateTo('/login');
  }
});
```

在页面中使用：

```vue
<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
});
</script>
```

---

## 七、第五步：部署

### 7.1 部署到 Vercel（推荐）

1. 推代码到 GitHub
2. 在 Vercel 中 **Import** 仓库
3. 框架自动识别为 Nuxt.js，无需额外配置
4. 环境变量在 Settings → Environment Variables 添加

### 7.2 部署为纯静态站点（SSG）

如果博客内容不经常变，可以全静态生成。

`nuxt.config.ts`：

```typescript
export default defineNuxtConfig({
  ssr: true,              // 构建时预渲染
  nitro: {
    preset: 'static',     // 纯静态输出
    prerender: {
      routes: ['/'],      // 预渲染首页
      crawlLinks: true,   // 自动追踪所有内部链接
    },
  },
});
```

```bash
npx nuxi generate      # 生成静态文件到 .output/public/
```

把 `.output/public/` 上传到 Nginx / GitHub Pages / Netlify 即可。

### 7.3 部署到 VPS（Nitro + PM2）

```bash
npm run build          # 构建
```

`nuxt.config.ts`：

```typescript
export default defineNuxtConfig({
  nitro: {
    preset: 'node-server',   // Node.js 服务器部署
  },
});
```

```bash
node .output/server/index.mjs     # 直接运行
# 或用 PM2
pm2 start .output/server/index.mjs --name nuxt-blog
pm2 save
```

### 7.4 Docker 部署

`Dockerfile`：

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.output ./.output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

### 7.5 Nginx 反向代理

```nginx
server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## 八、Nuxt 3 安全要点

### 8.1 API 路由安全

```typescript
// server/api/admin/users.get.ts
export default defineEventHandler(async (event) => {
  // 1. 鉴权
  const session = await getUserSession(event);
  if (!session?.user) {
    throw createError({ statusCode: 401, message: '未登录' });
  }

  // 2. 权限检查
  if (session.user.role !== 'admin') {
    throw createError({ statusCode: 403, message: '无权限' });
  }

  // 3. 返回数据
  return prisma.user.findMany();
});
```

### 8.2 中间件 + 环境变量

```
NUXT_PUBLIC_*  → 暴露给客户端
非 NUXT_PUBLIC_ → 只在服务端可用
```

### 8.3 SSR 安全注意事项

```vue
<script setup lang="ts">
// ❌ 错误：会在客户端暴露
const API_KEY = useRuntimeConfig().public.apiKey;

// ✅ 正确：只在服务端可用
const secretKey = useRuntimeConfig().secretKey;
</script>
```

`nuxt.config.ts`：

```typescript
export default defineNuxtConfig({
  runtimeConfig: {
    secretKey: '',        // 只在服务端，通过 .env 注入
    public: {
      apiBase: '/api',    // 公共，客户端可见
    },
  },
});
```

---

## 九、Nuxt 3 vs Next.js 选型建议

| 对比维度 | Nuxt 3 | Next.js |
|---------|--------|---------|
| 前端框架 | Vue 3 | React |
| 学习曲线 | 温和（自动导入、约定优于配置） | 较陡（需理解 RSC、'use client' 边界） |
| 社区/生态 | 中等 | 最大（Vercel 力推） |
| 部署平台 | Vercel / Netlify / Node / 静态 | Vercel / Netlify / Node / 静态 |
| 类型安全 | ✅（Composables 完全类型化） | ✅（Server Actions 天然类型安全） |
| 适用人群 | Vue 技术栈团队 | React 技术栈团队 |
| 中文文档 | 官方中文站 | 有社区翻译 |

---

## 十、完整项目 Checklist

- [ ] 项目已初始化并能 `npm run dev` 跑通
- [ ] 首页显示文章列表（从 API 获取）
- [ ] 文章详情页正常跳转和展示
- [ ] 发布文章功能可用
- [ ] 管理页面有中间件保护
- [ ] `.env` 在 `.gitignore` 中
- [ ] 已部署到 Vercel / VPS / 静态托管
- [ ] HTTPS 已配置
- [ ] 安全头已配置

---

> **下一步**
> - 添加用户系统 → 用 Nuxt Auth (sidebase/nuxt-auth)
> - 添加数据库 → 看 [NestJS 博客 API 实战](../backend/project-blog-api.md) 的数据库设计思路
> - 部署选择 → [部署总览](../deployment/index.md) | [全栈组合部署方案](../deployment/fullstack-combinations.md)

# Next.js 从零到部署完整实战

> 面向：会用 React、想要用 Next.js 做全栈项目的开发者。本篇从 `npx create-next-app` 开始，到部署 Vercel / Docker 结束。

---

## 一、Next.js 是什么

Next.js = React + 服务端渲染（SSR）+ 静态生成（SSG）+ API 路由 + 文件路由，一个框架搞定前后端。

**核心能力**：

| 能力 | 一句话解释 |
|------|-----------|
| App Router | 基于目录的文件路由，`page.tsx` 即页面 |
| Server Components | 组件默认在服务端渲染，零 JS 发送给客户端 |
| Server Actions | 直接在组件里写后端逻辑，不需要单独建 API 路由 |
| 流式渲染 (Streaming) | 页面边渲染边输出，不等待慢数据 |
| API Routes | `route.ts` 文件即 API 端点 |
| 中间件 (Middleware) | 请求级别的拦截，做鉴权/重定向 |

---

## 二、环境准备与项目初始化

### 2.1 前提

```bash
node -v    # 需要 ≥ 18.17
npm -v
```

### 2.2 创建项目

```bash
npx create-next-app@latest my-next-blog
```

按提示选择：

| 提示 | 选择 |
|------|------|
| TypeScript | **Yes** ✅ |
| ESLint | **Yes** ✅ |
| Tailwind CSS | Yes（推荐） |
| `src/` directory | Yes（结构清晰） |
| App Router | **Yes** ✅（默认，推荐） |
| Turbopack | Yes（更快） |
| import alias | 默认 `@/*` 即可 |

```bash
cd my-next-blog
npm run dev
```

打开 `http://localhost:3000`，看到 Next.js 欢迎页。

### 2.3 初始项目结构

```
my-next-blog/
├── src/
│   └── app/
│       ├── layout.tsx       # 根布局（所有页面共用）
│       ├── page.tsx         # 首页（/）
│       ├── globals.css
│       └── favicon.ico
├── public/                  # 静态资源（图片等）
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 三、第一步：搭建博客页面

### 3.1 创建文章数据

`src/lib/posts.ts`：

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
    excerpt: '这是使用 Next.js 搭建的第一篇博客文章。',
    date: '2026-08-01',
    content: `
## 欢迎

这是我的第一篇博客！用 Next.js 搭建博客非常简单。

### 技术栈

- **框架**: Next.js 15 App Router
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **部署**: Vercel
    `.trim(),
  },
  {
    slug: 'nextjs-ssr',
    title: '理解 Next.js 的 SSR 和 SSG',
    excerpt: 'Server Components、静态生成、增量静态再生成——一次讲清楚。',
    date: '2026-08-02',
    content: `
## SSR vs SSG vs ISR

Next.js 提供了三种渲染策略：

- **SSR (Server-Side Rendering)**：每次请求都在服务器渲染，数据永远最新
- **SSG (Static Site Generation)**：构建时生成 HTML，速度最快
- **ISR (Incremental Static Regeneration)**：静态生成，但可以定时重新生成
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

### 3.2 首页：文章列表

`src/app/page.tsx`：

```tsx
import Link from 'next/link';
import { getAllPosts } from '@/lib/posts';

export default function HomePage() {
  const posts = getAllPosts();

  return (
    <main className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-2">我的博客</h1>
      <p className="text-gray-500 mb-8">用 Next.js 15 + TypeScript 搭建</p>

      <div className="space-y-6">
        {posts.map(post => (
          <article key={post.slug} className="border rounded-lg p-6 hover:shadow-lg transition">
            <time className="text-sm text-gray-400">{post.date}</time>
            <h2 className="text-xl font-semibold mt-1">
              <Link href={`/posts/${post.slug}`} className="hover:text-blue-600">
                {post.title}
              </Link>
            </h2>
            <p className="text-gray-500 mt-2">{post.excerpt}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
```

### 3.3 文章详情页

`src/app/posts/[slug]/page.tsx`：

```tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPostBySlug } from '@/lib/posts';

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  return (
    <main className="max-w-2xl mx-auto py-12 px-4">
      <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
        ← 返回首页
      </Link>
      <article>
        <time className="text-gray-400">{post.date}</time>
        <h1 className="text-3xl font-bold mt-1 mb-6">{post.title}</h1>
        <div className="prose" dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br/>') }} />
      </article>
    </main>
  );
}
```

!!! tip "在浏览器测试"
    保存后访问 `http://localhost:3000`，点击文章标题跳转到详情页。

---

## 四、第二步：接数据库（Prisma + PostgreSQL）

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
  provider = "postgresql"
  url      = env("DATABASE_URL")
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

`.env`：

```
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
```

### 4.3 生成数据库

```bash
npx prisma migrate dev --name init
npx prisma generate          # 生成类型安全的客户端
```

### 4.4 创建 Prisma 客户端单例

`src/lib/prisma.ts`：

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### 4.5 从数据库读取博客

`src/lib/posts-db.ts`：

```typescript
import { prisma } from './prisma';

export async function getAllPosts() {
  return prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      slug: true,
      title: true,
      excerpt: true,
      createdAt: true,
    },
  });
}

export async function getPostBySlug(slug: string) {
  return prisma.post.findUnique({ where: { slug } });
}
```

### 4.6 接入真实数据库的首页

```tsx
// src/app/page.tsx
import { getAllPosts } from '@/lib/posts-db';

export default async function HomePage() {
  const posts = await getAllPosts();
  // ... 渲染逻辑同上
}
```

---

## 五、第三步：Server Actions（添加文章）

不用建 API 路由，直接在组件中处理表单提交。

### 5.1 创建 Server Action

`src/app/actions.ts`：

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string;
  const slug = formData.get('slug') as string;
  const excerpt = formData.get('excerpt') as string;
  const content = formData.get('content') as string;

  // 服务端校验
  if (!title || !slug) {
    return { error: '标题和 slug 必填' };
  }

  await prisma.post.create({
    data: { title, slug, excerpt, content },
  });

  // 重新验证首页缓存
  revalidatePath('/');

  return { success: true };
}
```

### 5.2 创建发布页面

`src/app/new/page.tsx`：

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { createPost } from '@/app/actions';

export default function NewPostPage() {
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    const result = await createPost(formData);
    if (result.success) {
      router.push('/');
      router.refresh();
    } else {
      alert(result.error);
    }
  }

  return (
    <main className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">写文章</h1>
      <form action={handleSubmit} className="space-y-4">
        <input name="title" placeholder="标题" required className="w-full border p-2 rounded" />
        <input name="slug" placeholder="slug（如 hello-world）" required className="w-full border p-2 rounded" />
        <textarea name="excerpt" placeholder="摘要" className="w-full border p-2 rounded" rows={2} />
        <textarea name="content" placeholder="正文（支持 Markdown）" required className="w-full border p-2 rounded" rows={8} />
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
          发布
        </button>
      </form>
    </main>
  );
}
```

---

## 六、第四步：部署

### 6.1 部署到 Vercel（推荐，一键）

1. 推代码到 GitHub：

```bash
git init && git add . && git commit -m "init"
git remote add origin https://github.com/你的用户名/my-next-blog.git
git push -u origin main
```

2. 打开 [Vercel](https://vercel.com) → **Import** → 选择仓库
3. Vercel 自动识别 Next.js，**无需任何配置**，点击 Deploy
4. 在 Settings → Environment Variables 中添加 `DATABASE_URL`
5. 如果有自己的域名，Settings → Domains 添加

### 6.2 部署到 VPS（Docker）

`Dockerfile`：

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app

# 依赖安装
FROM base AS deps
COPY package*.json prisma/schema.prisma ./
RUN npm ci
RUN npx prisma generate

# 构建
FROM deps AS builder
COPY . .
RUN npm run build

# 生产镜像
FROM base AS runner
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

`next.config.ts`：

```typescript
const nextConfig = {
  output: 'standalone',   // 独立部署模式
};
export default nextConfig;
```

```bash
docker build -t my-next-blog .
docker run -d -p 3000:3000 --env-file .env my-next-blog
```

### 6.3 部署安全检查

| 检查项 | 说明 |
|--------|------|
| `DATABASE_URL` 不提交代码 | `.env` 在 `.gitignore` 中，通过 Vercel / Docker env 注入 |
| 构建时检查 lint | `next build` 包含了 lint 检查 |
| 图片优化 | 用 `<Image>` 替代 `<img>`（自动优化、懒加载） |
| CSP 头 | `next.config.ts` 中配置 `headers()` |
| 速率限制 | 配合 `middleware.ts` 或 Vercel WAF |

---

## 七、Next.js 安全要点

### 7.1 Server Action 安全

```typescript
'use server';

import { auth } from '@/lib/auth';    // 你的鉴权逻辑

export async function deletePost(postId: number) {
  // 1. 鉴权（必须！）
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  // 2. 权限检查
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (post.authorId !== session.user.id) throw new Error('Forbidden');

  // 3. 执行操作
  await prisma.post.delete({ where: { id: postId } });
  revalidatePath('/');
}
```

### 7.2 中间件鉴权

`src/middleware.ts`：

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  // 保护 /dashboard 路由
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
```

### 7.3 环境变量安全

```
NEXT_PUBLIC_*  → 暴露给浏览器，任何人都能看到
非 NEXT_PUBLIC_ → 只在服务端可用
```

数据库密码、API 密钥、JWT Secret 都不要用 `NEXT_PUBLIC_` 前缀。

---

## 八、完整项目 Checklist

- [ ] 项目已初始化并能在本地 `npm run dev` 跑通
- [ ] 首页能显示文章列表（从 Prisma 数据库读取）
- [ ] 文章详情页能正常跳转
- [ ] 添加文章支持（Server Actions）
- [ ] 通过 `middleware.ts` 保护管理页面
- [ ] `.env` 在 `.gitignore` 中，生产环境变量通过平台配置
- [ ] 已部署到 Vercel / VPS，能通过域名访问
- [ ] HTTPS 已配置
- [ ] API 限流已配置
- [ ] 安全头已配置

---

> **下一步**
> - 添加评论区 → 用 Prisma 加 Comment 模型 + Server Actions
> - 添加认证 → 用 NextAuth.js (Auth.js) 接 GitHub/OAuth 登录
> - 添加 RSS → 用 `feed` 包生成 RSS feed
> - 部署选择 → [部署总览](../deployment/index.md) | [前端部署指南](../deployment/frontend.md)

# 🧱 Next.js 真实项目结构（流式 / Server Actions / 接 AI）

> 全栈篇的"实战进阶"。`fullstack/index.md` 讲了最小 HTTP 与 CRUD，这里给你一个**接近生产的 Next.js App Router 项目骨架**：目录分层、Server Component 与 Client Component 边界、流式渲染、Server Actions 写数据、以及如何把 [AI 流式聊天](../ai-frontend/project-ai-chat.md) 嵌进来。依据 **Next.js 官方文档（App Router）**。

---

## 1. 推荐目录结构

```text
app/
  (shop)/                # 路由分组（不影响 URL）
    products/page.tsx    # 列表（Server Component，直接查库）
  api/
    chat/route.ts        # AI 聊天接口（见 AI 实战）
  layout.tsx             # 根布局
  page.tsx               # 首页
components/
  ProductCard.tsx        # 客户端交互组件（'use client'）
lib/
  db.ts                  # 数据访问（服务端专用，绝不进客户端包）
  llm.ts                 # AI 客户端封装
```

!!! warning "致命边界：哪些代码能进浏览器"
    - `lib/db.ts`（含数据库密码/连接串）**只能被 Server Component / Route Handler / Server Action 引用**。
    - 一旦在 `'use client'` 组件里 `import` 了它，会被打包进前端，密钥泄露。
    - 用 Next 的**服务端/客户端边界**强制隔离：客户端只通过 Route Handler 或 Server Action 间接访问数据。

---

## 2. 流式渲染（首屏快 + 渐次出现）

```tsx
// app/products/page.tsx —— Server Component 用 async + Suspense 流式
import { Suspense } from 'react'
async function ProductList() {
  const list = await fetchProducts() // 慢查询
  return <ul>{
    list.map(p => <li key={p.id}>{p.name} - ¥{p.price}</li>)
  }</ul>
}
export default function Page() {
  return (
    <Suspense fallback={<p>加载商品中…</p>}>
      <ProductList />
    </Suspense>
  )
}
```

!!! tip "流式三件套"
    - `async` Server Component 天然支持流式。
    - `Suspense` 包住慢区域，先出骨架再出内容。
    - AI 回答用 `streamText().toDataStreamResponse()` 把 token 边生成边推（详见 [AI 聊天实战](../ai-frontend/project-ai-chat.md)）。

---

## 3. Server Actions（不用手写 API 也能写数据）

```tsx
// app/products/actions.ts
'use server'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'

export async function addProduct(formData: FormData) {
  const name = String(formData.get('name'))
  await db.products.create({ name })
  revalidatePath('/products') // 刷新该路由的缓存
}
```

```tsx
// 客户端组件直接调用
'use client'
import { addProduct } from './actions'
export function Form() {
  return <form action={addProduct}>
    <input name="name" />
    <button>添加</button>
  </form>
}
```

!!! danger "Server Action 安全"
    - `'use server'` 函数对**任何客户端调用都开放**，必须自己做权限校验（不能只靠前端隐藏按钮）。
    - 不要把原始 `formData` 直接进库，服务端要做校验/清洗（Zod 校验最佳）。

---

## 4. 把 AI 聊天嵌进全栈项目

1. `lib/llm.ts` 封装 AI 客户端（密钥只在服务端）。
2. `app/api/chat/route.ts` 暴露流式接口（复制 [AI 实战](../ai-frontend/project-ai-chat.md) 的 route）。
3. 聊天页用 `useChat`（`@ai-sdk/react`）连接口，其余页面照常 SSR。

> 到此你已具备"Next.js 全栈 + AI 流式"的完整交付能力，正是 2026 招聘最稀缺的组合。

---

## 5. 踩坑

!!! warning "常见坑"
    - Server Component 里误用 `useEffect`/`useState` → 报"Hooks 只能在客户端用"，加 `'use client'`。
    - `fetch` 默认会缓存（Next 15 起默认不缓存，但老版要显式 `{ cache: 'no-store' }`）。
    - `revalidatePath` 在非 Server Action / Route Handler 上下文不可用。

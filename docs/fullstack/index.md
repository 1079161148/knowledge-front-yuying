# 🌐 全栈框架实战

> 从"前端"走向"全栈"：Node 打底，NestJS 做后端，Next.js / Nuxt.js 做全栈同构应用。

---

## 1. Node 基础

**核心机制（依据 ECMA-262 / Node 官方文档）**：Node 基于事件驱动、非阻塞 I/O；单线程通过**事件循环（Event Loop）**处理高并发。

```js
// 一个最小 HTTP 服务（Node 内置 http 模块）
const http = require('http')
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ msg: 'Hello from Node!' }))
})
server.listen(3000, () => console.log('listen on 3000'))
```

```bash
node server.js          # 启动
curl http://localhost:3000   # => {"msg":"Hello from Node!"}
```

!!! tip "事件循环阶段"
   timers → pending callbacks → idle/prepare → poll → check（setImmediate）→ close。理解阶段顺序有助于排查"定时器不准""微任务优先"等问题。

---

## 2. NestJS 实战

**设计思想**：用"装饰器 + 依赖注入（DI）"组织后端，结构类似 Angular，适合中大型服务。

=== "NestJS 控制器（推荐写法）"
    ```ts
    // cats.controller.ts
    import { Controller, Get, Post, Body } from '@nestjs/common'
    @Controller('cats')
    export class CatsController {
      @Get()
      findAll() { return [{ id: 1, name: 'Tom' }] }

      @Post()
      create(@Body() dto: { name: string }) { return dto }
    }
    ```

=== "对比：原生 Express 路由"
    ```js
    app.get('/cats', (req, res) => res.json([{ id: 1, name: 'Tom' }]))
    app.post('/cats', (req, res) => res.json(req.body))
    ```

!!! info "分层"
    Controller（接收请求）→ Service（业务逻辑）→ Module（装配）。用 `constructor(private svc: CatsService)` 注入，Nest 自动管理实例。

---

## 3. Next.js（React 全栈）

**两种路由模型对比：**

=== "App Router（新版推荐）"
    ```tsx
    // app/page.tsx —— 默认服务端组件
    export default async function Page() {
      const data = await fetch('http://localhost:3000/api').then(r => r.json())
      return <main>{data.msg}</main>
    }

    // app/api/route.ts
    export async function GET() {
      return Response.json({ msg: 'from route handler' })
    }
    ```

=== "Pages Router（经典）"
    ```tsx
    // pages/index.tsx
    export default function Home({ msg }) { return <main>{msg}</main> }
    export async function getServerSideProps() {
      return { props: { msg: 'SSR' } }
    }

    // pages/api/hello.ts
    export default function handler(req, res) { res.json({ msg: 'from api' }) }
    ```

!!! warning "服务端组件陷阱"
    App Router 中组件默认在**服务器**运行，不能直接用 `useState`/`useEffect`；需要交互的部分加 `'use client'` 标记为客户端组件。

---

## 4. Nuxt 3（Vue3 全栈）

**文件路由 + 自动 API：**

```ts
// server/api/hello.ts
export default defineEventHandler(() => ({ msg: 'from Nuxt server' }))
```

```html
<!-- pages/index.vue -->
<script setup>
const { data } = await useFetch('/api/hello')
</script>
<template>
  <main>{{ data?.msg }}</main>
</template>
```

!!! info "useState（跨组件共享状态）"
    Nuxt 的 `useState` 是 SSR 安全的全局状态，替代 Vuex/Pinia 做轻量共享。

---

## 5. 踩坑（注意事项）

!!! warning "常见坑"
    - **Node** 计算密集型任务会阻塞事件循环，交给 Worker Threads 或拆服务。
    - **NestJS** 忘记在 `Module` 的 `controllers`/`providers` 注册，导致 404 / 注入失败。
    - **Next.js** 在 Server Component 里用了浏览器 API（`window`）直接报错；交互必须用 Client Component。
    - **Nuxt 3** `useFetch` 默认在服务端也会请求，注意避免重复请求（用 `lazy` / `server: false` 控制）。

---

## 6. 学习经验

!!! tip "经验"
    - 先吃透 Node 事件循环与 HTTP，再上 NestJS，概念才不飘。
    - Next / Nuxt 本质是"同一套代码同时跑前后端"，关键是分清哪些在服务端、哪些在客户端。
    - 后端接口先用 Postman/curl 验证，再接前端，排错更快。

---

## 7. 总结

| 层 | 选型 | 一句话 |
|----|------|--------|
| 运行时 | Node.js | 事件循环 + 非阻塞 I/O |
| 后端框架 | NestJS | 装饰器 + DI，结构化后端 |
| React 全栈 | Next.js | App Router 为主 |
| Vue 全栈 | Nuxt 3 | 文件路由 + 自动 API |

> 真实生产骨架 → [Next.js 真实项目结构](nextjs-real-project.md)：流式渲染、Server Actions、以及把 AI 聊天嵌进全栈项目。

> 下一板块预告：**HTML5 / CSS3**（语义化、Flex/Grid、动画、响应式、新特性）。

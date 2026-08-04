# 🤸 TypeScript 类型体操与 NestJS 实战

> TS 进阶专题。把 [TS 高级类型术语](../ts/terminology-advanced.md) 里的概念，变成**真能用的类型体操**，并落到 **NestJS DTO / 装饰器 / 依赖注入** 的工程现场。依据 **TypeScript Handbook / NestJS 官方文档**。

---

## 1. 工具类型：自己实现一个

```ts
// 实现一个 Partial
type MyPartial<T> = { [K in keyof T]? : T[K] }

// 实现一个 Required
type MyRequired<T> = { [K in keyof T]-? : T[K] } // -? 去掉可选

// 实现一个 DeepReadonly
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K]
}
```

!!! tip "infer 是体操的灵魂"
    `T extends Promise<infer U> ? U : T` —— 在条件类型里"捕获"嵌套类型。
    实战：`Awaited<T>`（官方已内置）、`Unwrap<T>`（拆 Promise/数组/函数返回）。

---

## 2. 实战：严格 API 响应类型

```ts
type ApiRes<T> =
  | { ok: true; code: 200; data: T }
  | { ok: false; code: number; error: string }

async function get<T>(url: string): Promise<ApiRes<T>> {
  const r = await fetch(url)
  if (!r.ok) return { ok: false, code: r.status, error: r.statusText }
  return { ok: true, code: 200, data: await r.json() as T }
}

const res = await get<{ id: number; name: string }>('/api/user')
if (res.ok) console.log(res.data.name) // 类型收窄后安全访问
```

!!! danger "别用 any 逃课"
    `any` 会跳过全部检查，等于把 TS 降级成 JS。拿不准用 `unknown` + 收窄：
    ```ts
    function handle(x: unknown) {
      if (typeof x === 'string') x.toUpperCase() // 收窄后才能调用
    }
    ```

---

## 3. 模板字面量类型（字面量级别的拼装）

```ts
type Method = 'get' | 'post'
type Route = `/${string}`
type Endpoint = `${Uppercase<Method>} ${Route}`
// 例：'GET /users' | 'POST /users'

// 实战：事件名推导
type Events = 'click' | 'hover'
type Handler = `on${Capitalize<Events>}` // 'onClick' | 'onHover'
```

---

## 4. 与 NestJS 结合：DTO + 装饰器

```ts
// user.dto.ts —— 用 class + 装饰器做运行时校验（搭配 class-validator）
import { IsString, IsInt, Min } from 'class-validator'
export class CreateUserDto {
  @IsString() name!: string
  @IsInt() @Min(0) age!: number
}

// user.controller.ts
import { Controller, Post, Body } from '@nestjs/common'
import { CreateUserDto } from './user.dto'
@Controller('users')
export class UserController {
  @Post()
  create(@Body() dto: CreateUserDto) {
    // dto 已由 ValidationPipe 在运行时校验（装饰器不止是类型，更是校验元数据）
    return { id: 1, ...dto }
  }
}
```

!!! warning "类型 vs 运行时校验"
    - TS 类型在**编译后被擦除**，运行时不存在。光靠 `CreateUserDto` 的类型**不会**拦截脏数据。
    - 真正校验靠 `class-validator` 装饰器 + `ValidationPipe`（运行时生效），二者配合才是完整防线。
    - 前端用 Zod 做同样的事，前后端可共享 schema 思路（Zod 既能校验也能推导类型）。

---

## 5. 类型体操自测

```ts
type First<T extends any[]> = T extends [infer H, ...any[]] ? H : never
type R = First<[string, number]> // 应该是 string
```

> 延伸：[全栈 Next.js 实战](../fullstack/nextjs-real-project.md)。

# 🟦 TypeScript 高级类型与工程实践

> 接续 [TS 类型基础与核心术语](terminology-basic.md)。本篇深入**高级类型（条件/映射/模板字面量/递归）**、**工具类型实现**、**装饰器**、**声明文件**与**工程化配置、迁移、兼容方案**。越细越好。依据 **TypeScript Handbook（Advanced Types / Utility Types / Decorators / Modules）** 与 **TC39 提案**。

---

## 一、高级类型核心术语（深入）

| 术语 | 定义 | 语法 |
|------|------|------|
| 条件类型 | 类似三元表达式的类型选择 | `T extends U ? X : Y` |
| `infer` | 在条件类型中"捕获"推断出的类型 | `T extends Array<infer U> ? U : T` |
| 分布式条件类型 | 联合类型逐个代入条件类型 | `T extends U ? X : Y`（裸类型参数自动分发） |
| 映射类型 | 遍历已有类型的键生成新类型 | `{ [K in keyof T]: T[K] }` |
| `keyof` | 取类型的所有键的联合 | `keyof T` |
| 模板字面量类型 | 用模板字符串构造类型 | `` type Path = `user/${string}` `` |
| 递归类型 | 类型自我引用（深递归） | `type Deep = { [K in keyof T]: Deep<T[K]> }` |
| 泛型约束 | 限制泛型范围 | `<T extends Foo>` |
| 类型谓词 | 自定义守卫返回类型 | `arg is T` |
| 声明合并 | 同名声明自动合并 | interface / namespace / enum |
| 模块扩展 | 向已有模块增补类型 | `declare module 'x' {}` |
| 类型体操 | 用上述能力组合出复杂类型 | — |

---

## 二、条件类型、infer 与映射类型

### 1. 条件类型与 `infer`

```ts
type IsString<T> = T extends string ? true : false;

// 提取数组元素类型
type ElementOf<T> = T extends (infer U)[] ? U : T;
type A = ElementOf<string[]>;   // string

// 提取 Promise 的解析类型（官方 Awaited 原理）
type MyAwaited<T> = T extends Promise<infer U> ? MyAwaited<U> : T;
type R = MyAwaited<Promise<Promise<number>>>;  // number

// 提取函数返回类型
type Return<T> = T extends (...args: any[]) => infer R ? R : never;
```

!!! warning "分布式条件类型坑"
    - **裸类型参数**（`T extends U ? X : Y` 中 T 未包裹）遇到联合类型会**分发**：`IsString<string | number>` → `true | false`。
    - 想**阻止分发**，把 T 包进元组：`[T] extends [U] ? X : Y`。

### 2. 映射类型 + `keyof` + `in`

```ts
type Readonly<T> = { readonly [K in keyof T]: T[K] };
type Optional<T> = { [K in keyof T]?: T[K] };
type Nullable<T> = { [K in keyof T]: T[K] | null };

// key 重映射（TS 4.1+ 可改造 key）
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};
```

!!! warning "注意"
    - 映射类型会**保留 `readonly` / `?` 修饰符**；用 `-readonly` / `-?` 移除（`type Mutable<T> = { -readonly [K in keyof T]: T[K] }`）。
    - `as` 键重映射时，若返回 `never` 则**删除该键**：可实现"挑选/排除"键。

### 3. 模板字面量类型

```ts
type EventName<T extends string> = `on${Capitalize<T>}`;
type Click = EventName<'click'>;   // 'onClick'

type Path = `users/${number}/posts/${number}`;
const p: Path = 'users/1/posts/2'; // ✅ 字面量约束
```

!!! tip "实战价值"
    模板字面量类型常用于**路由路径、事件名、CSS 属性名、API endpoint** 的精确建模，能在编译期捕获拼写错误。

### 4. 递归类型

```ts
type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;
```

!!! warning "注意"
    - 深度递归类型在对象层级极深时可能触发编译器递归限制（TS 有递归深度上限，约 50 层），超深结构会报错；用 `unknown` 终止递归。

---

## 三、内置工具类型详解（实现 + 用途）

| 工具类型 | 定义（简化实现） | 用途 | 引入 |
|----------|------------------|------|------|
| `Partial<T>` | `{ [K in keyof T]?: T[K] }` | 所有属性变可选（如 patch 更新） | 内置 |
| `Required<T>` | `{ -? [K in keyof T]: T[K] }` | 所有属性变必填 | 内置 |
| `Readonly<T>` | `{ readonly [K in keyof T]: T[K] }` | 只读 | 内置 |
| `Record<K,T>` | `{ [P in K]: T }` | 构造键值映射对象 | 内置 |
| `Pick<T,K>` | `{ [P in K]: T[P] }` | 挑选部分属性 | 内置 |
| `Omit<T,K>` | `Pick<T, Exclude<keyof T, K>>` | 排除部分属性 | 内置 |
| `Exclude<T,U>` | `T extends U ? never : T` | 联合中排除 | 内置 |
| `Extract<T,U>` | `T extends U ? T : never` | 联合中提取 | 内置 |
| `NonNullable<T>` | `T extends null\|undefined ? never : T` | 去除 null/undefined | 内置 |
| `Parameters<F>` | `F extends (...a: infer A) => any ? A : never` | 提取参数元组 | 内置 |
| `ReturnType<F>` | `F extends (...a: any) => infer R ? R : never` | 提取返回类型 | 内置 |
| `ConstructorParameters<C>` | 构造函数参数元组 | 提取构造参数 | 内置 |
| `InstanceType<C>` | 实例类型 | 提取实例 | 内置 |
| `ThisParameterType` / `OmitThisParameter` | 处理 `this` | — | 内置 |
| `Awaited<T>` | 递归解 Promise | `await` 结果类型 | TS 4.5+ |
| `Uppercase`/`Lowercase`/`Capitalize`/`Uncapitalize` | 字符串变换 | 配合模板字面量 | 内置 |

!!! tip "组合实战"
    ```ts
    // 更新 DTO：必填 id + 部分可选字段
    type UpdateUser = Pick<User, 'id'> & Partial<Omit<User, 'id'>>;
    // 把对象所有值改 number
    type NumValues<T> = { [K in keyof T]: number };
    ```

---

## 四、类型守卫与自定义谓词

```ts
// 内建守卫
function f(x: string | number) {
  if (typeof x === 'string') return x;
}

// 自定义类型谓词
function isFish(pet: Fish | Bird): pet is Fish {
  return (pet as Fish).swim !== undefined;
}
if (isFish(pet)) pet.swim();    // 收窄为 Fish

// 用户态守卫函数配合 Array.filter 精确类型
const nums = mixed.filter((x): x is number => typeof x === 'number');
```

!!! warning "注意"
    - 类型谓词 `arg is T` 由**你保证正确性**——TS 不会验证运行时逻辑，写错会导致类型不安全。
    - 用 `in` 守卫判断对象属性存在：`if ('swim' in pet)`。

---

## 五、装饰器（Decorators）

```ts
// 类装饰器
function sealed(constructor: Function) {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
}
@sealed
class BugReport {}

// 方法装饰器
function log(target: any, prop: string, desc: PropertyDescriptor) {
  const orig = desc.value;
  desc.value = function (...args: any[]) { console.log(prop, args); return orig.apply(this, args); };
}
class C { @log greet() {} }
```

!!! danger "装饰器三大注意"
    1. **实验性**：TS 传统装饰器需 `experimentalDecorators: true`；**TC39 标准装饰器（Stage 3）** 用 `target: 'ES2022'` + 不同语法，二者**不兼容**，迁移需谨慎。
    2. 装饰器在**类定义时（运行时）**执行，不是类型特性。
    3. 框架（Angular 用传统装饰器；NestJS 用传统；新标准装饰器在 TC39 推进中）对装饰器语法有强依赖，选技术栈前确认版本。
    ```json
    { "compilerOptions": { "experimentalDecorators": true, "emitDecoratorMetadata": true } }
    ```

---

## 六、声明文件 `.d.ts` 与模块扩展

```ts
// types.d.ts —— 只声明类型，无实现
declare module 'untyped-lib' {
  export function doThing(x: number): string;
}
declare global {
  interface Window { myApp: string; }
}
// 模块扩展（向第三方类型增补）
declare module 'react' {
  interface Attributes { 'data-testid'?: string; }
}
```

!!! warning "注意"
    - `.d.ts` 文件**不会生成 JS**，只给编译器看。
    - 第三方库类型来自 **DefinitelyTyped**（`@types/xxx`）；找不到时自己写 `declare module` 兜底。
    - `declare global` 必须在模块文件（有 `import/export`）里用。
    - 用 `skipLibCheck: true` 跳过 `.d.ts` 内部类型错误，避免第三方类型 bug 阻断编译。

---

## 七、工程化配置全解（tsconfig）

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": false,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "allowJs": true,          // 允许引入 JS
    "checkJs": false,         // 是否检查 JS（渐进迁移时开）
    "skipLibCheck": true,
    "isolatedModules": true,  // 配合 Vite/Babel 单文件编译
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
    "outDir": "dist",
    "declaration": true,      // 库项目生成 .d.ts
    "sourceMap": true
  }
}
```

| 选项 | 作用 | 建议 |
|------|------|------|
| `strict` | 全严格检查集合 | **必开** |
| `isolatedModules` | 兼容单文件转译（Vite/Babel） | 用打包器必开 |
| `esModuleInterop` | 兼容 `import React from 'react'` | 必开 |
| `moduleResolution: bundler` | TS5 新解析（支持 `exports` 字段） | TS5+ 推荐 |
| `skipLibCheck` | 跳过 `.d.ts` 检查 | 必开（提速+避三方 bug） |
| `noUnusedLocals/Parameters` | 未使用变量报错 | 推荐开 |
| `exactOptionalPropertyTypes` | `?` 不等于 `| undefined` | 极端严格，按需 |
| `declaration` | 生成 `.d.ts` | 仅库需要 |

!!! warning "isolatedModules 的雷"
    - 开启后**不能用 `const enum`**（单文件编译器无法内联跨文件）。
    - 重导出类型必须显式：`export type { Foo }` 而非 `export { Foo }`，否则 Babel/esbuild 误当值导出报错。
    - 条件类型靠 `import type` 避免运行时循环依赖。

---

## 八、渐进迁移策略（JS → TS）

```text
阶段 1：allowJs: true          —— 项目混入 .ts 与 .js 共存，不改旧代码
阶段 2：checkJs: true          —— 给 .js 加 JSDoc 类型，逐步类型化
阶段 3：逐文件改 .ts            —— 新文件一律 TS，旧文件按需迁移
阶段 4：strict: true           —— 最后开启全严格，修一批隐式 any
```

!!! tip "迁移纪律"
    - 用 `// @ts-ignore` / `// @ts-expect-error` 临时压制个别错误，`@ts-expect-error` 在错误消失时会**主动报错提醒你移除**（更安全）。
    - 第三方库无类型 → 写 `declare module` 或装 `@types/*`，别用 `any` 污染。
    - 大型项目用 **Project References** 拆分，避免全量类型检查过慢。

---

## 九、性能与兼容方案（编译/运行）

### 1. 编译产物兼容

| 需求 | 配置 |
|------|------|
| 兼容旧浏览器 | `target: ES2015`，Babel/tsc 降级语法 |
| 需要新 API（Promise 等） | 运行时引入 `core-js`（polyfill） |
| 减小体积 | `importHelpers: true` + `tslib`（复用 helper） |
| 单文件转译 | `isolatedModules: true`（Vite/esbuild/Babel） |

### 2. 类型检查慢的解决方案

- **Project References**：`tsconfig` 拆子项目，`tsc -b` 增量构建。
- **`skipLibCheck`**：跳过所有 `.d.ts` 检查，提速显著。
- **`incremental: true`**：生成 `.tsbuildinfo` 缓存增量编译。
- 超大代码库用 **esbuild/rspack** 做开发期转译（不检查），CI 用 `tsc --noEmit` 做类型门禁。

### 3. 装饰器兼容性

| 装饰器方案 | 配置 | 兼容性 |
|-----------|------|--------|
| 传统（TS） | `experimentalDecorators: true` | Angular/NestJS；需降 ES 版本 |
| TC39 标准 | `target: ES2022` + `useDefineForClassFields` | 新版浏览器；框架支持中 |

!!! danger "终极注意"
    - TS 编译后**类型信息全部擦除**，所以 `instanceof` 判断的是运行时构造器，`typeof` 判断的是运行时原始类型——**类型（编译期）不参与运行时逻辑**。
    - 任何时候浏览器跑的都是 JS，TS 只是开发期的"安全带"。上线前确保编译通过、类型无 `any` 泄漏。
    - 查兼容性用 **[Can I Use](https://caniuse.com)**（针对编译后的 JS 特性）+ **TS 官方 Release Notes**（针对语法支持版本）。

---

## 十一、类型安全与运行时安全的边界（闭环）

TypeScript 只在**编译期**保护你，运行时的安全漏洞（XSS / CSRF / 原型污染）它管不了——类型正确 ≠ 代码安全。

- 类型系统保驾护航：[TS 基础术语](terminology-basic.md) → 本篇进阶。
- 类型擦除后回归 JS：编译产物仍是 JS，运行时机制见 [JS 核心术语与语言基础](../js/terminology-basic.md) 与 [JS 高级进阶](../js/advanced-topics.md)。
- **类型无法防御的安全问题**：见 [前端安全全集](../security/index.md)（依据 OWASP Top 10）——例如 `string` 类型变量照样能装进 `innerHTML` 导致 XSS。
- 类型救不了性能：大对象深拷贝、事件循环阻塞等见 [浏览器渲染与性能总纲](../performance.md)（依据 web.dev）。
- 把类型当工具用 → [类型体操与 NestJS 实战](type-gymnastics.md)：自己实现工具类型、模板字面量、DTO + 装饰器校验。

# 🟦 TypeScript 类型基础与核心术语

> 本篇系统梳理 TypeScript 的**类型系统核心术语**与**基础类型用法**，并给出**注意事项**与**兼容性方案**。依据 **TypeScript 官方手册（typescriptlang.org/docs）**、**TypeScript Handbook**、**ECMA-262** 与 **MDN**。
>
> 核心认知：**TypeScript = JavaScript + 静态类型**。编译后类型被**擦除**，运行时仍是纯 JS——类型只在开发与编译期存在。

---

## 一、类型系统核心术语速查

| 术语 | 英文 | 定义 | 来源 |
|------|------|------|------|
| 静态类型 | Static Typing | 变量类型在编译期确定并检查 | TS 设计 |
| 结构化类型 | Structural Typing | 只要结构（形状）匹配即兼容（鸭子类型），不要求显式声明 | TS |
| 类型注解 | Type Annotation | 显式声明变量/参数类型 `: string` | TS |
| 类型推断 | Type Inference | 不写注解时编译器自动推断类型 | TS |
| 类型拓宽 | Type Widening | 字面量推断为更宽类型（`let x='a'` → `string`） | TS |
| 类型收窄 | Narrowing | 在分支内把宽泛类型缩小到具体类型 | TS |
| 字面量类型 | Literal Types | 类型是某个具体值（`'on' | 'off'`） | TS |
| 联合类型 | Union | `A \| B`，值可为任一成员 | TS |
| 交叉类型 | Intersection | `A & B`，合并两者成员 | TS |
| 类型守卫 | Type Guard | 运行时判断类型、助编译器收窄 | TS |
| 泛型 | Generics | 参数化类型 `<T>`，复用且不丢精度 | TS |
| 工具类型 | Utility Types | 内置类型变换函数 `Partial<T>` 等 | TS |
| 接口 | Interface | 描述对象/类的结构契约 | TS |
| 类型别名 | Type Alias | 为类型起名 `type A = ...` | TS |
| 枚举 | Enum | 命名常量集合（有反向映射） | TS |
| 元组 | Tuple | 已知长度与每元素类型的数组 | TS |
| 函数重载 | Overloads | 同一函数多组参数/返回签名 | TS |
| 索引签名 | Index Signature | `{ [key: string]: T }` 描述动态键 | TS |
| 映射类型 | Mapped Types | 遍历已有类型的键生成新类型 | TS |
| 条件类型 | Conditional Types | `T extends U ? X : Y` | TS |
| 装饰器 | Decorator | 修饰类/方法/属性的注解（实验性） | TS/TC39 |
| 声明文件 | `.d.ts` | 只含类型、无实现的文件 | TS |
| 类型断言 | Type Assertion | 告诉编译器"我比你更懂" `as` | TS |
| `any` | — | 关闭类型检查（逃生舱，危险） | TS |
| `unknown` | — | 类型安全版的 `any`（须先收窄） | TS |
| `never` | — | 永不存在的值（用于穷尽检查） | TS |
| `void` | — | 函数无返回值 | TS |

---

## 二、基础类型用法 + 注意事项

### 1. 原始类型与注解

```ts
let name: string = 'Tom';
let age: number = 18;
let isOk: boolean = true;
let u: undefined = undefined;
let n: null = null;
let big: bigint = 100n;            // ES2020 BigInt
let sym: symbol = Symbol('key');
```

!!! warning "注意事项"
    - `null` 与 `undefined`：默认在 `strictNullChecks` 开启时，它们**不能**赋给其他类型（`let x: string = null` 报错）。
    - `bigint` 与 `number` **不互通**，`1n === 1` 为 `false`，且不能混算 `1n + 1` 报错。
    - 推荐**少写注解**：TS 能推断就交给推断，只在推断不准确（如函数返回、对象字面量结构）时补注解。

### 2. 数组与元组

```ts
let list: number[] = [1, 2, 3];
let list2: Array<number> = [1, 2, 3];     // 泛型写法等价
// 元组：固定长度、每位置类型确定
let pair: [string, number] = ['age', 18];
pair[0].toUpperCase();                     // ✅ string 方法
// 可选元素 / 剩余元素
let t: [string, number?] = ['a'];
let rest: [string, ...number[]] = ['a', 1, 2, 3];
```

!!! warning "注意"
    - 越界访问元组（长度外）在 `strict` 下报错。
    - 只读数组用 `readonly number[]` 或 `ReadonlyArray<number>`，`const` 断言 `as const` 也能得到只读元组。

### 3. 枚举（Enum）—— 注意事项最多

```ts
enum Direction { Up, Down, Left, Right }   // 默认从 0 自增
Direction.Up;                              // 0
Direction[0];                             // 'Up'（反向映射）

enum Color { Red = '#f00', Green = '#0f0' } // 字符串枚举，无反向映射
const enum Size { S = 1, M, L }            // const enum：编译期内联，无运行时对象
```

!!! danger "枚举的四个坑"
    1. **数字枚举有反向映射**，会产生额外运行时对象，体积更大。
    2. **异构枚举**（`enum E { A=1, B='b' }`）极不推荐，类型混乱。
    3. **`const enum` 与 `isolatedModules` 冲突**：Vite/Babel 单文件编译时 `const enum` 不被支持（除非用 `preserveConstEnums` 或 tsc 直接编译），推荐用 **`as const` 对象字面量**替代。
    4. 枚举是 TS 独有，编译后仍有代码；若只要类型用 `type + union` 更轻量。

```ts
// 推荐替代枚举（零运行时、纯类型）
const Direction = { Up: 'Up', Down: 'Down' } as const;
type Direction = typeof Direction[keyof typeof Direction];
```

### 4. 接口 `interface` vs 类型别名 `type`

```ts
interface User { id: number; name: string; email?: string; }  // ? 可选
interface Admin extends User { role: string; }                // 可继承扩展

type Point = { x: number; y: number };
type Id = number | string;                                    // 联合
type Handler = (e: Event) => void;
```

| 维度 | `interface` | `type` |
|------|-------------|--------|
| 扩展方式 | `extends` 继承 / 声明合并 | `&` 交叉 |
| 声明合并 | ✅ 同名自动合并（利于 lib 扩展） | ❌ 不能重复声明 |
| 联合/交叉/映射 | ❌ | ✅ 支持 |
| 元组/基础类型别名 | ❌ | ✅ |
| 推荐场景 | 对象/类结构契约 | 联合、工具类型、复杂类型组合 |

!!! tip "选型建议"
    - 描述**对象/类公共契约**优先 `interface`（可声明合并、语义清晰）。
    - 需要**联合、交叉、映射、条件类型**用 `type`。
    - 现代风格：两者可混用，团队约定统一即可。

### 5. 函数类型

```ts
function add(a: number, b: number): number { return a + b; }
// 完整函数类型
type Fn = (a: number, b: number) => number;
// 可选 / 默认 / 剩余参数
function f(a: number, b?: string, c = 10, ...rest: number[]): void {}
// 函数重载
function reverse(x: string): string;
function reverse(x: number): number;
function reverse(x: string | number): string | number {
  return typeof x === 'string' ? x.split('').reverse().join('') : x.toString().split('').reverse().join('');
}
```

!!! warning "注意"
    - 重载只有**签名声明**参与类型检查，实现签名必须兼容所有重载且本身对外不可见。
    - 可选参数 `?` 与 `| undefined` 在 `strictNullChecks` 下略有差异：`?` 允许省略，`| undefined` 必须显式传 `undefined`。
    - 回调参数尽量标注类型，否则推断为 `any`（在 `noImplicitAny` 下报错）。

### 6. 类与访问修饰符

```ts
class Account {
  private balance = 0;            // 私有，类外不可访问（编译期）
  protected id: number;           // 子类可访问
  readonly owner: string;         // 只读，初始化后不可改
  public name: string;            // 默认 public
  #secret = 1;                    // # 真私有字段（运行时私有，ES2022）
  constructor(owner: string) { this.owner = owner; this.id = 1; }
  static total = 0;               // 静态
  deposit(n: number): void { this.balance += n; }
}
```

!!! danger "类的关键细节"
    - `private`/`protected` 是**编译期约束**，运行时仍可访问（反射能拿到）；要真正运行时私有用 `#字段`（ES2022）。
    - `implements` 只检查**结构**是否满足接口，不自动实现方法——方法仍需自己写。
    - 抽象类 `abstract class` 不能 `new`，强制子类实现 `abstract` 方法。
    - `parameter properties`：`constructor(private x: number)` 自动声明并赋值字段（语法糖）。

### 7. 字面量类型、联合与类型收窄

```ts
let dir: 'up' | 'down' = 'up';        // 字面量联合
type Status = 200 | 404 | 500;

// 类型收窄
function f(x: string | number) {
  if (typeof x === 'string') { x.toUpperCase(); }   // 此处 x 是 string
  else { x.toFixed(2); }                            // 此处 x 是 number
}
```

!!! warning "注意"
    - 字面量类型常用于**状态机 / 枚举替代**：比 `enum` 更轻量。
    - `typeof` / `in` / `instanceof` / `Array.isArray` 都是有效收窄手段。
    - `const` 声明 + 字面量会保留字面量类型（`const x = 'a'` → 类型是 `'a'`）；`let` 会被拓宽为 `string`（用 `as const` 阻止拓宽）。

### 8. `any` / `unknown` / `never` / `void` —— 四大"特殊类型"

```ts
let a: any = 1; a = 'x'; a.foo();         // 完全关闭检查，危险
let u: unknown = 1;                        // 安全：使用前必须收窄
if (typeof u === 'number') u.toFixed(2);
function fail(): never { throw new Error('x'); }  // 永不返回
function fn(): void {}                     // 无返回值
```

!!! danger "使用纪律"
    - **禁止 `any`**（ESLint `no-explicit-any`）——它污染调用链、失去 TS 价值。
    - 不确定类型用 **`unknown`**，使用时先收窄（类型安全）。
    - **`never`** 用于穷尽检查：`function exhaustive(x: never): never { throw ... }`，配合联合类型确保分支完整。
    - `void` 仅用于函数返回值语义；变量声明 `let v: void` 几乎无意义（只能赋 `undefined`）。

### 9. 泛型基础

```ts
function identity<T>(arg: T): T { return arg; }
const n = identity<number>(10);           // 显式
const s = identity('hi');                  // 推断 T=string
// 多参数 + 约束
function pick<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
```

!!! warning "注意"
    - 泛型默认用单字母（`T`/`U`/`K`/`V`），复杂场景用有意义的名字（`TItem`/`TKey`）。
    - 约束 `extends` 限制泛型范围，避免对未知类型调用不存在的属性。
    - 默认类型参数：`function f<T = string>()`。

---

## 三、兼容性方案（基础）

!!! danger "TS 必须编译"
    浏览器**不认识** `.ts` 文件，任何 TS 代码都必须编译成 JS 才能运行。三种主流编译方式：

| 工具 | 特点 | 适用 |
|------|------|------|
| `tsc` | 官方编译器，类型检查最完整 | 库、严谨项目 |
| `esbuild` | 极快，但**只擦除类型不检查**（需另跑 `tsc --noEmit` 检查） | 应用开发（Vite） |
| Babel (`@babel/preset-typescript`) | 单文件转译，支持 `isolatedModules` | 大型构建 |

### tsconfig 关键基础配置

```json
{
  "compilerOptions": {
    "target": "ES2020",          // 编译目标 JS 版本
    "module": "ESNext",          // 模块系统
    "moduleResolution": "bundler", // 模块解析策略（TS5 推荐）
    "strict": true,              // 开启全部严格检查（⭐ 必开）
    "lib": ["ES2020", "DOM"],    // 引入的标准库类型
    "outDir": "dist"
  },
  "include": ["src"]
}
```

!!! tip "新手铁律"
    1. **`strict: true` 必开**——它一次打开 `noImplicitAny`、`strictNullChecks`、`strictFunctionTypes` 等，是 TS 价值的核心。
    2. 浏览器不支持 TS → 必须编译；编译后类型消失，运行时报错只会是 JS 错误。
    3. 只装类型包（`@types/node` 等），运行时不需它们。

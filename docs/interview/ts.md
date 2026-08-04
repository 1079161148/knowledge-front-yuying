# 🟦 TypeScript 面试题

> 类型系统、泛型、类型体操、编译时 vs 运行时。依据 **[TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)**、**[TS 官方 release notes](https://devblogs.microsoft.com/typescript/)**。覆盖大厂高频核心题。

---

## 1. 类型系统基础

#### Q1：TS 和 JS 的核心区别？为什么类型会消失？
- TS 是 JS 超集，加静态类型；类型**只在编译期存在**，编译成 JS 时擦除（类型断言/接口都无运行时产物）。

#### Q2：interface 和 type 区别？怎么选？
- `interface`：描述对象/类结构，支持**声明合并**、可 `extends`/`implements`，适合对象契约。
- `type`：可表达联合 `|`、交叉 `&`、元组、条件类型、映射类型，不能重复声明。
- 约定：对象结构优先 `interface`，复杂组合用 `type`。

#### Q3：any / unknown / never / void 的区别？
- `any`：绕过检查，滥用失去 TS 价值（应开 `noImplicitAny`）。
- `unknown`：类型未知但**安全**，使用前必须收窄/断言。
- `never`：永不存在的值（抛错函数、穷尽检查默认分支）。
- `void`：函数无返回值（返回 undefined）。

#### Q4：readonly 和 const 区别？
- `readonly`：修饰**对象属性**不可重新赋值（嵌套引用仍可改，除非 `DeepReadonly`）。
- `const`：修饰**变量引用**不可变，但对象属性可变。

#### Q5：declare 和 var 区别？
- `var` 声明并生成 JS 代码；`declare` 仅类型声明，编译后无代码，常用于全局/DTS 或第三方库类型。

#### Q6：类型断言 vs 类型转换？
- 断言（`as` / `<T>`）只告诉编译器已知类型，**不影响运行时**；转换在运行时改变值。类型不对时断言会埋隐患。

---

## 2. 泛型与工具类型

#### Q7：泛型（Generics）的作用？
```ts
function identity<T>(arg: T): T { return arg }  // 保留类型信息又复用
```
- 泛型约束 `<T extends Lengthwise>`：限定范围，避免访问不存在的属性。

#### Q8：Partial / Pick / Omit / Record 怎么实现的？
```ts
type Partial<T> = { [K in keyof T]?: T[K] }
type Required<T> = { [K in keyof T]-?: T[K] }
type Readonly<T> = { readonly [K in keyof T]: T[K] }
type Pick<T, K extends keyof T> = { [P in K]: T[P] }
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
type Record<K extends keyof any, V> = { [P in K]: V }
```
- 实战：表单 `Partial<User>`、更新接口 `Omit<User, 'id'>`、字典 `Record<string, number>`。

#### Q9：keyof、索引访问、映射类型？
- `keyof T`：取键联合；`T[K]`：索引访问；映射 `{ [K in keyof T]: ... }`：批量改造属性。

---

## 3. 进阶与类型体操

#### Q10：条件类型与 infer？
```ts
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : any
type ParamType<T> = T extends (arg: infer P) => any ? P : never
```
- `infer` 在条件类型中"捕获"内部类型（提取 Promise 元素、数组项、函数返回值）。

#### Q11：类型守卫（type guard）如何实现？
```ts
function isDate(x: unknown): x is Date { return x instanceof Date }
// 收窄后分支内直接用 Date 方法
```
- 也可用 `typeof` / `in` / `instanceof` 收窄。

#### Q12：DeepPartial（深部分可选）？
```ts
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}
```

#### Q13：类型安全事件系统？
```ts
type EventMap = { click: {x:number;y:number}, keydown: {key:string} }
class Emitter<T extends Record<string, any>> {
  on<K extends keyof T>(event: K, handler: (payload: T[K]) => void) {}
}
```

#### Q14：tsconfig 关键配置？
- `strict`：开启所有严格检查（推荐）；`target`/`module`：编译目标；`noImplicitAny`；`strictNullChecks`：区分 `T` 与 `T | null`；`paths`：路径别名。

#### Q15：第三方 JS 库没有类型怎么办？
- 装 `@types/xxx`，或写 `.d.ts` + `declare module`，或用 `// @ts-ignore`（谨慎）。

---

## 4. 下一步

- 运行时逻辑看 [JavaScript 面试题](js.md)。
- 框架里的 TS 实践看 [框架面试题](framework.md)。

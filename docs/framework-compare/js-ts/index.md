# 🔤 JS vs TS 全方位对比

> TypeScript = JavaScript + 静态类型。本节按 **基础语法 → 核心类型 → 高级类型 → 框架集成 → 工程实践** 逐层对比，并给出真实业务场景与迁移策略。

---

## 一、基础：类型注解与原始类型

=== "JavaScript"
    ```js
    let name = 'Tom'      // 类型是"运行时才知"，可被任意重新赋值
    let age = 18
    name = 123           // ✅ 合法，但易埋 bug
    function add(a, b) { return a + b } // 参数无类型约束
    ```

=== "TypeScript"
    ```ts
    let name: string = 'Tom'
    let age: number = 18
    name = 123           // ❌ 编译错误：不能把 number 赋给 string
    function add(a: number, b: number): number { return a + b }
    add('1', 2)          // ❌ 参数类型不匹配
    ```

!!! abstract "核心差异"
    - JS 是**动态类型**：变量类型在运行时决定，灵活但易出运行期错误。
    - TS 是**静态类型**：类型在编译期检查，提前暴露错误，IDE 自动补全更强。
    - **TS 编译后类型会被擦除**，运行时仍是纯 JS —— 类型只存在于开发阶段。

---

## 二、核心：接口 / 类型别名 / 结构体

=== "JavaScript（靠约定/注释）"
    ```js
    // 没有原生"接口"，只能靠 JSDoc 注释约定
    /**
     * @typedef {{id:number,name:string}} User
     */
    function greet(user) { return 'hi ' + user.name }
    ```

=== "TypeScript"
    ```ts
    interface User {
      id: number
      name: string
      email?: string          // 可选属性
      readonly role: 'admin' | 'user' // 只读 + 字面量联合
    }
    type Point = { x: number; y: number } // 类型别名
    function greet(user: User): string { return 'hi ' + user.name }
    ```

!!! info "interface vs type"
    - `interface`：可**声明合并**（同名自动合并），适合描述对象/类的"形状"。
    - `type`：可为任意类型起别名（联合、交叉、元组），更灵活。
    - 一般对象结构用 `interface`，复杂类型运算用 `type`。

---

## 三、核心：泛型（复用 + 类型安全）

=== "JavaScript"
    ```js
    function first(arr) { return arr[0] }  // 返回类型丢失（any）
    ```

=== "TypeScript"
    ```ts
    function first<T>(arr: T[]): T | undefined { return arr[0] }
    const a = first([1, 2, 3])        // a: number | undefined
    const b = first(['x', 'y'])       // b: string | undefined
    // 框架中常见：React 的 useState<T>、Vue 的 Ref<T>
    ```

!!! tip "泛型的价值"
    写一个函数/组件，适配多种类型，**既复用又不丢类型**。框架 API（`useState<T>`、`ref<T>()`、`useFetch<T>()`）普遍依赖泛型。

---

## 四、高级：工具类型与类型运算

=== "TypeScript（内置工具类型）"
    ```ts
    interface User { id: number; name: string; age: number }
    type UserPreview = Pick<User, 'id' | 'name'>  // { id; name }
    type UserUpdate = Partial<User>               // 所有属性可选
    type ReadonlyUser = Readonly<User>            // 所有属性只读
    type Keys = keyof User                        // 'id' | 'name' | 'age'

    // 条件类型 + 映射类型
    type Nullable<T> = { [K in keyof T]: T[K] | null }
    ```

!!! warning "JS 没有对应物"
    工具类型是 TS 的"类型层面的函数"，JS 运行时完全不存在 —— 它们是**编译期**对类型的变换，编译后消失。

---

## 五、高级：类型推断与字面量类型

=== "TypeScript"
    ```ts
    const x = 1            // 推断为字面量类型 1（而非 number）
    let y = 1             // 推断为 number（可变所以用宽类型）
    const dir = 'left' as const  // 'left'（不可变字面量）
    type Direction = 'left' | 'right' | 'up' | 'down'
    function move(d: Direction) {}
    move('top')           // ❌ 不在联合内
    ```

!!! info "结构化类型（TS 的"鸭子类型"）"
    TS 比较类型看**结构**而非名字：只要对象"长得像"，就兼容——这与 Go/TS 一致，与 Java 的"名义类型"不同。

---

## 六、框架集成：Vue / React 中的 TS

### 6.1 Vue 3 + TS（`<script setup lang="ts">`）

```html
<script setup lang="ts">
import { ref, computed } from 'vue'
interface Product { id: number; name: string; price: number }
const products = ref<Product[]>([])
const total = computed(() =>
  products.value.reduce((s, p) => s + p.price, 0))
// defineProps 可写类型
const props = defineProps<{ title: string; count?: number }>()
</script>
```

### 6.2 React + TS

```tsx
interface Product { id: number; name: string; price: number }
function Cart({ products }: { products: Product[] }) {
  const total = products.reduce((s, p) => s + p.price, 0)
  return <span>合计：{total}</span>
}
// 事件类型
function Input({ onChange }: { onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return <input onChange={onChange} />
}
```

!!! tip "框架 TS 要点"
    - Vue：`defineProps<{}>` / `defineEmits<{}>` 写类型；`ref<T>()` 标注元素/对象类型。
    - React：Props 用 `interface`；事件用 `React.ChangeEvent<HTMLInputElement>` 等内置类型；`useState<Product[]>([])` 标注状态类型。

---

## 七、原理补充：TS 是怎么工作的

```text
.ts 源码 ──► tsc / vite(esbuild) / swc ──► 擦除类型 ──► 纯 .js
                │
                └─ 类型检查（仅此阶段报错，不进运行时）
```

!!! info "关键事实"
    - TS **不改动运行时行为**：类型错误不会让程序崩，只阻止"编译/打包通过"。
    - 类型检查可在 `tsc --noEmit` 单独跑；Vite 用 esbuild 只转译不检查（快），类型安全交给 `vue-tsc` / `tsc`。

---

## 八、真实业务场景

!!! question "场景 A：API 响应建模（杜绝 `any` 灾难）"
    ```ts
    interface ApiRes<T> {
      code: number
      message: string
      data: T
    }
    interface User { id: number; name: string }
    async function getMe(): Promise<ApiRes<User>> {
      return (await fetch('/api/me')).json()
    }
    // 调用处 data 自动获得 User 类型提示
    ```

!!! question "场景 B：表单状态类型"
    ```ts
    type FormState = {
      name: string
      age: number
      agree: boolean
    }
    // 配合 React useState<FormState> 或 Vue reactive<FormState>
    ```

!!! question "场景 C：渐进迁移 JS → TS"
    1. 文件 `.js` → `.ts`，先允许 `any`（`"strict": false`）。
    2. 开 `strict: true`，逐个文件消除 `any`。
    3. 公共模块（API、类型定义）优先类型化，`*.d.ts` 补充第三方无类型库。

!!! danger "踩坑清单"
    - **`any` 是类型系统的"逃生舱"**，滥用等于退回 JS——用 `unknown` 替代（需收窄才能用）。
    - **`enum` 会生成运行时代码**，若只想要联合类型用 `const enum` 或字面量联合。
    - **TS 类型不影响运行时**：`as` 断言是"你比编译器更懂"，错用会运行时崩。
    - **第三方库无类型**：装 `@types/xxx`，没有就写 `declare module 'xxx'`。

---

## 九、速查表

| 主题 | JavaScript | TypeScript |
|------|-----------|-----------|
| 变量类型 | 动态、运行时定 | 静态、编译期定 |
| 函数参数 | 无约束 | 可标注类型 |
| 对象结构 | 靠约定 | `interface` / `type` |
| 复用 | 无泛型 | 泛型 `<T>` |
| 类型运算 | 无 | 工具类型 / 映射类型 |
| 错误暴露 | 运行期 | 编译期 |
| 运行时产物 | JS | 擦除类型后的 JS |

---

[← 上一节：实战场景集](../scenarios/index.md)  ·  [返回总览](../index.md)

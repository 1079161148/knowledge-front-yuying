# 🧩 组件化开发

> 组件化 = 把 UI 拆成**独立、可复用、自包含**的单元，每个组件管自己的结构/样式/行为。本篇讲清组件设计原则、原子设计、受控/非受控、状态提升、样式隔离与组件库治理。
>
> 权威来源：[React 组件文档](https://react.dev/learn/your-first-component)、[Vue 组件基础](https://vuejs.org/guide/essentials/component-basics.html)、[Atomic Design（Brad Frost）](https://bradfrost.com/blog/post/atomic-web-design/)。

---

## 1. 术语表

- **原子设计（Atomic Design）**：把 UI 分为 Atom（按钮/输入）→ Molecule（搜索框）→ Organism（卡片）→ Template → Page 五层。
- **受控组件（Controlled）**：表单值由父级 state 驱动，单一数据源（React 主流）。
- **非受控组件（Uncontrolled）**：DOM 自己管值，用 `ref` 读取（Vue 用 `ref`/React 用 `useRef`）。
- **状态提升（Lifting State Up）**：多个组件共享状态 → 提到最近公共父级。
- **复合组件（Compound Components）**：一组协作组件（如 `Tabs` + `Tab`），共享隐式状态。

---

## 2. 设计原则（写好组件的标准）

1. **单一职责**：一个组件只做一件事，体积可控（建议 < 200 行）。
2. **可预测 Props**：Props 是只读输入，组件不应修改 props（React 强制；Vue 也不要直接改）。
3. **高内聚**：结构、样式、逻辑尽量收敛在组件内。
4. **可组合**：通过 `children` / slot 让组件可被包裹复用。
5. **无副作用的渲染**：渲染函数里不要发请求/改全局，副作用放 `useEffect`/`watch`/`onMounted`。

!!! danger "组件设计的反面"
    - **巨型组件**：一个文件 800 行，改一处崩一片。
    - **透传 props 地狱**：`<A a={a} b={b} c={c} .../>` 把 20 个 prop 层层透传 → 用 `Context`/`provide-inject` 或复合组件。
    - **在渲染里改 props/state**：会导致无限渲染或不可预测更新。

---

## 3. 原子设计落地示例

```
src/components/
  atoms/      Button.vue  Input.vue  Icon.vue
  molecules/  SearchBar.vue  FormField.vue
  organisms/  UserCard.vue  NavBar.vue
  templates/  DashboardLayout.vue
  pages/      HomePage.vue
```

适合中大型设计系统；小项目不必死板套五层，但"基础组件 / 业务组件"两层划分几乎必做。

---

## 4. 受控 vs 非受控（表单）

=== "React 受控"
    ```jsx
    function Form() {
      const [val, setVal] = useState('')
      return <input value={val} onChange={e => setVal(e.target.value)} />
    }
    ```

=== "Vue 受控（v-model）"
    ```html
    <input :value="val" @input="val = $event.target.value" />
    <!-- 等价于 --> <input v-model="val" />
    ```

!!! danger "受控组件的常见错误"
    - React 忘了写 `onChange` → 输入框变成只读且控制台警告。
    - 大表单每个字段都 `useState` → 用 `useReducer` 或表单库（React Hook Form / Formik）统一管理。
    - 非受控场景硬改 DOM 值 → 视图与 state 脱节。

---

## 5. 状态提升与复合组件

```jsx
// 状态提升：温度换算，两个输入框共享 celsius
function Boiling() {
  const [c, setC] = useState(0)
  return <>
    <input value={c} onChange={e => setC(+e.target.value)} />
    <Fahrenheit c={c} />
  </>
}
// 复合组件：Tabs 与 Tab 共享选中态
<Tabs>
  <Tab label="A">内容A</Tab>
  <Tab label="B">内容B</Tab>
</Tabs>
```

---

## 6. 样式隔离

| 方案 | 机制 | 适用 |
|------|------|------|
| Vue `scoped` | 编译加 `data-v-xxx` 属性选择器 | Vue SFC 默认 |
| CSS Modules | 类名哈希（`styles.btn`） | React/Vue 通用 |
| Shadow DOM | 浏览器原生隔离 | Web Component |
| BEM 命名约定 | 人工约定前缀 | 无构建老项目 |

!!! danger "样式隔离的坑"
    - `scoped` 只隔离当前组件，**深层子组件样式不穿透**；要穿透用 `:deep()`（Vue）/ `:global()`。
    - CSS Modules 忘了 `import styles from './x.module.css'`，写成普通 `className="btn"` 会失效。
    - 全局样式（reset、变量）放在独立 global 文件，别混进组件 scope。

---

## 7. 组件库治理

- **对外 API 稳定**：Props 改名/删除走 `deprecated` 标记 + 文档说明，避免破坏性升级。
- **文档化**：用 [Storybook](../docs-and-env/index.md) 给每个组件写用例与视觉回归。
- **可访问性（a11y）**：按钮用 `<button>`、图标按钮加 `aria-label`、表单关联 `label`。

---

## 8. 自检清单

- [ ] 我的组件单一职责、体积可控
- [ ] 我用 Props 作为输入，不在组件内改 props
- [ ] 表单场景选了受控/非受控并正确实现
- [ ] 共享状态做了提升或用 Context/provide-inject
- [ ] 组件样式做了隔离（scoped / CSS Modules）
- [ ] 重要组件有 Storybook 用例与 a11y 检查

---

## 9. 下一步

- 组件怎么被构建工具打包 → [构建工具](../build-tools/index.md)
- 组件间状态共享进阶 → [框架状态管理](../../framework-compare/state-management/index.md)
- 组件文档化 → [文档生成与环境变量](../docs-and-env/index.md)

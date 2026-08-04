# 🛠️ 框架上手实战：Vue3 vs React 最小可运行

> 接续 [基础语法·框架对比](index.md)。本篇是**新人第一篇框架实战**——不堆概念，直接用 Vue3（组合式 API）和 React（Hooks）各写一个"待办清单（Todo）"最小应用，跑起来看效果，再对比心智模型。依据 **Vue 官方指南**、**React 官方文档（beta）**、**ECMA-262**。
>
> 适用：**全等级**——新人照抄跑通、中级理解两框架差异、高级做技术选型。前置：[ES6+ 特性](../js/es6-modern-js.md)、[前后端交互](../js/ajax-http.md)。

---

## 一、环境：用 CDN 30 秒跑起来（无需构建）

> 培训第一节常让你配脚手架，这里先用 **CDN + 原生 ESM** 零配置跑通，理解"框架本质就是 JS"。工程化脚手架见 [工程化](../engineering/index.md)。

### 1.1 Vue3（组合式 API）

```html
<div id="app">
  <input v-model="text" @keyup.enter="add" />
  <button @click="add">添加</button>
  <ul>
    <li v-for="t in todos" :key="t.id">{{ t.text }}
      <button @click="remove(t.id)">x</button>
    </li>
  </ul>
</div>

<script type="module">
  import { createApp, ref } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';
  createApp({
    setup() {
      const text = ref('');
      const todos = ref([]);
      let id = 1;
      const add = () => {
        if (!text.value.trim()) return;
        todos.value.push({ id: id++, text: text.value });
        text.value = '';
      };
      const remove = (tid) => { todos.value = todos.value.filter(t => t.id !== tid); };
      return { text, todos, add, remove };
    }
  }).mount('#app');
</script>
```

### 1.2 React（Hooks + Babel 内联编译）

```html
<div id="root"></div>
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<script type="text/babel">
  const { useState } = React;
  function App() {
    const [text, setText] = useState('');
    const [todos, setTodos] = useState([]);
    let id = 1;
    const add = () => {
      if (!text.trim()) return;
      setTodos([...todos, { id: id++, text }]);
      setText('');
    };
    const remove = (tid) => setTodos(todos.filter(t => t.id !== tid));
    return (
      <div>
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} />
        <button onClick={add}>添加</button>
        <ul>
          {todos.map(t => <li key={t.id}>{t.text} <button onClick={() => remove(t.id)}>x</button></li>)}
        </ul>
      </div>
    );
  }
  ReactDOM.createRoot(document.getElementById('root')).render(<App />);
</script>
```

!!! tip "两个框架一句话区别"
    - **Vue**：模板 `{{ }}` + 指令（`v-if/v-for/@click`），`ref` 自动解包，`setup` 返回即用。
    - **React**：JSX 即 JS，`useState` 返回 `[值, setter]`，**状态不可变**（用 `setTodos([...])` 新数组，见 [ES6 展开](../js/es6-modern-js.md)）。

---

## 二、心智模型对比

| 维度 | Vue3 组合式 | React Hooks |
|------|-------------|-------------|
| 状态 | `ref()` / `reactive()`，自动追踪 | `useState`，手动 setter |
| 计算 | `computed()` | 普通函数 / `useMemo` |
| 副作用 | `watch()` / `watchEffect()` | `useEffect` |
| 渲染 | 模板 + 指令 | JSX |
| 更新机制 | 响应式依赖收集（Proxy） | 状态引用变化触发重渲染 |

!!! danger "死角 1：React 状态是异步批处理的"
    `setTodos` 后立刻 `console.log(todos)` 仍是旧值。要基于上一状态更新用函数式：`setTodos(prev => [....prev, x])`，避免闭包陷阱（见 [JS 基础·闭包](../js/foundation.md)）。

!!! danger "死角 2：Vue 的 `ref` 在 JS 里要 `.value`"
    模板里不用 `.value`（编译自动解包），`<script>` 里必须 `count.value`。`reactive` 对象整体不能重新赋值（会断代理），用 `Object.assign` 或改用 `ref`。

---

## 三、接真实接口（串起前后端交互）

把上面 `add` 改成调接口（见 [前后端交互](../js/ajax-http.md)）：

```js
// Vue 版 add 改造
import { ref } from 'vue';
const add = async () => {
  const res = await fetch('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: text.value }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const created = await res.json();
  todos.value.push(created);
};
```

---

## 四、下一步学什么

- 组件拆分、Props/emit、状态管理（Pinia/Redux）→ [框架对比·组件通信](components/index.md)
- 路由 → [框架对比·路由](routing/index.md)
- 响应式原理（Proxy/依赖收集）→ [框架对比·响应式](reactivity/index.md)
- 工程化脚手架(Vite) → [工程化](../engineering/index.md)

## 五、上手自检清单

- [ ] 用 CDN 零配置跑通 Vue3 Todo
- [ ] 用 CDN 零配置跑通 React Todo
- [ ] 说清 `ref` vs `useState` 的差异
- [ ] 理解 React 状态不可变（函数式更新）
- [ ] 把 Todo 接到真实接口（fetch + 错误判断）

> 衔接：框架语法全对比见 [总览与原理](index.md)；ES6 语法基础见 [ES6+ 特性](../js/es6-modern-js.md)；前后端交互见 [Ajax/Fetch](../js/ajax-http.md)。

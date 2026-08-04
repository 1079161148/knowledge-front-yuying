# 🛠️ 实战场景集（Tab 对比 + 可运行 Demo）

> 把前面学到的语法落进 **真实业务**。每个场景都先给 **三框架 Tab 代码对比**，再给 **可运行 Demo / 注意事项**。建议边读边在 Demo 里改代码试运行。

---

## 场景一：搜索过滤（派生状态 + 列表渲染）

=== "Vue 3"
    ```html
    <script setup>
    import { ref, computed } from 'vue'
    const keyword = ref('')
    const list = ref(['Apple','Banana','Cherry','Date'])
    const filtered = computed(() =>
      list.value.filter(i => i.toLowerCase().includes(keyword.value.toLowerCase())))
    </script>
    <template>
      <input v-model="keyword" placeholder="搜索水果" />
      <ul><li v-for="i in filtered" :key="i">{{ i }}</li></ul>
    </template>
    ```

=== "Vue 2"
    ```html
    <script>
    export default {
      data() { return { keyword: '', list: ['Apple','Banana','Cherry','Date'] } },
      computed: {
        filtered() {
          return this.list.filter(i => i.toLowerCase().includes(this.keyword.toLowerCase()))
        }
      }
    }
    </script>
    <template>
      <input v-model="keyword" placeholder="搜索水果" />
      <ul><li v-for="i in filtered" :key="i">{{ i }}</li></ul>
    </template>
    ```

=== "React"
    ```jsx
    import { useState, useMemo } from 'react'
    export function Search() {
      const [keyword, setKeyword] = useState('')
      const list = ['Apple', 'Banana', 'Cherry', 'Date']
      const filtered = useMemo(
        () => list.filter(i => i.toLowerCase().includes(keyword.toLowerCase())),
        [keyword]
      )
      return (
        <div>
          <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="搜索水果" />
          <ul>{filtered.map(i => <li key={i}>{i}</li>)}</ul>
        </div>
      )
    }
    ```

!!! tip "要点"
    - 过滤逻辑放 **派生状态**（`computed`/`useMemo`），原始数据不变。
    - 列表必须带稳定 `key`。

---

## 场景二：表单 + 实时校验（受控 / v-model + watch）

=== "Vue 3"
    ```html
    <script setup>
    import { reactive, computed } from 'vue'
    const form = reactive({ email: '' })
    const error = computed(() =>
      /\S+@\S+\.\S+/.test(form.email) ? '' : '邮箱格式不正确')
    </script>
    <template>
      <input v-model="form.email" placeholder="邮箱" />
      <p v-if="error" style="color:#f66">{{ error }}</p>
    </template>
    ```

=== "React"
    ```jsx
    import { useState } from 'react'
    export function Form() {
      const [email, setEmail] = useState('')
      const error = /\S+@\S+\.\S+/.test(email) ? '' : '邮箱格式不正确'
      return (
        <div>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="邮箱" />
          {error && <p style={{ color: '#f66' }}>{error}</p>}
        </div>
      )
    }
    ```

!!! warning "踩坑"
    - React 里校验结果 `error` 每次渲染都重算——小开销无所谓；若校验昂贵，用 `useMemo` 包一层。
    - Vue 里校验放 `computed` 天然缓存，最省心。

---

## 场景三：可运行 Demo（表单绑定，代码 + 实时预览）

<iframe src="../../demos/compare-form.html" width="100%" height="460" style="border:1px solid #2c5364;border-radius:8px"></iframe>

---

## 场景四：待办应用（综合：列表 / 事件 / 状态 / 派生）

<iframe src="../../demos/compare-todo.html" width="100%" height="540" style="border:1px solid #2c5364;border-radius:8px"></iframe>

---

## 场景五：请求数据 + 加载/错误态（逻辑复用）

=== "Vue 3（组合式函数）"
    ```js
    // useFetch.js
    import { ref } from 'vue'
    export function useFetch(url) {
      const data = ref(null), loading = ref(true), error = ref(null)
      fetch(url).then(r => r.json()).then(d => data.value = d)
        .catch(e => error.value = e).finally(() => loading.value = false)
      return { data, loading, error }
    }
    ```

=== "React（自定义 Hook）"
    ```js
    // useFetch.js
    import { useState, useEffect } from 'react'
    export function useFetch(url) {
      const [data, setData] = useState(null)
      const [loading, setLoading] = useState(true)
      const [error, setError] = useState(null)
      useEffect(() => {
        fetch(url).then(r => r.json()).then(setData)
          .catch(setError).finally(() => setLoading(false))
      }, [url])
      return { data, loading, error }
    }
    ```

!!! info "对比结论"
    组合式函数与自定义 Hook **结构完全一致**：返回 `{ data, loading, error }`，组件内用法相同。这正是"框架无关的逻辑复用思维"。

---

## 场景六：模态框（挂载/卸载 + 跨层关闭）

=== "Vue 3"
    ```html
    <script setup>
    import { ref } from 'vue'
    const open = ref(false)
    </script>
    <template>
      <button @click="open = true">打开</button>
      <Teleport to="body">
        <div v-if="open" class="mask" @click.self="open = false">
          <div class="dialog"><slot /></div>
        </div>
      </Teleport>
    </template>
    ```

=== "React"
    ```jsx
    function Modal({ open, onClose, children }) {
      if (!open) return null
      return (
        <div className="mask" onClick={e => e.target === e.currentTarget && onClose()}>
          <div className="dialog">{children}</div>
        </div>
      )
    }
    // 使用：<Modal open={open} onClose={() => setOpen(false)}>...</Modal>
    ```

!!! danger "踩坑清单（综合）"
    - **Vue**：`Teleport` 解决"被父级 `overflow:hidden`/`z-index` 裁剪"问题；`@click.self` 避免点内容区误关。
    - **React**：模态框用 `if (!open) return null` 卸载；动画退出需用状态延迟卸载（或库如 `framer-motion`）。
    - **通用**：打开模态框时记得锁 body 滚动、Esc 关闭、点击遮罩关闭——这些交互三框架实现思路一致。

---

[← 上一节：高级模式与性能](../advanced/index.md)  ·  [下一节：JS vs TS 全方位 →](../js-ts/index.md)

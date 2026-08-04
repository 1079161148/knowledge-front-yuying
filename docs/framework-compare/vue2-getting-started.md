# 🟢 Vue 2 上手实战（Options API · 老项目维护刚需）

> 接续 [框架上手实战（Vue3 vs React）](getting-started.md)。本篇专讲 **Vue 2（Options API）最小可运行**——因为市场仍有大量 Vue 2 存量项目需要维护（Vue 2 于 2023-12-31 终止官方支持，进入 EOL，但归档文档仍可用）。依据 **Vue 2 官方文档（v2.vuejs.org，EOL 归档）**、**Vue Router 3 文档**、**Vuex 3 文档**、**MDN**。
>
> 适用：维护 Vue 2 老项目的开发者、需要"Vue2→Vue3 迁移"认知的团队、面试被问"你会 Vue2 吗"的求职者。前置：[ES6+ 特性](../js/es6-modern-js.md)。

!!! warning "EOL 声明（务必先读）"
    Vue 2 已于 **2023-12-31 终止官方维护（EOL）**，不再接收安全更新。**新项目请用 Vue 3**（见 [Vue3 上手](getting-started.md)）。本篇仅用于维护存量代码与迁移准备，不推荐用于新开发。

---

## 一、零配置跑通（CDN）

```html
<div id="app">
  <input v-model="text" @keyup.enter="add" />
  <button @click="add">添加</button>
  <ul>
    <li v-for="t in todos" :key="t.id">{{ t.text }}
      <button @click="remove(t.id)">x</button>
    </li>
  </ul>
  <p>总数：{{ todos.length }}</p>
</div>

<script src="https://unpkg.com/vue@2/dist/vue.js"></script>
<script>
  new Vue({
    el: '#app',
    data() {
      return { text: '', todos: [], id: 1 };
    },
    methods: {
      add() {
        const v = this.text.trim();
        if (!v) return;
        this.todos.push({ id: this.id++, text: v });
        this.text = '';
      },
      remove(tid) {
        this.todos = this.todos.filter(t => t.id !== tid);
      },
    },
  });
</script>
```

!!! danger "死角 1：Vue 2 不能监听新增属性"
    `this.todos[0].done = true` 不会触发更新。必须用 `Vue.set(obj, 'done', true)` 或整体替换。这是 `Object.defineProperty` 的根本限制（见 [响应式原理](reactivity/index.md)）。

---

## 二、工程化（Vue CLI）

```bash
npm install -g @vue/cli
vue create my-vue2-app      # 选择 Vue 2 预设
cd my-vue2-app && npm run serve
```

!!! tip "Vue CLI vs Vite"
    Vue 2 官方脚手架是 **Vue CLI（基于 Webpack）**；Vue 3 现代用 **Vite**。若老项目想上 Vite，可用 `vite-plugin-vue2`，但属非官方迁移方案。

---

## 三、Vue Router 3（Vue 2 路由）

```js
import Vue from 'vue';
import Vue Router from 'vue-router';
Vue.use(Vue Router);

const router = new Vue Router({
  mode: 'history',
  routes: [{ path: '/', component: Home }],
});

// 组件中
// this.$route.params.id
// this.$router.push('/user/1')
```

!!! danger "死角 2：路由守卫用 `next()`"
    Vue Router 3 守卫必须调用 `next()`（或 `next(false)` 取消），漏调用会卡死导航。Vue Router 4 已改为"返回 false / 路由对象"语义（见 [路由对比](routing/index.md)）。

---

## 四、Vuex 3（Vue 2 状态管理）

```js
import Vue from 'vue';
import Vuex from 'vuex';
Vue.use(Vuex);

const store = new Vuex.Store({
  state: { count: 0 },
  getters: { double: s => s.count * 2 },
  mutations: { increment(s) { s.count++ } },        // 必须同步
  actions: { asyncInc({ commit }) { commit('increment'); } },
});

// 组件中
// this.$store.state.count
// this.$store.commit('increment')
```

!!! danger "死角 3：mutation 必须同步"
    Vuex 3 的 mutation 用来追踪状态变更（DevTools 时间旅行），**不能异步**。异步放 action，再 `commit` mutation。Vue 3 的 Pinia 取消了这一限制（见 [状态管理对比](state-management/index.md)）。

---

## 五、Vue 2 → Vue 3 迁移认知

| 点 | Vue 2 | Vue 3 |
|----|-------|-------|
| API 风格 | Options API | Composition API（兼容 Options） |
| 响应式 | `Object.defineProperty` | `Proxy` |
| 状态 | Vuex 3 | Pinia（推荐） |
| 路由 | Vue Router 3 | Vue Router 4 |
| 根挂载 | `new Vue()` | `createApp()` |

详细破坏性变更见 [Vue 3.5 迁移指南](vue3-5-migration.md)。

## 六、Vue 2 自检清单

- [ ] 用 CDN 跑通 Vue 2 Todo
- [ ] 知道 `Vue.set` 解决新增属性不响应
- [ ] 会配 Vue Router 3 + 守卫 `next()`
- [ ] 理解 Vuex 3 的 mutation 同步限制
- [ ] 知道 Vue 2 已 EOL，新项目用 Vue 3
- [ ] 能说清 Vue2→Vue3 的核心差异

> 衔接：Vue 3/React 上手见 [框架上手实战](getting-started.md)；响应式原理见 [响应式与状态管理](reactivity/index.md)；路由/状态管理完整对比见对应专栏；迁移见 [Vue 3.5 迁移指南](vue3-5-migration.md)。

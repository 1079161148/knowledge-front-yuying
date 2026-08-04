# 🧩 综合实战：从 0 搭一个 CRUD 小应用（串起全栈主干）

> 接续 [全栈框架实战](index.md) 与 [框架上手实战](../framework-compare/getting-started.md)。本篇把前面所有知识点**串成一条线**：用 Vue3 + Vite + Node(Express) + 一个数据库，做一个"用户管理 CRUD"。每步标注用到了哪些前面学的概念，形成"知识闭环"。依据 **Vue 官方指南**、**Vite 文档**、**Express 文档**、**MDN**。
>
> 适用：**全等级**——新人照做跑通第一fullstack项目、中级理解分层、高级做架构延伸。

---

## 一、架构全景

```
浏览器(Vue3)  ──fetch──▶  Node/Express API  ──▶  数据库(SQLite)
     ↑                                              │
     └──────────  JSON 响应  ◀─────────────────────┘
```

用到的知识：
- 前端：[HTML/CSS 布局](../html-css/layout.md)、[Vue3 上手](../framework-compare/getting-started.md)、[前后端交互](../js/ajax-http.md)
- 后端：[给后端的前端速通](../basics/backend-to-frontend.md)
- 工程：[Vite](../engineering/index.md)、[Git 素养](../basics/dev-basics.md)
- 安全/性能：[安全全集](../security/index.md)、[性能总纲](../performance.md)

---

## 二、前端（Vue3 + Vite）

```bash
npm create vite@latest user-admin -- --template vue
cd user-admin && npm install
```

`src/App.vue` 核心：

```vue
<script setup>
import { ref, onMounted } from 'vue';
const users = ref([]);
const form = ref({ name: '', age: '' });
const load = async () => {
  const res = await fetch('/api/users');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  users.value = await res.json();
};
const save = async () => {
  await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form.value),
  });
  form.value = { name: '', age: '' };
  await load();
};
const remove = async (id) => {
  await fetch(`/api/users/${id}`, { method: 'DELETE' });
  await load();
};
onMounted(load);   // 生命周期钩子：挂载即拉数据
</script>

<template>
  <form @submit.prevent="save">
    <input v-model="form.name" placeholder="姓名" />
    <input v-model.number="form.age" placeholder="年龄" />
    <button>保存</button>
  </form>
  <ul>
    <li v-for="u in users" :key="u.id">{{ u.name }} / {{ u.age }}
      <button @click="remove(u.id)">删除</button>
    </li>
  </ul>
</template>
```

!!! danger "死角 1：devServer 代理解决跨域"
    Vite 默认 5173，后端 3000，直接 fetch `/api` 跨域。在 `vite.config.js` 配 `server.proxy.{ '/api': { target: 'http://localhost:3000' } }`，前端只写 `/api/users`（见 [前后端交互·代理](../js/ajax-http.md)）。

---

## 三、后端（Node + Express + SQLite）

```bash
npm init -y && npm i express better-sqlite3 cors
```

`server.js`：

```js
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const db = new Database(':memory:');
db.exec('CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, age INT)');

const app = express();
app.use(cors());                 // 生产应按需配置（见安全）
app.use(express.json());         // 解析 JSON body

app.get('/api/users', (_, res) => res.json(db.prepare('SELECT * FROM users').all()));
app.post('/api/users', (req, res) => {
  const { name, age } = req.body;
  if (!name) return res.status(400).json({ error: 'name 必填' });   // 后端校验！
  const info = db.prepare('INSERT INTO users (name, age) VALUES (?, ?)').run(name, age);
  res.status(201).json({ id: info.lastInsertRowid, name, age });
});
app.delete('/api/users/:id', (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.status(204).end();
});
app.listen(3000, () => console.log('API on :3000'));
```

!!! danger "死角 2：永远后端再校验一次"
    前端校验只是体验，黑客可直接发请求绕过。后端必须重新校验（见 [前端安全全集·输入校验](../security/index.md)）。

!!! warning "安全关联"
    `cors()` 默认允许所有源，生产应指定白名单；SQL 用参数化（占位符 `?`）防注入，禁止字符串拼接（OWASP A03）。详见 [安全全集](../security/index.md)。

---

## 四、联调与部署要点

| 步骤 | 用到 |
|------|------|
| Git 提交（锁文件、.gitignore） | [开发素养](../basics/dev-basics.md) |
| 构建 `npm run build` → `dist/` | [工程化·Vite](../engineering/index.md) |
| Nginx 反向代理 + HTTPS | [浏览器网络通识](../advanced/browser-network.md)、[安全全集](../security/index.md) |
| 缓存静态资源（内容哈希） | [性能总纲](../performance.md) |

---

## 五、项目自检清单

- [ ] 独立跑通前端 Vue3 + 后端 Express
- [ ] devServer 代理解决跨域
- [ ] 实现增删查（CRUD）全链路
- [ ] 后端做了参数校验
- [ ] SQL 参数化防注入
- [ ] 用 Git 提交（含锁文件）
- [ ] 理解生产部署的 Nginx + HTTPS + 缓存

> 衔接：框架深入见 [框架对比专栏](../framework-compare/index.md)；全栈框架（Next/Nest）见 [全栈框架实战](index.md)；性能/安全见对应总纲。

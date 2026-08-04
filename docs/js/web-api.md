# 🌐 DOM / BOM 操作与 Web API 实战

> [JS 基础](foundation.md) / [JS 高级进阶](advanced-topics.md) 偏"语言核心"，本篇补齐 **JS 与页面、与后端对话的桥梁**：DOM 操作、事件、浏览器存储、网络请求（Fetch）、常用 Web API。依据 **WHATWG DOM 标准**、**W3C**、**MDN**。
>
> 适用：所有开发者——前端写交互、后端理解"前端到底怎么调我接口"。

---

## 一、DOM：文档对象模型

浏览器把 HTML 解析成树，JS 通过 `document` 操作这棵树。

```js
// 查
const el = document.querySelector('#app');
const items = document.querySelectorAll('.item');   // NodeList
// 增
const div = document.createElement('div');
div.textContent = '新节点';
el.appendChild(div);
// 改
el.classList.add('active');
el.style.color = 'red';
el.setAttribute('data-id', '1');
// 删
el.remove();
```

!!! danger "死角 1：querySelectorAll 不是数组"
    它是 `NodeList`，没有 `map/filter`。转数组：`[...items].map(...)` 或 `Array.from(items)`。

!!! tip "性能：缓存 DOM 引用"
    频繁操作同一元素时把 `const el = document.querySelector(...)` 提出来，避免每次查 DOM（重排代价高）。

---

## 二、事件：用户交互的入口

```js
btn.addEventListener('click', (e) => {
  e.preventDefault();          // 阻止默认行为（如表单提交跳转）
  console.log(e.target);       // 实际触发元素
});

// 事件委托（重点！）
list.addEventListener('click', (e) => {
  if (e.target.matches('li')) {
    console.log('点了', e.target.textContent);  // 动态新增的 li 也能响应
  }
});
```

!!! danger "死角 2：事件委托必须在父级监听"
    给每个 `li` 单独 `addEventListener` 在 `li` 动态增删时会失效；用事件委托（监听不变的共同父级）天然支持动态内容，且省内存。

!!! tip "卸载别忘了"
    SPA 组件销毁时移除监听（`removeEventListener`），否则内存泄漏（见 [JS 高级进阶](advanced-topics.md) 内存章节）。

---

## 三、浏览器存储（前端"数据库"）

| API | 容量 | 生命周期 | 场景 |
|-----|------|----------|------|
| `localStorage` | ~5MB | 永久（手动清） | 记住登录 token、主题 |
| `sessionStorage` | ~5MB | 标签页关闭即清 | 临时表单草稿 |
| `cookie` | ~4KB | 可设过期 | 后端会话（自动随请求发送） |
| `IndexedDB` | 数百 MB | 永久 | 离线应用、大量结构化数据 |

```js
localStorage.setItem('token', 'abc');
const t = localStorage.getItem('token');
localStorage.removeItem('token');

// cookie 由后端 Set-Cookie 下发，JS 可读 document.cookie（受 HttpOnly 限制）
```

!!! danger "死角 3：localStorage 只能存字符串"
    `setItem('k', {a:1})` 存进去的是 `"[object Object]"`。对象要先 `JSON.stringify`，取回 `JSON.parse`。

!!! danger "死角 4：别在 localStorage 存敏感信息"
    token 可被 XSS 窃取。敏感鉴权用 `HttpOnly` + `Secure` cookie（见 [前端安全全集](../security/index.md)）。

---

## 四、Fetch：前端调后端的姿势

```js
// GET
const res = await fetch('/api/users');
const data = await res.json();

// POST
const r = await fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: '鱼樱' }),
});
if (!r.ok) throw new Error('HTTP ' + r.status);
const created = await r.json();
```

!!! danger "死角 5：fetch 不抛网络错误以外的异常"
    HTTP 404/500 **不会** reject，只有断网才 reject。必须 `if (!res.ok)` 手动判断。

!!! tip "封装建议"
    项目里别裸写 fetch，封装一层统一加 `baseURL`、token、错误处理，放在 `src/api/` 目录（后端联调看 [给后端的前端速通](../basics/backend-to-frontend.md)）。

---

## 五、高频 Web API 速查

| API | 用途 | 示例 |
|-----|------|------|
| `IntersectionObserver` | 元素进入视口（懒加载/无限滚动） | `new IntersectionObserver(cb).observe(el)` |
| `URLSearchParams` | 解析/构造查询串 | `new URLSearchParams(location搜)` |
| `Clipboard` | 复制粘贴 | `navigator.clipboard.writeText('x')` |
| `WebSocket` | 全双工实时通信 | `new WebSocket('ws://...')` |
| `ResizeObserver` | 监听尺寸变化 | 响应式组件内部用 |
| `matchMedia` | JS 里读媒体查询 | `window.matchMedia('(max-width:768px)')` |
| `requestAnimationFrame` | 动画下一帧（比 setInterval 流畅） | 见性能章 |

!!! info "市场价值"
    `IntersectionObserver` 做图片懒加载和无限滚动是性能优化标配；`WebSocket` 是实时聊天/看板的基础。后端如果能懂这些，接口设计会更对路。

---

## 六、Web API 自检清单

- [ ] 会用 querySelector/querySelectorAll 操作 DOM
- [ ] 理解事件委托并在动态列表使用
- [ ] 区分 localStorage/sessionStorage/cookie 用途
- [ ] 会写带错误判断的 fetch
- [ ] 知道 IntersectionObserver / WebSocket 解决什么问题

> 进阶：异步机制见 [JS 高级进阶](advanced-topics.md)；性能见 [浏览器渲染与性能总纲](../performance.md)。

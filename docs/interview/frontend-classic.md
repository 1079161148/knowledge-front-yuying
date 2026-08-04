# 🏛️ 前端经典面试题

> 经久不衰、几乎逢面必问的「经典八股」。这些是**地基题**——答不流畅会直接被判定基础不牢。答案依据 **[MDN](https://developer.mozilla.org/zh-CN/)**、**[ECMA-262](https://tc39.es/ecma262/)**、**[HTML Living Standard](https://html.spec.whatwg.org/)**、**[CSSWG](https://www.w3.org/Style/CSS/)**。结合大厂（阿里/腾讯/字节/美团）历史真题整理。

---

## 1. 浏览器与网络经典题

#### Q1：从输入 URL 到页面展示，发生了什么？
- **DNS 解析**：URL → IP（浏览器缓存 → 系统缓存 → hosts → 本地 DNS → 根/顶级/权威 DNS，递归+迭代）。
- **TCP 三次握手**建立连接（HTTPS 还有 **TLS 握手**，1.2 为 2 个 RTT，1.3 可 1-RTT/0-RTT）。
- **发送 HTTP 请求**，服务器返回 HTML。
- **解析 HTML 构建 DOM**，解析 CSS 构建 **CSSOM**，两者合成 **Render Tree**。
- **Layout（重排）** 计算几何位置 → **Paint（重绘）** → **Composite（合成）** 送 GPU。
- **加载子资源**（JS/CSS/图片），JS 可能阻塞解析（无 `defer/async` 时）。
- 首屏渲染完成（FCP/LCP），后续 **TTI** 标记可交互。

#### Q2：HTTP 和 HTTPS 的区别？HTTPS 怎么保证安全？
- HTTP 明文传输；HTTPS = HTTP + **TLS**，加密 + 身份认证 + 完整性。
- 安全靠三层：**对称加密**（传输内容，快）、**非对称加密**（协商对称密钥）、**CA 证书**（防止中间人伪造公钥）。
- 握手流程：客户端发随机数+支持的套件 → 服务端返回证书+公钥 → 客户端校验证书 → 用公钥加密 premaster → 双方各自算出对称密钥。

#### Q3：GET 和 POST 的区别？
- 语义不同：GET 取资源、POST 提交资源（REST 语义）。
- 参数位置：GET 在 URL（有长度/历史记录限制），POST 在 body。
- 缓存：GET 可缓存、可书签，POST 一般不行。
- 幂等：GET 幂等，POST 不保证幂等。
- 底层：GET 只发一个 TCP 包（header），POST 发两个（header + body）——**这是历史实现细节，不是规范强制**，现代 fetch 不受此限。

#### Q4：什么是跨域？如何解决？
- 同源策略限制：协议/域名/端口任一不同即跨域，限制读取响应（非限制发送）。
- 解法：**CORS**（服务端 `Access-Control-Allow-Origin`，带 cookie 需 `withCredentials`+具体 origin）、**JSONP**（仅 GET、利用 `<script>` 不受同源限制）、**代理**（webpack/vite `proxy`、Nginx 反向代理）、**postMessage**（跨窗口）。

#### Q5：浏览器缓存机制（强缓存/协商缓存）？
- **强缓存**：`Cache-Control: max-age`（优先级高）、`Expires`（时间绝对）。命中不发起请求（200 from disk/memory cache）。
- **协商缓存**：`Last-Modified/If-Modified-Since`、`ETag/If-None-Match`（优先级高，更精准）。304 不传 body。
- 经典链路：先看强缓存 → 过期再看协商缓存 → 均无效才重新拉取。

## 2. JS 经典题

#### Q6：var、let、const 的区别？什么是暂时性死区？
- `var` 函数作用域、变量提升（初始化为 undefined）、可重复声明。
- `let/const` 块级作用域、存在**暂时性死区（TDZ）**——声明前访问报错；`const` 常量绑定不可重赋（对象内部可改）。
- 全局 `let/const` 不挂到 `window`。

#### Q7：什么是闭包？有什么用和坑？
- 函数能访问其**词法作用域**外的变量，即使外层已执行完——因作用域链被保留。
- 用途：模块私有变量、柯里化、防抖节流、`React` 老式 `useState` 模拟实例变量。
- 坑：不当持有大对象导致**内存泄漏**；循环中用 `var` 取错值（用 `let` 解决）。

#### Q8：原型链是什么？如何实现继承？
- 每个对象有 `__proto__` 指向构造函数的 `prototype`；访问属性沿原型链向上找，顶端是 `Object.prototype`（→ `null`）。
- `class` 语法糖底层仍是原型；继承推荐 `class extends`，ES5 用**寄生组合继承**（避免父类构造函数调两次）。

#### Q9：深浅拷贝的区别与实现？
- **浅拷贝**：只复制第一层引用（`Object.assign`、`{...obj}`、`slice`）。
- **深拷贝**：递归复制所有层级。手写：`JSON.parse(JSON.stringify())`（丢函数/undefined/Symbol/循环引用/Date 变字符串）；生产用 **structuredClone**（原生，支持循环引用），或 `lodash.cloneDeep`。

#### Q10：事件循环（Event Loop）机制？
- 宏任务：`script`、setTimeout、setInterval、I/O、UI 渲染、MessageChannel。
- 微任务：Promise.then、MutationObserver、queueMicrotask。
- 规则：**每轮先执行一个宏任务 → 清空所有微任务 → 渲染 → 下一个宏任务**。async 函数里 `await` 之后代码进微任务。

## 3. CSS 经典题

#### Q11：盒模型？标准盒 vs IE 盒？
- `box-sizing: content-box`（默认，width 仅内容）vs `border-box`（width 含 padding+border）。推荐全局 `border-box`。

#### Q12：BFC 是什么？解决什么问题？
- Block Formatting Context：独立渲染区域，内部不影响外部。
- 触发：`overflow≠visible`、`float`、`position:absolute/fixed`、`display:flex/grid/inline-block`。
- 解决：外边距塌陷、清除浮动、阻止文字环绕、两栏自适应（一侧 float 一侧 BFC）。

#### Q13：px / em / rem / vw 的区别？
- `px` 绝对像素；`em` 相对父字体；`rem` 相对根字体（移动端适配常用，配合 `postcss-pxtorem`）；`vw/vh` 相对视口（配合 `postcss-px-to-viewport`）。

#### Q14：Flex 和 Grid 怎么选？
- **Flex**：一维（行或列）布局，适合组件内排列。
- **Grid**：二维（行列同时）布局，适合整体页面骨架。

## 4. 框架经典题

#### Q15：Vue 响应式原理（2 vs 3）？
- Vue2：`Object.defineProperty` 递归劫持，**无法监听新增/删除属性**（需 `Vue.set`），数组需重写方法。
- Vue3：`Proxy` 代理整个对象，**懒代理**（访问才递归）、可监听新增/删除/数组索引；`Reflect` 配合避免 this 问题。

#### Q16：React 虚拟 DOM 与 Diff 算法？
- 用 JS 对象描述 UI，更新时比对新旧 vnode 生成最小 patch。
- Diff 策略：**同层比较**（不跨层）、**key 复用**（列表必须加 key 否则就地复用错位）、**组件类型不同直接重建**。
- Fiber 把渲染拆成可中断的小任务，配合调度实现并发渲染。

## 5. 经典手写题

#### Q17：手写防抖（debounce）与节流（throttle）？
```js
function debounce(fn, wait = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait); // 停止触发 wait 后才执行
  };
}
function throttle(fn, wait = 300) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= wait) { fn.apply(this, args); last = now; } // 每隔 wait 最多一次
  };
}
```

#### Q18：手写 Promise.all？
```js
function promiseAll(promises) {
  return new Promise((resolve, reject) => {
    const res = []; let count = 0;
    promises.forEach((p, i) => {
      Promise.resolve(p).then(v => {
        res[i] = v;                       // 保持顺序
        if (++count === promises.length) resolve(res);
      }, reject);                         // 一个失败则整体失败
    });
    if (promises.length === 0) resolve(res);
  });
}
```

## 6. 下一步

- 核心深挖看 [前端核心面试题](frontend-core.md)、高频场景看 [前端高频面试题](frontend-high-freq.md)。
- 实战翻车看 [前端踩坑经验面试题](frontend-pitfalls.md)；框架深入看 [框架面试题（深化）](frontend-framework-deep.md)。
- 工具链/插件看 [常用插件 / 第三方库面试题](frontend-plugins.md)。

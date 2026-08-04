# 🧰 正则与错误处理实战（面试高频）

> 接续 [JS 高级进阶](advanced-topics.md)。本篇补齐两块**市面招聘/面试必考但常被忽略**的硬通货：正则表达式实战、错误与异常处理的工程化写法。依据 **ECMA-262（RegExp）**、**WHATWG / W3C 错误事件规范**、**MDN**。
>
> 适用：所有级别——初级写表单校验、中级写解析器、高级设计错误上报。

---

## 一、正则表达式（RegExp）实战

### 1. 基础语法速查

```js
// 创建
const re1 = /ab+c/i;                 // 字面量（编译期固定）
const re2 = new RegExp('ab+c', 'i'); // 构造器（可动态拼接，注意转义翻倍）

// 常用元字符
// \d 数字  \w 单词字符  \s 空白  . 任意(除换行)
// * 0+  + 1+  ? 0/1  {n} {n,} {n,m}
// ^ 开头  $ 结尾  (...) 分组  (?:...) 非捕获  (?=) 正向预查
```

### 2. 表单校验实战（最常用）

```js
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const isPhoneCN = (s) => /^1[3-9]\d{9}$/.test(s);
const hasNum = (s) => /\d/.test(s);          // 密码含数字
const strongPwd = (s) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(s);
```

!!! danger "死角 1：正则默认不匹配换行与全局状态"
    - `.` 不匹配换行；多行匹配加 `s` 修饰符（dotAll），逐行匹配加 `m`。
    - **带 `g` 修饰符的 `RegExp` 有 `lastIndex` 状态**：同一个正则对象连续 `test` 会从上次位置继续，导致结果诡异。校验用就不要加 `g`，或每次 `new RegExp`。

!!! danger "死角 2：特殊字符要转义"
    `.` `*` `+` `?` `(` `)` `[` `]` `{` `}` `|` `\` `^` `$` 在字面量里要加 `\`。从用户输入拼正则务必 `RegExp.escape`（或手动转义）防 ReDoS（正则拒绝服务）。

### 3. 提取与替换

```js
'name=鱼樱&age=18'.match(/(\w+)=([^&]+)/g);   // 提取键值对
'2026-07-31'.replace(/(\d{4})-(\d{2})-(\d{2})/, '$2/$3/$1'); // 31/07/2026
'  hi  '.trim();                              // 去首尾空白（ES5）
```

!!! tip "ReDoS 风险"
    灾难性回溯：`^(a+)+$` 对 `"aaaaaaaaaaaaaaaaaaaa!"` 会指数级回溯卡死主线程。用户输入进正则前转义、避免嵌套量词。

---

## 二、错误处理与异常实战

### 1. try / catch / finally 正确姿势

```js
try {
  const data = JSON.parse(maybeBad);   // 可能抛 SyntaxError
} catch (e) {
  if (e instanceof SyntaxError) { /* 特定处理 */ }
  else throw e;                         // 不认识的继续抛
} finally {
  cleanup();                            // 无论成败都执行（释放资源）
}
```

!!! danger "死角 3：catch 里吞错"
    空 `catch (e) {}` 会静默吞掉所有错误，调试地狱。至少 `console.error` 或上报。async 函数未捕获的 reject 会变"未处理 rejection"。

### 2. 自定义错误类型

```js
class ValidationError extends Error {
  constructor(msg) { super(msg); this.name = 'ValidationError'; }
}
throw new ValidationError('邮箱格式错误');
```

### 3. 全局兜底（生产必接）

```js
window.addEventListener('error', (e) => report(e.error));          // 运行时错误
window.addEventListener('unhandledrejection', (e) => report(e.reason)); // Promise 未捕获
```

!!! danger "死角 4：跨域脚本只报 Script error."
    跨域 `<script>` 报错只有 `Script error.`。需脚本加 `crossorigin` 属性且服务器返回 CORS 头，才能拿到完整堆栈。

!!! warning "生产环境"
    错误应聚合上报（Sentry / 自建采集），别 `console.log` 裸奔；同时**别把敏感信息（token/手机号）带进错误堆栈**。

---

## 三、正则与错误处理自检清单

- [ ] 会用正则做邮箱/手机/密码强度校验
- [ ] 知道 `g` 修饰符的 `lastIndex` 陷阱
- [ ] 用户输入进正则前会转义（防 ReDoS）
- [ ] `try/catch` 不空吞、会区分错误类型
- [ ] 全局监听 `error` / `unhandledrejection` 做上报
- [ ] 自定义 `Error` 子类表达业务异常

> 衔接：Promise/async 的错误链见 [JS 高级进阶](advanced-topics.md)；安全性（XSS 注入用户输入）见 [前端安全全集](../security/index.md)（OWASP Top 10）。

# 🎨 JavaScript 设计模式实战（中级·面试高频）

> 接续 [正则与错误处理](regex-error.md)。设计模式是"把重复出现的问题，用被验证过的结构化解法"。本篇讲前端最常用、面试最高频的 7 种，全部给可运行 JS 实现。依据 **GoF《设计模式》**、**ECMA-262**、**MDN**。
>
> 适用：初级看懂结构、中级在业务抽象中落地、高级用于框架源码阅读（Vue/React 大量使用观察者、发布订阅、工厂）。

---

## 一、为什么要学（市场视角）

| 场景 | 用到的模式 |
|------|-----------|
| 组件通信 / 状态管理（Vuex/Pinia/Redux） | 发布订阅、观察者 |
| 全局唯一实例（router / store / 弹窗） | 单例 |
| 跨端/多主题/多图表创建 | 工厂 |
| 表单校验 / 打折策略 | 策略 |
| undo/redo、路由历史 | 命令、备忘录 |
| 组件树递归渲染 | 组合 |

---

## 二、发布订阅（Pub/Sub）

```js
class EventBus {
  constructor() { this.map = new Map(); }
  on(type, fn) {
    if (!this.map.has(type)) this.map.set(type, new Set());
    this.map.get(type).add(fn);
    return () => this.off(type, fn);   // 返回取消订阅
  }
  off(type, fn) { this.map.get(type)?.delete(fn); }
  emit(type, ...args) { this.map.get(type)?.forEach(fn => fn(...args)); }
}
const bus = new EventBus();
bus.on('login', (u) => console.log('用户登录:', u));
bus.emit('login', { id: 1 });
```

!!! danger "死角 1：忘记取消订阅 = 内存泄漏"
    组件卸载（尤其 Vue `onUnmounted` / React `useEffect` cleanup）必须 `off` 或调用返回的取消函数，否则回调引用组件 → 组件无法被回收。

!!! tip "与观察者模式的区别"
    - 发布订阅：有**中间人（EventBus）**，发布者不认识订阅者（解耦更强）。
    - 观察者：Subject 直接维护 Observer 列表，`subject.notify()` 直推。Vue 响应式是**观察者**（dep 收集 watcher）。

---

## 三、观察者（Observer）

```js
class Subject {
  constructor() { this.observers = []; }
  subscribe(o) { this.observers.push(o); }
  notify(data) { this.observers.forEach(o => o.update(data)); }
}
class Observer { update(d) { console.log('收到:', d); } }
```

---

## 四、单例（Singleton）

```js
class Singleton {
  static instance;
  static getInstance() {
    if (!Singleton.instance) Singleton.instance = new Singleton();
    return Singleton.instance;
  }
}
```
ESM 天然单例：`export const store = reactive({...})` 模块级只执行一次，导入即同一实例。**现代项目多用 ESM 导出代替 class 单例**。

!!! danger "死角 2：单例难测试"
    全局状态导致测试互相污染。测试用依赖注入（传参）替代直接 import 单例，或用 `vi.resetModules()`。

---

## 五、工厂（Factory）

```js
function createChart(type) {
  switch (type) {
    case 'line': return new LineChart();
    case 'bar':  return new BarChart();
    default: throw new Error('未知图表');
  }
}
const c = createChart('line');
```
函数式替代：直接 `const factories = { line: LineChart, bar: BarChart }; factories[type]()`，避免 switch 膨胀。

---

## 六、策略（Strategy）

```js
const strategies = {
  vip: (p) => p * 0.8,
  svip: (p) => p * 0.7,
  normal: (p) => p,
};
function calc(role, price) { return strategies[role](price); }
```
消灭 `if/else` 分支堆，新增策略只加对象一项。

---

## 七、代理（Proxy，ES6 原生）

```js
const target = { name: '鱼樱' };
const proxy = new Proxy(target, {
  get(t, k) { console.log('读取', k); return t[k]; },
  set(t, k, v) { console.log('写入', k); t[k] = v; return true; },
});
```
Vue3 响应式核心就是 `Proxy`。拦截可做缓存、校验、日志、懒加载。

!!! danger "死角 3：Proxy 不递归代理嵌套对象"
    默认只代理第一层，访问内层属性返回的是原对象而非 proxy。需 `get` 中递归 `new Proxy`，即 Vue3 `reactive` 的懒代理逻辑。

---

## 八、装饰器（Decorator，Stage 3 / TS 支持）

```ts
function log(target, key, desc) {
  const fn = desc.value;
  desc.value = function (...args) {
    console.log('call', key); return fn.apply(this, args);
  };
}
class Svc { @log fetch() {} }
```
TS 中 `experimentalDecorators` 开启；NestJS 的 `@Controller` `@Injectable` 即此思路。

---

## 九、设计模式自检清单

- [ ] 能手写 EventBus（发布订阅）并正确取消订阅
- [ ] 说清发布订阅 vs 观察者
- [ ] 单例的两种实现（class / ESM）与测试陷阱
- [ ] 工厂/策略消灭 if-else 的实战
- [ ] 理解 Proxy 是 Vue3 响应式基石、不递归代理的坑
- [ ] 看 Vue/React 源码能认出对应模式

> 衔接：响应式原理（Proxy/观察者）见 [框架进阶](../framework-compare/advanced/index.md)；状态管理见 [状态管理对比](../framework-compare/state-management/index.md)；算法手写见 [数据结构与算法 JS 实现](dsa-js.md)。

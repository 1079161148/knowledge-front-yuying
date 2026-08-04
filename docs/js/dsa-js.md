# 🧮 数据结构与算法 JS 实现（校招·中高级面试）

> 接续 [设计模式](design-patterns.md)。本篇用 JS 手写最核心的数据结构与算法——这是校招笔试、中高级面试手写题的硬通货。依据 **ECMA-262**、**《算法导论》经典范式**、**MDN**。所有示例纯前端可运行。
>
> 适用：初级建立计算思维、中级刷面试、高级优化复杂度。

---

## 一、复杂度（先会算）

- **时间**：O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ)
- **空间**：权衡"时间换空间"还是"空间换时间"
- 数组 `push/pop` O(1)，`shift/unshift/splice` O(n)（要移动元素）

!!! danger "死角 1：数组头部操作很慢"
    `arr.shift()` 触发全体前移 O(n)。高频头部操作改用 `Map`/`链表` 或双端队列结构。

---

## 二、线性结构：栈 / 队列 / 链表

### 栈（LIFO）

```js
class Stack {
  items = [];
  push(x) { this.items.push(x); }
  pop() { return this.items.pop(); }
  peek() { return this.items.at(-1); }
  get size() { return this.items.length; }
}
```
**应用**：函数调用栈、撤销(undo)、括号匹配。

### 队列（FIFO）

```js
class Queue {
  items = [];
  enqueue(x) { this.items.push(x); }
  dequeue() { return this.items.shift(); }   // O(n)，大数据用双指针优化
}
```

### 单链表

```js
class Node { constructor(v) { this.val = v; this.next = null; } }
class List {
  head = null;
  append(v) {
    const n = new Node(v);
    if (!this.head) { this.head = n; return; }
    let p = this.head; while (p.next) p = p.next; p.next = n;
  }
  reverse() {               // 反转链表（面试超高频）
    let prev = null, cur = this.head;
    while (cur) { const next = cur.next; cur.next = prev; prev = cur; cur = next; }
    this.head = prev;
  }
}
```

!!! danger "死角 2：链表反转别丢引用"
    反转时必须先存 `next` 再改 `cur.next`，否则断链后找不到后续节点。

---

## 三、树：二叉树与遍历

```js
class TreeNode { constructor(v) { this.val = v; this.left = null; this.right = null; } }

// 前序（根左右）
function preorder(root, out = []) {
  if (!root) return out;
  out.push(root.val); preorder(root.left, out); preorder(root.right, out);
  return out;
}
// 层序（BFS，队列）
function levelOrder(root) {
  const res = [], q = [root];
  while (q.length) {
    const n = q.shift(); res.push(n.val);
    if (n.left) q.push(n.left); if (n.right) q.push(n.right);
  }
  return res;
}
```

!!! tip "遍历速记"
    前/中/后序区别只在**根**的位置（根在左前=前序，根在中间=中序，根在右后=后序）；左右始终先左后右。

---

## 四、排序（手写三种足矣）

| 算法 | 平均 | 稳定 | 说明 |
|------|------|------|------|
| 冒泡 | O(n²) | 是 | 教学用，相邻交换 |
| 快速 | O(n log n) | 否 | 分治+基准，面试常考 |
| 归并 | O(n log n) | 是 | 分治+合并，链表排序首选 |

```js
// 快速排序
function quick(arr) {
  if (arr.length < 2) return arr;
  const [pivot, ...rest] = arr;
  const left = rest.filter(x => x < pivot);
  const right = rest.filter(x => x >= pivot);
  return [...quick(left), pivot, ...quick(right)];
}
```
!!! danger "死角 3：[...rest].filter 多次遍历"
    示意写法清晰但空间 O(n)；原地 partition 版才省内存，面试能写原地版加分。

---

## 五、递归与动态规划

```js
// 斐波那契（带记忆化，避免指数爆炸）
const memo = new Map();
function fib(n) {
  if (n < 2) return n;
  if (memo.has(n)) return memo.get(n);
  return memo.set(n, fib(n - 1) + fib(n - 2)).get(n);
}
```
!!! danger "死角 4：递归爆栈"
    深度过大会 `Maximum call stack size exceeded`。超大输入改迭代或尾递归（JS 多数引擎未优化尾调用）。

---

## 六、算法自检清单

- [ ] 能手写栈/队列/链表反转
- [ ] 二叉树前/中/后序与层序遍历
- [ ] 快排 / 归并思路与复杂度
- [ ] 记忆化 DP 解决重复子问题
- [ ] 知道递归爆栈与 O(n) 头部操作陷阱

> 衔接：函数调用栈与事件循环见 [JS 高级进阶](../js/advanced-topics.md)；面试真题汇总见 [面试专题](../interview/index.md)。
